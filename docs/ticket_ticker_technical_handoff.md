# Ticket Ticker — Technical Handoff Document

> For productization in Claude Code. Written from `Ticket_Ticker_v6.ipynb` (extraction) and `Ticket_Ticker_Cleanup.ipynb` (post-processing). Dashboard/viz code does **not yet exist** — see Section 3.

---

## 1. Scraper / Parser

### 1.1 Input Format

WhatsApp group chat exported as `.txt` via the app's native "Export Chat" feature (no media). Two date formats appear depending on device locale:

```
[DD/MM/YY, HH:MM:SS AM/PM] Sender Name: Message content
[DD/MM/YYYY, HH:MM AM/PM] Sender Name: Continuation of message
```

**Real-world example lines:**
```
[14/01/25, 11:34:52 AM] Rahul M: WTS - Coldplay Mumbai Feb 1, Cat A. 2 tickets. Paid 12k each, selling at 10k. DM me
[14/01/25, 11:35:10 AM] Priya K: WTB lolla 2025 GA pass, budget 4k, need 1
[14/01/25, 11:35:42 AM] Rahul M: can do 9500 if you take both
[14/01/25, 11:36:00 AM] +91 98765 43210: WTS diljit delhi, floor, 2 tickets at cost (8k each)
[14/01/25, 11:37:01 AM] You created this group
```

**Multi-line messages**: The WhatsApp export breaks long messages across lines. Only the first line matches the timestamp pattern; subsequent lines have no prefix and are appended to the previous message's `content` field with `\n`.

**System messages** (filtered out by noise patterns):
```
[14/01/25, 11:30:00 AM] +91 98765 43210: joined using this group's invite link
[14/01/25, 9:00:00 AM] Messages and calls are end-to-end encrypted.
```

**Regex used to parse lines:**
```python
WHATSAPP_PATTERN = re.compile(
    r'\[(\d{1,2}/\d{1,2}/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*[AaPp][Mm])\]\s*([^:]+):\s*(.*)',
    re.DOTALL
)
```

Groups: `(date_str, time_str, sender, content)`

**Encoding**: Try `utf-8-sig` → `utf-8` → `latin-1` in order. The BOM-with-sig variant (`utf-8-sig`) is common in iOS exports.

---

### 1.2 Parsing Logic (Step-by-Step)

#### Stage 1: Load & Pre-filter Deduplication

```
load_messages(filepath) → list[dict]
```

1. Read file trying encodings in order.
2. For each line, attempt regex match.
   - Match → start new message dict: `{date, time, timestamp, sender, content}`
   - No match → append line to current message's `content` (multi-line handling)
3. Append final message.
4. Filter noise: skip messages whose content matches any NOISE_PATTERN.
5. Skip empty content.

**Noise patterns (regex):**
```python
NOISE_PATTERNS = [
    r'joined using.*link', r'created this group', r'changed the group',
    r'added you', r'removed you', r'\bleft$', r'end-to-end encrypted',
    r'now an admin', r'omitted$', r'message was deleted', r'^\s*$',
    r'pinned a message'
]
```

**Timestamp normalization:**
- Date: supports `%d/%m/%Y` (4-digit year) and `%d/%m/%y` (2-digit year)
- Time: tries `%I:%M:%S %p` then `%I:%M %p`; output always `HH:MM:SS` in 24hr

**Pre-filter dedup (across multiple export files):**
Each message is hashed with MD5 on normalized `sender|content`. This deduplicates identical messages that appear in overlapping chat exports (e.g. you export in March, export again in June — January messages appear in both files).

```python
def normalize_for_hash(text):
    text = text.lower()
    text = re.sub(r'[^\w\s.,!?₹$@/-]', '', text)
    text = ' '.join(text.split())
    text = re.sub(r'rs\.?\s*', '₹', text)   # normalise currency symbols
    text = re.sub(r'inr\s*', '₹', text)
    text = re.sub(r'k\b', '000', text)       # "10k" → "10000"
    return text

def message_hash(sender, content):
    return hashlib.md5(f"{normalize_for_hash(sender)}|{normalize_for_hash(content)}".encode()).hexdigest()
```

---

#### Stage 2: API Extraction (Claude)

Messages are batched into **chunks of 30** and sent to `claude-sonnet-4-20250514` (update model string as needed). Each message in the chunk is formatted as:

```
[0] [2025-01-14 11:34:52] Rahul M: WTS - Coldplay Mumbai Feb 1...
[1] [2025-01-14 11:35:10] Priya K: WTB lolla 2025 GA pass...
```

