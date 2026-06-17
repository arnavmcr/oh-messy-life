"""
Ticket Ticker pipeline — CLI entry point.

Runs all four stages:
  1. load & dedup (WhatsApp .txt exports → new messages only)
  2. extract (Claude API → structured records)
  3. cleanup (normalize, dedup fingerprints)
  4. merge + export (compact JSON for frontend)

Usage:
  python scripts/ticket_ticker/pipeline.py --exports export1.txt export2.txt
  python scripts/ticket_ticker/pipeline.py --exports new.txt --existing content/ticket-ticker.json
  python scripts/ticket_ticker/pipeline.py --seed baseline.csv --output content/ticket-ticker.json
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

from scripts.ticket_ticker.config import (
    CHUNK_SIZE,
    MAX_RETRIES,
    RETRY_DELAY,
    SAVE_EVERY_N_CHUNKS,
    MAX_MESSAGE_LENGTH,
    MAX_TOKENS,
    MODEL,
)
from scripts.ticket_ticker.utils import (
    is_noise,
    message_hash,
    cleanup_records,
    create_dedupe_fingerprint,
)

# ── WhatsApp parse regex ───────────────────────────────────────────────────────

WHATSAPP_PATTERN = re.compile(
    r'\[(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*[AaPp][Mm])\]\s*([^:]+):\s*(.*)',
    re.DOTALL,
)
# Matches lines that start with a timestamp but have no sender:content (system messages)
_TIMESTAMP_PREFIX = re.compile(r'^\[\d{1,2}/\d{1,2}/\d{2,4},')

# ── Stage 1: Parse WhatsApp exports ──────────────────────────────────────────


def _parse_date(date_str: str) -> str:
    """Normalise WhatsApp date to YYYY-MM-DD."""
    for fmt in ("%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return date_str.strip()


def _parse_time(time_str: str) -> str:
    """Normalise WhatsApp time to HH:MM:SS (24hr)."""
    t = time_str.strip()
    for fmt in ("%I:%M:%S %p", "%I:%M %p"):
        try:
            return datetime.strptime(t, fmt).strftime("%H:%M:%S")
        except ValueError:
            continue
    return t


def parse_line(line: str) -> dict | None:
    m = WHATSAPP_PATTERN.match(line)
    if not m:
        return None
    date_str, time_str, sender, content = m.group(1), m.group(2), m.group(3), m.group(4)
    date = _parse_date(date_str)
    time_norm = _parse_time(time_str)
    return {
        "date": date,
        "time": time_norm,
        "timestamp": f"{date} {time_norm}",
        "sender": sender.strip(),
        "content": content.strip(),
    }


def load_messages(filepath: str) -> list[dict]:
    """Parse a WhatsApp .txt export → list of message dicts."""
    content = None
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            with open(filepath, encoding=encoding) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue

    if content is None:
        print(f"[SKIP] Could not read {filepath} with any encoding")
        return []

    messages: list[dict] = []
    current: dict | None = None

    for line in content.splitlines():
        parsed = parse_line(line)
        if parsed:
            if current:
                messages.append(current)
            current = parsed
        elif current and line.strip():
            # Skip system messages that have a timestamp prefix but no sender:content colon
            if _TIMESTAMP_PREFIX.match(line):
                continue
            current["content"] = current["content"] + "\n" + line

    if current:
        messages.append(current)

    # Filter noise and empty content
    filtered = []
    for msg in messages:
        c = msg.get("content", "").strip()
        if not c:
            continue
        if is_noise(c):
            continue
        msg["content"] = c
        # Rename keys to match pipeline conventions
        msg["message_date"] = msg.pop("date")
        msg["message_time"] = msg.pop("time")
        msg["sender_name"] = msg.pop("sender")
        msg["original_message"] = msg["content"].replace("\n", " | ")
        filtered.append(msg)

    return filtered


def normalize_for_hash_simple(text: str) -> str:
    """Simple normalisation for within-file dedup."""
    return " ".join(text.lower().split())

# ── Stage 2: Claude API extraction ───────────────────────────────────────────

EXTRACTION_PROMPT = """Extract buy/sell ticket requests from WhatsApp messages.

