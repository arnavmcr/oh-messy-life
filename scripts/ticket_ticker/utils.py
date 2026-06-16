"""
Shared logic for the Ticket Ticker pipeline.
Imported by both pipeline.py and cleanup.py to avoid duplication.
"""

import re
import hashlib
from datetime import datetime

from scripts.ticket_ticker.config import (
    FESTIVAL_MAP,
    ARTIST_MAP,
    CITY_MAP,
    LOLLA_WINDOWS,
    DGTL_WINDOWS,
    MULTI_DAY_EVENTS,
    NOISE_PATTERNS_RAW,
)

# Compile noise patterns once at import time
NOISE_PATTERNS = [re.compile(p, re.IGNORECASE) for p in NOISE_PATTERNS_RAW]

# ── Hash helpers ──────────────────────────────────────────────────────────────

def normalize_for_hash(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s.,!?₹$@/-]', '', text)
    text = ' '.join(text.split())
    text = re.sub(r'rs\.?\s*', '₹', text)
    text = re.sub(r'inr\s*', '₹', text)
    text = re.sub(r'k\b', '000', text)
    return text


def message_hash(sender: str, content: str) -> str:
    return hashlib.md5(
        f"{normalize_for_hash(sender)}|{normalize_for_hash(content)}".encode()
    ).hexdigest()


def create_dedupe_fingerprint(record: dict) -> str:
    price = record.get("price_per_ticket")
    try:
        p = float(price) if price is not None else 0.0
    except (ValueError, TypeError):
        p = 0.0

    if p < 2000:
        bucket = "under2k"
    elif p < 5000:
        bucket = "2k-5k"
    elif p < 10000:
        bucket = "5k-10k"
    else:
        bucket = "over10k"

    sender = (record.get("sender_name", "") or "").lower().strip()
    event = (
        record.get("event_name_normalized")
        or record.get("event_name", "")
        or ""
    ).lower().strip()
    msg_type = (record.get("message_type", "") or "").upper()
    date = record.get("message_date", "") or ""

    return f"{sender}|{event}|{msg_type}|{date}|{bucket}"

# ── Noise check ───────────────────────────────────────────────────────────────

def is_noise(content: str) -> bool:
    return any(p.search(content) for p in NOISE_PATTERNS)

# ── Year / city inference ─────────────────────────────────────────────────────

def infer_year_from_windows(msg_date: str, windows: list) -> str | None:
    try:
        dt = datetime.strptime(msg_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None
    for start_str, end_str, year in windows:
        start = datetime.strptime(start_str, "%Y-%m-%d").date()
        end = datetime.strptime(end_str, "%Y-%m-%d").date()
        if start <= dt < end:
            return year
    return None


def infer_city_from_text(text: str) -> str | None:
    text_lower = (text or "").lower()
    for city, keywords in CITY_MAP.items():
        for kw in keywords:
            if kw in text_lower:
                return city
    return None

# ── Event name normalization ──────────────────────────────────────────────────

def normalize_event_name(record: dict) -> str | None:
    raw = record.get("event_name", "") or ""
    raw_lower = raw.lower()
    msg_date = record.get("message_date", "") or ""
    orig_msg = record.get("original_message", "") or ""

    # Festival check — order from FESTIVAL_MAP is preserved
    for keyword, canonical_base, year_key, needs_city in FESTIVAL_MAP:
        if keyword in raw_lower:
            name = canonical_base
            if year_key == "lolla":
                year = infer_year_from_windows(msg_date, LOLLA_WINDOWS)
                if year:
                    name = f"{name} {year}"
            elif year_key == "dgtl":
                year = infer_year_from_windows(msg_date, DGTL_WINDOWS)
                if year:
                    name = f"{name} {year}"
            if needs_city:
                city = infer_city_from_text(raw) or infer_city_from_text(orig_msg)
                if city:
                    name = f"{name} {city}"
            return name

    # Artist check
    for keyword, canonical in ARTIST_MAP:
        if keyword in raw_lower:
            city = infer_city_from_text(raw) or infer_city_from_text(orig_msg)
            if city:
                return f"{canonical} {city}"
            return canonical

    # No match — return raw stripped
    return raw.strip() or None

# ── Pass type detection ───────────────────────────────────────────────────────

_ONE_DAY = [
    re.compile(r'\bday\s*[123]\b', re.IGNORECASE),
    re.compile(r'\b1\s*day\b', re.IGNORECASE),
    re.compile(r'\bsingle\s*day\b', re.IGNORECASE),
    re.compile(r'\bsaturday\s*only\b', re.IGNORECASE),
    re.compile(r'\bsunday\s*only\b', re.IGNORECASE),
]
_TWO_DAY = [
    re.compile(r'\bweekend\b', re.IGNORECASE),
    re.compile(r'\b2\s*day\b', re.IGNORECASE),
    re.compile(r'\bboth\s*days\b', re.IGNORECASE),
]
_THREE_DAY = [
    re.compile(r'\b3\s*day\b', re.IGNORECASE),
    re.compile(r'\ball\s*3\b', re.IGNORECASE),
]


def is_multi_day_event(event_name: str) -> bool:
    name_lower = (event_name or "").lower()
    return any(e in name_lower for e in MULTI_DAY_EVENTS)


def detect_pass_type(record: dict) -> str | None:
    event_name = (
        record.get("event_name_normalized")
        or record.get("event_name", "")
        or ""
    )
    if not is_multi_day_event(event_name):
        return None

    msg = (record.get("original_message", "") or "").lower()

    for p in _THREE_DAY:
        if p.search(msg):
            return "3-day"
    for p in _TWO_DAY:
        if p.search(msg):
            return "2-day"
    for p in _ONE_DAY:
        if p.search(msg):
            return "1-day"

    # Default: 3-day for Sunburn, 2-day for all others
    if "sunburn" in event_name.lower():
        return "3-day"
    return "2-day"

# ── Lollapalooza GA default ───────────────────────────────────────────────────

def apply_lolla_ga_default(record: dict) -> dict:
    event = (record.get("event_name_normalized", "") or "").lower()
    if "lollapalooza" in event and "road to" not in event:
        if not record.get("ticket_category"):
            record["ticket_category"] = "GA"
    return record

# ── Batch cleanup ─────────────────────────────────────────────────────────────

def cleanup_records(records: list[dict]) -> list[dict]:
    seen_fingerprints: set[str] = set()
    cleaned = []

    for r in records:
        r["event_name_normalized"] = normalize_event_name(r)
        r["pass_type"] = detect_pass_type(r)
        apply_lolla_ga_default(r)

        fp = create_dedupe_fingerprint(r)
        if fp in seen_fingerprints:
            r["is_duplicate"] = True
        else:
            seen_fingerprints.add(fp)
            r["is_duplicate"] = False

        cleaned.append(r)

    return cleaned