Content is capped at 500 chars per message before sending.

**Extraction prompt (verbatim):**
```
Extract buy/sell ticket requests from WhatsApp messages.

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

Return ONLY JSON array. No markdown.
```

**Buy/Sell detection heuristics (taught to Claude via prompt):**
- `BUY`: WTB, looking for, need, anyone selling, LF
- `SELL`: WTS, selling, have tickets, looking to sell
- `+1` / `Same` / `Me too` → new record at confidence 0.7 (derived from prior message's context)
- Ambiguous messages with only prices quoted → skipped (confidence < 0.5 threshold)

**Original price extraction**: Claude is asked to extract `original_price` separately from `price_per_ticket`. This catches "at cost" listings (where someone paid X face-value and is selling for the same) and allows computing premium/discount %.

**JSON parsing (resilient):**
Tries raw JSON parse → strips markdown code fences → extracts `[...]` substring. All three fallbacks are attempted before marking chunk as failed.

**Retry logic**: 2 retries with 5s delay on API errors or parse failures. Failed chunks are saved to `failed_chunks_{timestamp}.json` for manual review.

**Progress saving**: Every 3 chunks, saves current state to disk (handles Colab session drops).

---

#### Stage 3: Cleanup & Post-extraction Deduplication

**3a. Event Name Normalization** (`normalize_event_name`)

Two-stage lookup — **festivals first, artists second** — against hardcoded maps. The festival lookup checks for "Road to Lollapalooza" *before* "Lollapalooza" because the shorter keyword would otherwise match first.

Logic:
1. Lowercase the raw `event_name` from Claude
2. Check FESTIVAL_MAP: if keyword match, resolve canonical name + infer year + infer city
3. Check ARTIST_MAP: if keyword match, resolve canonical name + infer city from event string
4. If no match: return raw event_name as-is

**Year inference** (for Lolla and DGTL, which lack explicit years in casual messages):
```python
LOLLA_WINDOWS = [
    ("2023-01-01", "2024-02-01", "2024"),
    ("2024-02-01", "2025-08-01", "2025"),
    ("2025-08-01", "2026-08-01", "2026"),
    ("2026-08-01", "2027-08-01", "2027"),
]
DGTL_WINDOWS = [
    ("2022-01-01", "2024-01-01", "2024"),
    ("2024-01-01", "2025-01-01", "2025"),
    ("2025-01-01", "2026-01-01", "2026"),
]
```
The message's own `message_date` is the lookup key — not the event date.

**City inference** (for DGTL, Sunburn, NH7 Weekender, Zamna, Anjunadeep, Circus Festival, Verknipt):
Scans event name first, then full original message for city keywords.

```python
CITY_MAP = {
    "Mumbai": ["mumbai", "bombay", "bkc", "mmrda", "nmacc", "ncpa", "nsci"],
    "Delhi": ["delhi", "ncr", "gurugram", "gurgaon", "noida"],
    "Bangalore": ["bangalore", "bengaluru", "blr"],
    "Ahmedabad": ["ahmedabad"], "Pune": ["pune"], "Hyderabad": ["hyderabad"],
    "Chennai": ["chennai"], "Kolkata": ["kolkata"], "Goa": ["goa"], "Jaipur": ["jaipur"],
}
```

Output format examples:
- `"lolla 2025"` → `"Lollapalooza 2025"`
- `"DGTL mumbai"` → `"DGTL Mumbai 2025"` (year inferred from message date)
- `"road to lolla"` → `"Road to Lollapalooza"` (treated as separate event, no year appended)
- `"diljit delhi"` → `"Diljit Dosanjh Delhi"`
- `"eras tour"` → `"Taylor Swift"`

**3b. Pass Type Detection** (`detect_pass_type`)

Only runs for multi-day events: lollapalooza, lolla, dgtl, sunburn, nh7, weekender, magnetic fields, echoes of earth, bandland.

Scans original message with regex:
```python
one_day  = [r"\bday\s*[123]\b", r"\b1\s*day\b", r"\bsingle\s*day\b", r"\bsaturday\s*only\b", r"\bsunday\s*only\b"]
two_day  = [r"\bweekend\b", r"\b2\s*day\b", r"\bboth\s*days\b"]
three_day = [r"\b3\s*day\b", r"\ball\s*3\b"]
```
Default if no pattern matches: `"3-day"` for Sunburn, `"2-day"` for all others.

**3c. GA Default for Lollapalooza**

If `event_name_normalized` contains "Lollapalooza" (but NOT "Road to Lollapalooza") and `ticket_category` is null/empty, sets `ticket_category = "GA"`. Rationale: ~90%+ of Lolla resale volume is GA; the few premium tiers are explicitly labelled.

**3d. Post-extraction Deduplication**

Fingerprint: `sender|event_normalized|message_type|date|price_bucket`

Price is bucketed (`under2k`, `2k-5k`, `5k-10k`, `over10k`) rather than exact, so minor rephrasings of the same offer don't create duplicates. Duplicate records get `is_duplicate = True` and are retained in output for auditability.

---

### 1.3 Output Format

**CSV columns (in field order):**

| Column | Type | Example | Notes |
|---|---|---|---|
| `timestamp` | str | `2025-01-14 11:34:52` | Combined date+time |
| `message_date` | str | `2025-01-14` | YYYY-MM-DD |
| `message_time` | str | `11:34:52` | HH:MM:SS 24hr |
| `sender_name` | str | `Rahul M` | As in WhatsApp export |
| `message_type` | str | `SELL` | `BUY` or `SELL` |
| `event_name` | str | `coldplay mumbai feb` | Raw Claude output |
| `event_name_normalized` | str | `Coldplay Mumbai` | Post-cleanup canonical |
| `pass_type` | str/null | `2-day` | `1-day`/`2-day`/`3-day`/null |
| `event_date` | str/null | `2025-02-01` | YYYY-MM-DD, often null |
| `num_tickets` | int/null | `2` | |
| `price_per_ticket` | float/null | `10000.0` | INR, resale price |
| `original_price` | float/null | `12000.0` | INR, face value |
| `price_type` | str/null | `negotiable` | fixed/negotiable/at_cost/budget |
| `ticket_category` | str/null | `GA` | GA/VIP/Gold/Silver/Platinum/Floor/etc |
| `location` | str/null | `Mumbai` | City |
| `confidence` | float | `0.92` | Claude's 0.0–1.0 |
| `source_file` | str | `whatsapp_export_jan.txt` | Origin file |
| `is_duplicate` | bool | `False` | Post-extraction dedup flag |
| `original_message` | str | `WTS - Coldplay...` | Newlines replaced with ` \| ` |

**Also produced per run:**
- `extracted_{timestamp}.json` — all records as JSON array
- `duplicates_{timestamp}.json` — pre-filter and post-extraction duplicate logs
- `stats_{timestamp}.json` — processing stats (records, dupes, GA defaults, time)
- `failed_chunks_{timestamp}.json` — chunks where API extraction or JSON parsing failed

---

## 2. Data

### 2.1 Volume & Coverage
- **~7,000 parsed unique records** as of the most recent full run
- **Date range**: Messages span approximately 2022–2025 (multi-year WhatsApp group history)
- **Events covered**: Coldplay, Lollapalooza (2024, 2025), Travis Scott, Ed Sheeran, Diljit Dosanjh, DGTL (2024, 2025), NH7 Weekender, Sunburn, Karan Aujla, AP Dhillon, and 180+ other artists/festivals
- **Source**: Multiple WhatsApp `.txt` exports from Indian resale/exchange groups, processed incrementally

### 2.2 Storage
- **Primary working format**: CSV (pandas-compatible, downloaded from Colab)
- **Secondary**: JSON array (same records, for programmatic use)
- **No database**: Everything is flat files. There is no persistent store, DB schema, or backend.
- **Location**: Downloaded to local machine after each Colab run; no cloud storage integration

### 2.3 Known Data Quality Issues

**Structural:**
- `event_date` is frequently null (Claude can't reliably parse informal dates like "feb wkend")
- `location` is null when not mentioned in the message (common for Delhi/Mumbai regulars who assume context)
- `original_price` is null unless seller explicitly mentions face value ("paid X, selling at Y")
- `num_tickets` occasionally extracted as float (e.g. `1.0`) rather than int

**Normalization edge cases:**
- `"sting"` matches too broadly — the word appears in unrelated messages ("listing", "existing"). Has caused false positives for "Sting" the artist.
- `"armin"` matches names like "Armin Kapoor" — same issue.
- `"king concert"` is the intended match for rapper King, but ambiguous; sometimes catches unrelated uses of the word "king."
- `"fisher"` matches non-artist references (e.g. "fisher price" in unrelated messages).
- DGTL city inference fails when messages just say "DGTL" with no city context — defaults to no city appended.
- Lolla year windows assume festival is always Jan–Feb. If dates shift significantly, windows need manual update.

**Deduplication edge cases:**
- Price bucket dedup can over-collapse: two different people selling at ₹4,800 and ₹4,999 on the same day get the same fingerprint if they're the same sender posting about the same event.
- Pre-filter hash dedup can under-collapse: if someone edits a price in a repost (different content), it's treated as a new message.
- The cleanup notebook (separate from v6) does NOT have deduplication — it's a post-processor for CSV files only. If you run both v6 and cleanup on the same data, dedup only runs in v6's pipeline.

**Confidence scores:**
- `+1` / "Same" replies are always assigned `0.7` confidence, regardless of context clarity.
- Claude occasionally extracts from non-transactional messages (curiosity questions, "anyone know the price?" threads). Low-confidence records (< 0.6) should be filtered for analysis.

**Two-notebook architecture (active gotcha):**
- `Ticket_Ticker_v6.ipynb` does extraction + cleanup + dedup in one pipeline.
- `Ticket_Ticker_Cleanup.ipynb` is a standalone post-processor for re-running cleanup on existing CSVs (useful when normalization rules change).
- Both notebooks contain **identical copies** of FESTIVAL_MAP, ARTIST_MAP, CITY_MAP, LOLLA_WINDOWS, DGTL_WINDOWS, MULTI_DAY_EVENTS. If you update one, you must update the other. This is the biggest maintenance pain point.

---

## 3. Dashboard / Visualization

**This does not exist yet.** The notebooks are pure data processing — no visualization code has been written. The analytical insights exist as ad-hoc pandas outputs in the notebooks (`.value_counts()`, `.describe()`, filtered DataFrames).

**What has been computed analytically (in prose/research, not as code):**
- GA passes typically resell at 15–30% below face value
- Steeper price drops in the final two weeks before events
- Multi-genre festivals show different resale patterns than single-artist shows
- Passionate fanbases (Coldplay, Diljit) create more liquid secondary markets

**What a dashboard should show (requirements spec):**

| View | Filters | Computed Fields |
|---|---|---|
| Supply/demand ratio by event | Event, date range | SELL count / BUY count |
| Price premium/discount % | Event, category, date | `(price_per_ticket - original_price) / original_price * 100` |
| Price over time (scatter) | Event, message_type | Rolling avg line |
| Top sellers by volume | Event, date | Count of SELL records per sender |
| Event heatmap (listings by day) | Event | Daily listing count |
| Category breakdown | Event | GA/VIP/Gold etc distribution |

**Suggested stack for productization:**
- Backend: FastAPI or Flask serving the CSV as an API
- Frontend: Plotly Dash (Python-native, minimal JS) or Observable Framework (if editorial export is needed)
- Alternatively: Streamlit for rapid internal tooling

---

## 4. Code

### 4.1 Full Pipeline Architecture

```
WhatsApp .txt export(s)
        │
        ▼
[v6 Notebook — Stage 1]
  load_messages() × N files
  Pre-filter dedup (MD5 hash)
        │
        ▼
[v6 Notebook — Stage 2]
  Claude API extraction
  Chunks of 30 msgs
  JSON parse + retry
        │
        ▼
[v6 Notebook — Stage 3]
  cleanup_records()
    normalize_event_name()
    detect_pass_type()
    apply_lolla_ga_default()
  Post-extraction dedup (fingerprint)
        │
        ▼
  CSV + JSON + logs output
        │
        ▼ (optional)
[Cleanup Notebook — standalone]
  Re-run normalization on existing CSV
  Download updated _cleaned.csv
```

### 4.2 Key Functions Reference

```python
# PARSING
parse_line(line) → dict | None
is_noise(content) → bool
load_messages(filepath) → list[dict]
format_for_prompt(messages) → str
try_parse_json(text) → list | None

# DEDUPLICATION
normalize_for_hash(text) → str
message_hash(sender, content) → str (MD5 hex)
create_dedupe_fingerprint(record) → str

# CLEANUP
infer_year_from_windows(msg_date, windows) → str | None
infer_city_from_text(text) → str | None
is_multi_day_event(event_name) → bool
detect_pass_type(record) → str | None
normalize_event_name(record) → str | None
apply_lolla_ga_default(record) → str | None
cleanup_records(records) → list[dict]

# I/O
extract_chunk(messages, chunk_num, total, offset) → (list | None, str | None)
save_progress(records, failed) → None
```

### 4.3 Configuration Constants

```python
CHUNK_SIZE = 30               # messages per API call
MAX_RETRIES = 2               # API retry attempts
RETRY_DELAY = 5               # seconds between retries
SAVE_EVERY_N_CHUNKS = 3       # checkpoint frequency
DEDUPE_TIME_WINDOW_HOURS = 24 # (defined but not currently used in fingerprint logic)
MODEL = "claude-sonnet-4-20250514"  # update per current API
MAX_TOKENS = 4096
MAX_MESSAGE_LENGTH = 500      # chars per message before truncation in prompt
```

### 4.4 Dependencies

```
# pip install
anthropic          # Claude API client
pandas             # CSV I/O and analysis
```

Standard library only otherwise: `re`, `json`, `csv`, `os`, `time`, `hashlib`, `datetime`, `collections`.

No npm packages. No frontend dependencies. Everything runs in Python 3.10+.

**Current runtime**: Google Colab (free tier). Files are uploaded/downloaded via `google.colab.files`. Migrating to Claude Code means replacing all `files.upload()` / `files.download()` calls with standard filesystem I/O.

---

## 5. Gotchas, Assumptions, Unfinished Parts

### Critical: Colab-specific code to remove
```python
# REMOVE THESE in Claude Code migration:
from google.colab import files
uploaded = files.upload()
files.download(output_name)
```
Replace with argparse-based CLI or direct path inputs.

### Model string
`"claude-sonnet-4-20250514"` is hardcoded in `extract_chunk()`. This needs to be a config variable. Current correct model string as of mid-2025: `claude-sonnet-4-6`.

### WhatsApp deduplication notebook (third notebook, not attached)
There's a third notebook in the system (`WhatsApp export deduplication`) for pre-processing incremental exports before they're fed to v6. Not included in the project files here. Its job: given a "full history" export and a "new since last time" export, output only genuinely new messages. This sits upstream of v6 in the real workflow.

### The two-map problem
FESTIVAL_MAP and ARTIST_MAP are duplicated across v6 and Cleanup. In Claude Code, these should be a single `config.py` or `maps.py` imported by both scripts.

### Confidence threshold not enforced
Records with confidence < 0.5 are extracted but not filtered. Any analytical query should add `WHERE confidence >= 0.6` or similar. No hard filter exists in the pipeline.

### `original_price` is sparse
Face value is only extracted when the seller explicitly states it. For events where you have a hardcoded price table (Coldplay Cat A = ₹12,000 etc.), you could enrich `original_price` in post-processing using a lookup table. This has been discussed but not implemented.

### `event_date` is unreliable
Claude extracts event dates from informal text like "feb wkend" or "next saturday." These are frequently null or wrong. Do not use `event_date` as the primary analysis axis — use `message_date` (the date the message was sent) instead, which is always reliable.

### Fingerprint dedup collapses legitimate different listings
If the same seller posts two different Lolla GA tickets on the same day at ₹4,200 and ₹4,700, both land in the `2k-5k` price bucket and get the same fingerprint — one gets flagged as a duplicate. This is a known trade-off accepted to avoid cross-file duplication noise.

### No schema validation
Records are raw dicts from Claude with no Pydantic models or type coercion. `price_per_ticket` might arrive as `"10000"` (string), `10000` (int), `10000.0` (float), or `"10k"` (unparsed). Downstream analysis should coerce with `pd.to_numeric(..., errors='coerce')`.

### Pass type default behaviour
For Lollapalooza (2-day festival), the default pass_type when no day indicator is found is `"2-day"`. For Sunburn (3-day), it's `"3-day"`. This is a reasonable heuristic but will be wrong for people selling a single day at either festival without explicitly saying so.

### Road to Lollapalooza vs Lollapalooza
These are deliberately kept as separate events. "Road to Lolla" pre-parties held weeks before the main festival get their own `event_name_normalized = "Road to Lollapalooza"` with no year appended (year inference intentionally omitted since they don't follow the same booking cycle). This is correct behaviour — do not "fix" it.

### Scale estimate for Claude Code deployment
With ~7,000 records already extracted and ~200–500 new messages per month (typical group activity), future runs would process incremental exports only. Each run of ~500 messages ≈ 17 chunks ≈ ~$0.25 API cost at Sonnet pricing, under 5 minutes runtime.

---

*Document generated from `Ticket_Ticker_v6.ipynb` and `Ticket_Ticker_Cleanup.ipynb` as of June 2025.*