Return JSON array with objects:
{
  "message_index": <number in brackets>,
  "message_type": "BUY" or "SELL",
  "event_name": "include year for festivals like Lollapalooza 2026",
  "event_date": "YYYY-MM-DD or null",
  "num_tickets": number or null,
  "price_per_ticket": INR number or null,
  "original_price": cost price or null,
  "price_type": "fixed"/"negotiable"/"at_cost"/"budget" or null,
  "ticket_category": "GA"/"VIP"/"Gold"/"Silver"/"Platinum" etc or null,
  "location": "city" or null,
  "confidence": 0.0-1.0
}

RULES:
- WTB/Looking for/Need = BUY
- WTS/Selling/Looking to sell = SELL
- +1/Same = new record (confidence 0.7)
- Skip: banter, questions, links

Return ONLY JSON array. No markdown."""


def format_for_prompt(messages: list[dict]) -> str:
    lines = []
    for i, msg in enumerate(messages):
        content = msg["content"][:MAX_MESSAGE_LENGTH]
        ts = msg.get("timestamp", "")
        sender = msg.get("sender_name", "")
        lines.append(f"[{i}] [{ts}] {sender}: {content}")
    return "\n".join(lines)


def try_parse_json(text: str) -> list | None:
    # Attempt 1: raw parse
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass

    # Attempt 2: strip markdown code fences
    stripped = re.sub(r'```(?:json)?\n?', '', text).strip()
    try:
        result = json.loads(stripped)
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass

    # Attempt 3: extract [...] substring
    m = re.search(r'\[.*\]', text, re.DOTALL)
    if m:
        try:
            result = json.loads(m.group(0))
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass

    return None


def extract_chunk(
    messages: list[dict],
    chunk_num: int,
    total_chunks: int,
    offset: int,
    client,
) -> tuple[list | None, str | None]:
    """Extract one chunk via Claude API. Returns (records, error_message)."""
    prompt_text = format_for_prompt(messages)

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                messages=[
                    {"role": "user", "content": f"{EXTRACTION_PROMPT}\n\nMessages:\n{prompt_text}"}
                ],
            )
            raw = response.content[0].text
            records = try_parse_json(raw)
            if records is None:
                err = f"chunk {chunk_num}: JSON parse failed (attempt {attempt + 1})"
                if attempt < MAX_RETRIES:
                    print(f"  [RETRY] {err}")
                    time.sleep(RETRY_DELAY)
                    continue
                return None, err

            # Attach source metadata to each extracted record
            enriched = []
            for rec in records:
                idx = rec.get("message_index")
                if idx is not None and 0 <= idx < len(messages):
                    src = messages[idx]
                    rec["message_date"] = src.get("message_date", "")
                    rec["message_time"] = src.get("message_time", "")
                    rec["timestamp"] = src.get("timestamp", "")
                    rec["sender_name"] = src.get("sender_name", "")
                    rec["original_message"] = src.get("original_message", "")
                    rec["message_hash"] = src.get("message_hash", "")
                    rec["source_file"] = src.get("source_file", "")
                    rec["is_duplicate"] = False
                enriched.append(rec)

            print(f"  [OK] chunk {chunk_num}/{total_chunks} — {len(enriched)} records")
            return enriched, None

        except Exception as e:
            err = f"chunk {chunk_num}: API error — {e}"
            if attempt < MAX_RETRIES:
                print(f"  [RETRY] {err}")
                time.sleep(RETRY_DELAY)
            else:
                return None, err

    return None, f"chunk {chunk_num}: exhausted retries"


def extract_all(messages: list[dict], client) -> list[dict]:
    """Run extraction on all messages in chunks. Saves progress periodically."""
    chunks = [messages[i:i + CHUNK_SIZE] for i in range(0, len(messages), CHUNK_SIZE)]
    total = len(chunks)
    all_records: list[dict] = []
    failed: list[dict] = []

    for i, chunk in enumerate(chunks, start=1):
        records, error = extract_chunk(chunk, i, total, (i - 1) * CHUNK_SIZE, client)

        if records is None:
            print(f"  [FAIL] {error}")
            failed.append({"chunk": i, "messages": chunk, "error": error})
        else:
            all_records.extend(records)

        if i % SAVE_EVERY_N_CHUNKS == 0:
            _save_progress(all_records, failed)

    if failed:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = f"failed_chunks_{ts}.json"
        with open(path, "w") as f:
            json.dump(failed, f, indent=2)
        print(f"[WARN] {len(failed)} failed chunks saved to {path}")

    return all_records


def _save_progress(records: list, failed: list) -> None:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f"extracted_{ts}.json", "w") as f:
        json.dump(records, f, indent=2)

# ── Stage 4: Merge + export ───────────────────────────────────────────────────


def _to_num(val) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return f if not (f != f) else None  # NaN check
    except (ValueError, TypeError):
        return None


def to_compact_record(r: dict) -> dict:
    """Project a full pipeline record to the compact frontend schema (11 fields)."""
    original_price = _to_num(r.get("original_price"))
    return {
        "event": r.get("event_name_normalized") or r.get("event_name") or "",
        "location": r.get("location") or None,
        "type": (r.get("message_type") or "").upper(),
        "price": _to_num(r.get("price_per_ticket")),
        "original_price_inferred": original_price,
        "price_inference_source": "explicit" if original_price is not None else None,
        "message_date": r.get("message_date") or "",
        "event_date": r.get("event_date") or None,
        "num_tickets": _to_num(r.get("num_tickets")),
        "category": r.get("ticket_category") or None,
        "message_hash": r.get("message_hash") or "",
    }


# ── Stage 3.5: Dataset inference ─────────────────────────────────────────────


def run_price_inference(records: list[dict]) -> list[dict]:
    """Fill original_price_inferred for SELL records missing it from same (event, category) pair.

    Strategy: use the first explicit price found per (event, category) pair.
    Multiple explicit prices are not averaged — first-found wins because the
    distribution within a category is narrow and averaging adds little value.
    """
    # Build lookup: (event, category) → first explicit original_price_inferred
    index: dict[tuple, float] = {}
    for r in records:
        if (
            r.get("type", "").upper() == "SELL"
            and r.get("original_price_inferred") is not None
            and r.get("price_inference_source") == "explicit"
        ):
            key = (r.get("event"), r.get("category"))
            if key not in index:
                index[key] = r["original_price_inferred"]

    # Fill missing prices for SELL records
    filled = 0
    for r in records:
        if r.get("type", "").upper() == "SELL" and r.get("original_price_inferred") is None:
            key = (r.get("event"), r.get("category"))
            if key in index:
                r["original_price_inferred"] = index[key]
                r["price_inference_source"] = "dataset"
                filled += 1

    print(f"  [inference] filled {filled} SELL records via dataset inference")
    return records


def load_existing_json(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
    except (json.JSONDecodeError, OSError):
        print(f"[WARN] Could not load existing file: {path}")
    return []


def write_output(records: list[dict], output_path: str) -> None:
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)
    print(f"[OK] Wrote {len(records)} records to {output_path}")

# ── Seed mode: CSV → JSON ─────────────────────────────────────────────────────


def _csv_row_to_pipeline_record(row: dict) -> dict:
    """Map a 19-column Colab CSV row to the internal pipeline record format."""
    return {
        "message_date": row.get("message_date", ""),
        "message_time": row.get("message_time", ""),
        "timestamp": row.get("timestamp", ""),
        "sender_name": row.get("sender_name", ""),
        "message_type": row.get("message_type", ""),
        "event_name": row.get("event_name", ""),
        "event_name_normalized": row.get("event_name_normalized", ""),
        "pass_type": row.get("pass_type", ""),
        "event_date": row.get("event_date", ""),
        "num_tickets": row.get("num_tickets"),
        "price_per_ticket": row.get("price_per_ticket"),
        "original_price": row.get("original_price"),
        "price_type": row.get("price_type", ""),
        "ticket_category": row.get("ticket_category_normalized") or row.get("ticket_category", ""),
        "location": row.get("location", ""),
        "confidence": row.get("confidence", "0"),
        "source_file": row.get("source_file", ""),
        "is_duplicate": row.get("is_duplicate", "False").lower() == "true",
        "original_message": row.get("original_message", ""),
        "message_hash": message_hash(
            row.get("sender_name", ""),
            row.get("original_message", ""),
        ),
    }


def _migrate_old_record(r: dict) -> dict:
    """Migrate a 7-field old-schema compact record to the new 11-field schema."""
    old_price = _to_num(r.get("originalPrice"))
    return {
        "event": r.get("event", ""),
        "location": None,
        "type": r.get("type", ""),
        "price": _to_num(r.get("price")),
        "original_price_inferred": old_price,
        "price_inference_source": "explicit" if old_price is not None else None,
        "message_date": r.get("message_date", ""),
        "event_date": None,
        "num_tickets": None,
        "category": r.get("category") or None,
        "message_hash": r.get("message_hash", ""),
    }


def _is_valid_date(s: str) -> bool:
    """Return True if s is a YYYY-MM-DD string (not a stray header row)."""
    try:
        datetime.strptime(s.strip(), "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False


POST_JAN27_CUTOFF = "2026-01-27"


def run_seed(seed_csv: str, existing_path: str | None, output_path: str) -> None:
    """Reseed content/ticket-ticker.json using the Expanded CSV + post-Jan-27 carry-forward.

    Strategy:
    1. Load Expanded CSV (Nov 2023 – Jan 27) → new-schema baseline via pipeline.
    2. Load current JSON → extract post-Jan-27 records → migrate to new schema.
    3. Merge: CSV-derived records + migrated post-Jan-27. CSV takes precedence on hash collision.
    4. Dedup by message_hash, write output.
    """
    print(f"\n─── Seed mode: {seed_csv} ───")

    # ── Step 1: CSV → new-schema compact records ──────────────────────────────
    rows: list[dict] = []
    with open(seed_csv, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip stray repeated-header rows
            if not _is_valid_date(row.get("message_date", "")):
                continue
            rows.append(row)
    print(f"  Loaded {len(rows)} valid rows from CSV")

    pipeline_records = [_csv_row_to_pipeline_record(r) for r in rows]
    cleaned = cleanup_records(pipeline_records)

    # Dedup within CSV by message_hash (first occurrence wins)
    seen_hashes: set[str] = set()
    deduped_csv: list[dict] = []
    for r in cleaned:
        h = r.get("message_hash", "")
        if h and h not in seen_hashes:
            seen_hashes.add(h)
            deduped_csv.append(r)

    # Filter by confidence
    high_conf = [
        r for r in deduped_csv
        if (_to_num(r.get("confidence")) or 0) >= 0.6
    ]
    print(f"  {len(high_conf)} records at confidence ≥ 0.6 after CSV dedup")

    # Convert all to compact, then run inference over the full batch for best coverage
    all_csv_compact = [to_compact_record(r) for r in deduped_csv]
    run_price_inference(all_csv_compact)
    compact_by_hash = {r["message_hash"]: r for r in all_csv_compact}

    # Keep only high-confidence records for the output
    csv_compact = [
        compact_by_hash[r["message_hash"]]
        for r in high_conf
        if r.get("message_hash") in compact_by_hash
    ]

    # ── Step 2: post-Jan-27 carry-forward from current JSON ───────────────────
    post_jan27: list[dict] = []
    if existing_path:
        current = load_existing_json(existing_path)
        old_post = [r for r in current if r.get("message_date", "") > POST_JAN27_CUTOFF]
        post_jan27 = [_migrate_old_record(r) for r in old_post]
        print(f"  {len(post_jan27)} post-Jan-27 records migrated from existing JSON")

    # ── Step 3: Merge — CSV baseline takes precedence on hash collision ───────
    # Build combined list; then dedup preserving CSV-first order
    all_records = csv_compact + post_jan27
    final: list[dict] = []
    final_hashes: set[str] = set()
    for r in all_records:
        h = r.get("message_hash", "")
        if h not in final_hashes:
            final_hashes.add(h)
            final.append(r)
    print(f"  {len(final)} total records after merge and dedup")

    # ── Step 4: Coverage report ───────────────────────────────────────────────
    sell_total = sum(1 for r in final if r.get("type") == "SELL")
    sell_with_price = sum(
        1 for r in final
        if r.get("type") == "SELL" and r.get("original_price_inferred") is not None
    )
    if sell_total > 0:
        coverage = sell_with_price / sell_total * 100
        print(f"  SELL price coverage: {sell_with_price}/{sell_total} = {coverage:.1f}%")

    write_output(final, output_path)

# ── Main pipeline ─────────────────────────────────────────────────────────────


def run_pipeline(
    export_paths: list[str],
    existing_path: str | None,
    output_path: str,
) -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[ERROR] ANTHROPIC_API_KEY environment variable not set")
        sys.exit(1)

    try:
        import anthropic
    except ImportError:
        print("[ERROR] anthropic package not installed. Run: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Load existing records and build hash set
    existing = load_existing_json(existing_path) if existing_path else []
    existing_hashes = {r.get("message_hash", "") for r in existing if r.get("message_hash")}
    print(f"  Loaded {len(existing)} existing records ({len(existing_hashes)} hashes)")

    # Stage 1 — load & dedup across all exports
    print("\n─── Stage 1: Load & dedup ───")
    seen_in_run: set[str] = set()
    new_messages: list[dict] = []

    for fp in export_paths:
        if not os.path.exists(fp):
            print(f"[SKIP] File not found: {fp}")
            continue
        msgs = load_messages(fp)
        new_count = 0
        for msg in msgs:
            h = message_hash(msg["sender_name"], msg["content"])
            if h in existing_hashes or h in seen_in_run:
                continue
            seen_in_run.add(h)
            msg["message_hash"] = h
            msg["source_file"] = os.path.basename(fp)
            new_messages.append(msg)
            new_count += 1
        print(f"  [OK] {fp}: {len(msgs)} parsed, {new_count} new")

    if not new_messages:
        print("[SKIP] All messages already in existing dataset — writing existing records unchanged")
        write_output(existing, output_path)
        return

    print(f"\n  Total new messages: {len(new_messages)}")

    # Stage 2 — extract via Claude API
    print("\n─── Stage 2: Extract via Claude API ───")
    extracted = extract_all(new_messages, client)
    print(f"  Extracted {len(extracted)} records from {len(new_messages)} messages")

    # Stage 3 — cleanup
    print("\n─── Stage 3: Cleanup & normalize ───")
    cleaned = cleanup_records(extracted)
    deduped = [r for r in cleaned if not r.get("is_duplicate")]
    print(f"  {len(deduped)} records after dedup ({len(cleaned) - len(deduped)} flagged)")

    # Stage 3.5 — dataset price inference
    print("\n─── Stage 3.5: Price inference ───")
    # Inference runs on compact records; build lookup from the full cleaned set
    all_compact = [to_compact_record(r) for r in deduped]
    run_price_inference(all_compact)
    compact_by_hash = {r["message_hash"]: r for r in all_compact}

    # Stage 4 — merge + export
    print("\n─── Stage 4: Merge & export ───")
    high_conf = [
        r for r in deduped
        if (_to_num(r.get("confidence")) or 0) >= 0.6
    ]
    print(f"  {len(high_conf)} records at confidence ≥ 0.6")

    new_compact = [
        compact_by_hash[r["message_hash"]]
        for r in high_conf
        if r.get("message_hash") in compact_by_hash
    ]
    merged = existing + new_compact
    write_output(merged, output_path)
    print(f"\n[OK] Done. {len(new_compact)} new records added, {len(merged)} total.")

# ── Entry point ───────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ticket Ticker pipeline — WhatsApp exports → content/ticket-ticker.json"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--exports",
        nargs="+",
        metavar="FILE",
        help="WhatsApp .txt export files to process",
    )
    group.add_argument(
        "--seed",
        metavar="CSV",
        help="One-time: convert existing Colab CSV baseline to JSON (skips extraction)",
    )
    parser.add_argument(
        "--existing",
        metavar="JSON",
        help="Path to existing ticket-ticker.json for incremental runs",
    )
    parser.add_argument(
        "--output",
        default="content/ticket-ticker.json",
        metavar="JSON",
        help="Output path (default: content/ticket-ticker.json)",
    )
    args = parser.parse_args()

    if args.seed:
        run_seed(args.seed, args.existing, args.output)
    else:
        run_pipeline(args.exports, args.existing, args.output)


if __name__ == "__main__":
    main()
