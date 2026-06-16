"""
Re-normalise event names in the compact ticket-ticker.json using the latest FESTIVAL_MAP and ARTIST_MAP.

Run this after updating config.py to propagate map changes to all existing records
without re-running extraction. No API calls.

Usage:
  python3 scripts/ticket_ticker/renorm.py
  python3 scripts/ticket_ticker/renorm.py --input content/ticket-ticker.json --output content/ticket-ticker.json

Limitation: compact JSON lacks original_message, so city inference is limited to the
event name string itself. Records where city only appeared in the chat message body
won't gain a city suffix, but event names will be correctly collapsed across variants.
Run this again after seeding new data (which has original_message) for best results.
"""

import argparse
import json
from collections import Counter
from pathlib import Path

from scripts.ticket_ticker.utils import normalize_event_name


def renorm(input_path: str, output_path: str) -> None:
    print(f"Loading {input_path}...")
    with open(input_path, encoding="utf-8") as f:
        records = json.load(f)
    print(f"  {len(records)} records loaded")

    before: Counter = Counter()
    after: Counter = Counter()
    changed = 0

    for r in records:
        old_event = r.get("event") or ""
        before[old_event] += 1

        # Use the current (already partially-normalized) event name as the raw input
        # so keyword matching still fires on known artist/festival strings.
        pseudo = {
            "event_name": old_event,
            "message_date": r.get("message_date") or "",
            "original_message": "",  # not stored in compact JSON
        }
        new_event = normalize_event_name(pseudo) or old_event
        after[new_event] += 1

        if new_event != old_event:
            r["event"] = new_event
            changed += 1

    print(f"  {changed} event names updated")
    print()

    # Show what actually changed
    if changed:
        print("Changes (old → new):")
        seen: set = set()
        for r in records:
            new_e = r.get("event", "")
            for old_e, cnt in before.items():
                if old_e != new_e and old_e not in seen:
                    pseudo_check = {
                        "event_name": old_e,
                        "message_date": "",
                        "original_message": "",
                    }
                    if (normalize_event_name(pseudo_check) or old_e) == new_e:
                        print(f"  {cnt:3d}x  \"{old_e}\"  →  \"{new_e}\"")
                        seen.add(old_e)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)
    print(f"\n[OK] Wrote {len(records)} records to {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Re-normalise event names in compact ticket-ticker.json using latest config maps."
    )
    parser.add_argument(
        "--input", default="content/ticket-ticker.json", metavar="JSON",
        help="Input compact JSON (default: content/ticket-ticker.json)"
    )
    parser.add_argument(
        "--output", default="content/ticket-ticker.json", metavar="JSON",
        help="Output path (default: overwrites input)"
    )
    args = parser.parse_args()
    renorm(args.input, args.output)


if __name__ == "__main__":
    main()
