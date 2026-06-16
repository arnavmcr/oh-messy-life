"""
Ticket Ticker standalone cleanup CLI.

Re-applies normalization maps to an existing Colab CSV without re-running
Claude extraction. Useful when FESTIVAL_MAP or ARTIST_MAP entries change.

Usage:
  python scripts/ticket_ticker/cleanup.py --input extracted.csv
  python scripts/ticket_ticker/cleanup.py --input extracted.csv --output cleaned.csv
"""

import argparse
import csv
import os
import sys
from pathlib import Path

from scripts.ticket_ticker.utils import cleanup_records


def run_cleanup(input_path: str, output_path: str) -> None:
    if not os.path.exists(input_path):
        print(f"[ERROR] Input file not found: {input_path}")
        sys.exit(1)

    rows: list[dict] = []
    with open(input_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            print("[ERROR] CSV has no headers")
            sys.exit(1)
        fieldnames = list(reader.fieldnames)
        for row in reader:
            rows.append(dict(row))

    print(f"[OK] Loaded {len(rows)} rows from {input_path}")

    cleaned = cleanup_records(rows)

    # Ensure output has the new normalized columns
    for col in ("event_name_normalized", "pass_type", "is_duplicate"):
        if col not in fieldnames:
            fieldnames.append(col)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(cleaned)

    print(f"[OK] Wrote {len(cleaned)} rows to {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Re-apply normalization maps to an existing Ticket Ticker CSV"
    )
    parser.add_argument("--input", required=True, metavar="CSV", help="Input CSV file")
    parser.add_argument(
        "--output",
        metavar="CSV",
        help="Output path (default: <input>_cleaned.csv)",
    )
    args = parser.parse_args()

    if args.output:
        output_path = args.output
    else:
        stem = Path(args.input).stem
        output_path = str(Path(args.input).with_name(f"{stem}_cleaned.csv"))

    run_cleanup(args.input, output_path)


if __name__ == "__main__":
    main()
