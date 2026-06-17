---
title: "feat: Ticket Ticker — pipeline migration and interactive bubble chart"
type: feat
status: active
date: 2026-06-16
origin: docs/brainstorms/2026-06-16-ticket-ticker-requirements.md
---

# feat: Ticket Ticker — Pipeline Migration and Interactive Bubble Chart

## Summary

Migrate the three-notebook Colab pipeline to a clean local Python CLI (`scripts/ticket_ticker/`) and ship a new `/projects/ticket-ticker` page on Oh Messy Life with a custom SVG interactive bubble chart. The pipeline takes WhatsApp `.txt` exports and an existing dataset, runs them through parse → extract (Claude API) → normalize → merge, and writes `content/ticket-ticker.json`. The frontend page reads that file at build time and renders it as a filterable bubble chart (X = demand, Y = avg seller loss %, bubble = avg price) using a `'use client'` SVG component following the `HomeGraph.tsx` pattern.

---

## Problem Frame

The Stress Fractures article promises an interactive chart that doesn't exist yet, and the underlying data pipeline lives in three fragmented Colab notebooks with duplicated normalization maps and Colab-specific file picker calls. (See origin doc for full problem narrative.)

---

## Requirements

- R1. Pipeline runs as CLI scripts from the user's laptop with no `google.colab` dependencies
- R2. A single shared config module contains all normalization maps — no duplication
- R3. Full pipeline flow documented and sequenced: dedup preprocessing → extraction → cleanup → export
- R4. Third-notebook dedup logic (new-vs-existing message filtering) absorbed into the pipeline
- R5. Pipeline outputs `content/ticket-ticker.json` in the format the frontend consumes
- R6. Records with `confidence < 0.6` excluded from output
- R7. CLI accepts `.txt` export paths as arguments, not via file picker
- R8. Anthropic API key read from environment variable
- R9. New page at `/projects/ticket-ticker` on Oh Messy Life
- R10. Interactive bubble chart: X = demand (buy count per event), Y = avg seller loss %, bubble size ∝ avg ticket price
- R11. Filterable by event/artist name
- R12. Filterable by date range using `message_date`
- R13. Hover/tap on a bubble surfaces: event name, buy count, avg seller loss %, avg ticket price
- R14. Filters clearable individually or all at once
- R15. Stress Fractures article "visit our website" placeholder updated to link to `/projects/ticket-ticker`

**Origin actors:** A1 (Arnav, data operator), A2 (Reader, public explorer)
**Origin flows:** F1 (ingestion + update), F2 (reader exploration)
**Origin acceptance examples:** AE1 (covers R6), AE2 (covers R12), AE3 (covers R13), AE4 (covers R14)

---

## Scope Boundaries

- Other dashboard views (supply/demand ratio, price over time, heatmap, top sellers, category breakdown) — post-MVP
- Web/browser UI for pipeline — CLI only
- Cloud storage or database — data lives as a committed file in the repo
- Live or streaming data — Vercel deploy is the update mechanism
- User accounts, saved filter state, shareable filter URLs
- Automated ingestion scheduling
- Pipeline port to TypeScript/Node

### Deferred to Follow-Up Work

- One-time CSV → JSON seeding script to convert the existing 7k-record Colab CSV into `content/ticket-ticker.json` format: this can be built as a thin wrapper around the export stage of U2 once the schema is established.
- `/projects` landing page beyond a minimal stub: full THE LABS design is a separate piece of work.

---

## Context & Research

### Relevant Code and Patterns

- `components/HomeGraph.tsx` — canonical `'use client'` SVG interactive visualization. Patterns to carry forward: `useRef` for SVG element, `useState` for hover/filter state, SVG coordinate math for mapping data values to pixel space, mobile performance gate via container width check.
- `components/CollapsibleSection.tsx` — minimal `'use client'` + `useState` pattern.
- `lib/content.ts`, `lib/journal.ts` — build-time data loading with `fs.readFileSync` in server-side modules. The page (Server Component) calls the lib function; the client chart component receives data as props.
- `app/music/page.tsx` — closest analogue page layout: metadata strip, `font-headline` H1, `h-1 w-24 bg-primary` red divider.
- `scripts/import-wp.ts` — canonical script pattern: `main()` entry point, `[OK]`/`[SKIP]` logging, no framework.
- `content/gig-archive.json` — precedent for a JSON data file committed to `content/`.

### Institutional Learnings

- **`mounted` guard is mandatory** before reading `useTheme` in any `'use client'` component — `resolvedTheme` is `undefined` during SSR and never self-corrects without an `useEffect(() => setMounted(true), [])` guard. Render a same-size spacer before mount. (`docs/solutions/design-patterns/dark-mode-tailwind-v4-next-themes-2026-06-03.md`)
- **Mobile SVG filter budget**: `feDisplacementMap` per-frame exceeds 16ms on mid-range phones. Gate expensive per-frame paint behind a width-based mobile check. The bubble chart doesn't use displacement maps, but any hover effects or animated transitions should be guarded. (`docs/solutions/design-patterns/homepage-hero-graph-flat-constellation-2026-06-03.md`)
- **Flat data models beat discriminated unions in hot loops.** If the chart component's event data model starts growing type branches inside `useMemo`/render loops, flatten. (`docs/solutions/design-patterns/homepage-hero-graph-flat-constellation-2026-06-03.md`)
- **Dual-token rule**: any new CSS color token must be registered in all three blocks: `@theme {}` (Tailwind utilities), `:root {}` (CSS var consumers), `.dark {}` (dark-mode overrides). Use semantic tokens (`text-on-surface`, `bg-surface`) in preference to stone utilities. (`docs/solutions/conventions/tailwind-v4-dual-token-palette-update-2026-06-12.md`)

### External References

- Ticket Ticker handoff doc: `ticket_ticker_technical_handoff.md` — full pipeline spec, data schema, known edge cases.

---

## Key Technical Decisions

- **Custom SVG bubble chart, no charting library.** AGENTS.md prohibits new dependencies without discussion; user confirmed custom SVG. Follows `HomeGraph.tsx` precedent. The bubble/scatter math (linear scale + sqrt radius) is ~50 lines; not worth a 300KB dependency for MVP.
- **Raw records in `content/ticket-ticker.json`, not pre-aggregated.** Date-range filtering requires per-record dates. The frontend aggregates (demand count, avg loss %, avg price) inside a `useMemo` after filtering. At ~5–7k records × ~6 fields, this is cheap client-side.
- **Incremental pipeline runs use `--existing content/ticket-ticker.json`.** The pipeline builds a hash set from existing records to avoid re-extracting already-processed messages. First run (seeding from the existing Colab CSV) is a deferred one-time step.
- **`message_date` as the date axis.** `event_date` is frequently null/unreliable (per handoff doc). `message_date` is always present.
- **`/projects/page.tsx` is a minimal stub.** The route needs to exist to avoid a 404 at the parent, but full LABS design is deferred.
- **`scripts/ticket_ticker/` as a Python package.** Using a subdirectory package (with `__init__.py`) keeps the pipeline files organized without cluttering `scripts/` root. Run via `python -m scripts.ticket_ticker.pipeline` or `python scripts/ticket_ticker/pipeline.py`.

---

## Open Questions

### Resolved During Planning

- **Charting library vs custom SVG**: Resolved — custom SVG, no new dependency. (User confirmed.)
- **Data file location**: `content/ticket-ticker.json` — follows `content/gig-archive.json` precedent.
- **`/projects` parent route**: Create a minimal stub page at `app/projects/page.tsx` to avoid 404.
- **Data aggregation**: Frontend-side `useMemo` after filter application. Not pre-aggregated in pipeline.

### Deferred to Implementation

- **Exact JSON record schema**: Implementer to verify which fields from the 19-column CSV are needed. Working assumption: `{ event, type, price, originalPrice, message_date, category }`. Adjust in U2 and U4 together. Field is named `message_date` (not `date`) to match R12 and Key Technical Decisions.
- **avg seller loss % computation when `originalPrice` is null**: Many SELL records lack `originalPrice`. Implementer to decide: exclude those records from Y-axis calculation, or show null/zero. (The handoff doc notes `original_price` is sparse.)
- **Bubble minimum size**: When demand is very low (1–2 buy requests), bubbles may be too small to click. Implementer to apply a minimum radius (e.g., `max(r, 6px)`).
- **Event filter UX**: Text search (substring match on event name) vs dropdown of known events. The `useMemo` logic already describes substring match — text input is the implied choice; confirm at implementation.
- **Tooltip position strategy**: Absolute-positioned tooltip div will clip for bubbles near right/bottom edges. Implementer to choose: flip anchor when bubble is in bottom half, or clamp to chart container bounds.
- **Touch/tap tooltip (R13 mobile)**: `onMouseEnter`/`onMouseLeave` covers desktop hover. Mobile requires `onClick`/`onTouchStart` toggle-to-show, tap-elsewhere-to-dismiss. Minimum viable: tap toggles a persistent tooltip; second tap or tap-outside dismisses.
- **Empty chart states**: Three distinct zero-result scenarios — (1) data file empty, (2) event filter no-match, (3) date range excludes all records. Use one treatment: centered message within the SVG viewport; decide whether axes render or collapse.
- **Keyboard/ARIA for SVG bubbles**: `<svg role="img" aria-label="...">` on root; each `<circle role="button" tabIndex={0} aria-label="...">` with `onKeyDown` Enter/Space triggering tooltip. Minimum bar for accessibility.
- **Axis domain single-event case**: When only one event passes filters, linear scale domain collapses (min = max). Guard: extend domain by ±10% of the single value, or set a hardcoded minimum range per axis so bubbles don't render at NaN coordinates.
- **`cleanup_records()` extraction**: This function is shared between `pipeline.py` and `cleanup.py`. To avoid argparse executing on import (Python module-level side effect), extract `cleanup_records()` and its sub-functions into `scripts/ticket_ticker/utils.py`. Both scripts import from there. HomeGraph reference note: HomeGraph.tsx hardcodes hex fill values (`'#ff5573'`) — they do not adapt to dark mode. TicketTickerChart must use `var(--coral)` etc. on SVG `fill` attributes directly, not follow HomeGraph's fill pattern.

---

## Output Structure

```
scripts/
  ticket_ticker/
    __init__.py
    config.py          ← shared maps and constants
    utils.py           ← shared logic (cleanup_records, normalize_event_name, etc.)
    pipeline.py        ← main CLI entry point (all stages)
    cleanup.py         ← standalone re-normalization CLI

content/
  ticket-ticker.json   ← pipeline output, read by frontend

lib/
  ticket-ticker.ts     ← build-time data loader

app/
  projects/
    page.tsx           ← THE LABS stub
    ticket-ticker/
      page.tsx         ← Ticket Ticker page (Server Component)

components/
  TicketTickerChart.tsx ← 'use client' SVG bubble chart
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

**Pipeline data flow:**

```
WhatsApp .txt exports (1..N)
  + existing content/ticket-ticker.json (optional --existing)
        │
        ▼
pipeline.py stage 1: load_messages() × N files
  → pre-filter: MD5 hash each message
  → diff against existing record hashes
  → new_messages[] (only genuinely new)
        │
        ▼
pipeline.py stage 2: extract via Claude API
  → batches of 30, retry on failure
  → extracted_records[]
        │
        ▼
pipeline.py stage 3: cleanup_records()
  → normalize_event_name() (uses config.py maps)
  → detect_pass_type()
  → post-extraction fingerprint dedup
  → cleaned_records[]
        │
        ▼
pipeline.py stage 4: merge + export
  → merge cleaned_records with existing
  → filter confidence < 0.6
  → write content/ticket-ticker.json (compact schema)
```

**Frontend data flow:**

```
content/ticket-ticker.json  (committed, build-time)
        │  fs.readFileSync (build time)
        ▼
lib/ticket-ticker.ts → TicketRecord[]
        │  props
        ▼
app/projects/ticket-ticker/page.tsx  (Server Component)
        │  props
        ▼
components/TicketTickerChart.tsx  ('use client')
  └─ useState: eventFilter, dateRange, hoveredEvent
  └─ useMemo: filtered records → per-event aggregates → SVG data
  └─ SVG: <circle> per event, scaled X/Y/r
  └─ filter UI: text input + date inputs
  └─ tooltip: conditional absolute-positioned div on hover
```

---

## Implementation Units

### U1. Shared pipeline config module

**Goal:** Create `scripts/ticket_ticker/config.py` as the single source of truth for all normalization maps and pipeline constants, and `utils.py` as the shared logic module, eliminating duplication between v6 and Cleanup notebooks.

**Requirements:** R2

**Dependencies:** None

**Files:**
- Create: `scripts/ticket_ticker/__init__.py`
- Create: `scripts/ticket_ticker/config.py`
- Create: `scripts/ticket_ticker/utils.py`

**Approach:**
- Port FESTIVAL_MAP, ARTIST_MAP, CITY_MAP, LOLLA_WINDOWS, DGTL_WINDOWS, MULTI_DAY_EVENTS verbatim from the handoff doc.
- Add pipeline constants: CHUNK_SIZE (30), MAX_RETRIES (2), RETRY_DELAY (5), SAVE_EVERY_N_CHUNKS (3), MAX_MESSAGE_LENGTH (500), MODEL (update to current string per handoff note).
- `NOISE_PATTERNS` list of compiled regexes also lives here.
- `config.py`: All downstream scripts import from this module. No logic here — pure data.
- `utils.py`: Shared callable logic — `cleanup_records()`, `normalize_event_name()`, `detect_pass_type()`, `apply_lolla_ga_default()`, `create_dedupe_fingerprint()`. Both `pipeline.py` and `cleanup.py` import from here. Isolating shared logic prevents module-level argparse side effects when importing across scripts.

**Patterns to follow:**
- `lib/categories.ts` — a config module that is pure data, no logic, imported everywhere.

**Test scenarios:**
- Test expectation: none — pure config data module with no callable logic.

**Verification:**
- `python -c "from scripts.ticket_ticker.config import FESTIVAL_MAP, ARTIST_MAP; print(len(FESTIVAL_MAP), len(ARTIST_MAP))"` prints non-zero counts without error.

---

### U2. Main pipeline CLI script

**Goal:** Create `scripts/ticket_ticker/pipeline.py` — the single entry point that runs all four stages (load/dedup → extract → cleanup → export) with argparse-based CLI and no Colab dependencies.

**Requirements:** R1, R3, R4, R5, R6, R7, R8

**Dependencies:** U1

**Files:**
- Create: `scripts/ticket_ticker/pipeline.py`

**Approach:**
- Argparse interface: `--exports path1.txt [path2.txt …]` (required, but skipped in `--seed` mode), `--existing path/to/ticket-ticker.json` (optional, path to prior output for incremental runs), `--output path` (optional, defaults to `content/ticket-ticker.json`), `--seed path/to/baseline.csv` (mutually exclusive with `--exports` — one-time conversion of the existing Colab CSV export to the compact JSON schema, skips extraction entirely).
- Stage 1 — load & dedup: call `load_messages()` for each export (handles both date format variants, multi-line messages, encoding fallback chain). Build MD5 hash set from `--existing` records if provided. Yield only messages whose hash is not in the existing set.
- Stage 2 — extract: batch new messages into chunks of CHUNK_SIZE, call Claude API with the extraction prompt from the handoff doc verbatim, parse JSON response (3-fallback resilient parser), save progress every SAVE_EVERY_N_CHUNKS, retry up to MAX_RETRIES on failures. Reads `ANTHROPIC_API_KEY` from environment.
- Stage 3 — cleanup: pass all extracted records through `cleanup_records()` (imported from `utils.py`) which calls `normalize_event_name()`, `detect_pass_type()`, `apply_lolla_ga_default()`, and post-extraction fingerprint dedup.
- Stage 4 — merge & export: load existing records from `--existing` (if provided), merge with new cleaned records (dedup fingerprints across both), filter `confidence < 0.6`, project to compact schema (see deferred question in Open Questions), write JSON to `--output`.
- Logging follows `[OK]`/`[SKIP]` convention from `scripts/import-wp.ts`. Print stage headers, chunk progress, final counts.
- No `from google.colab import files` — removed entirely.

**Technical design:** *(directional — functions are named from the handoff doc, not specification)*

The stage 1 function signatures to implement:
- `parse_line(line) → dict | None`
- `is_noise(content) → bool`
- `load_messages(filepath) → list[dict]`
- `normalize_for_hash(text) → str`
- `message_hash(sender, content) → str`

Stage 2:
- `format_for_prompt(messages) → str`
- `try_parse_json(text) → list | None`
- `extract_chunk(messages, chunk_num, total, offset) → (list | None, str | None)`

Stage 3 (these functions live in `utils.py`, imported by `pipeline.py`):
- `normalize_event_name(record) → str | None`
- `detect_pass_type(record) → str | None`
- `apply_lolla_ga_default(record) → str | None`
- `cleanup_records(records) → list[dict]`
- `create_dedupe_fingerprint(record) → str`

**Patterns to follow:**
- `scripts/import-wp.ts` — script structure: `main()`, argparse/arg handling, `[OK]`/`[SKIP]` logging.
- Handoff doc `ticket_ticker_technical_handoff.md` — all function logic, regex patterns, prompt text.

**Test scenarios:**
- Happy path: given two .txt exports and no `--existing`, pipeline runs all stages and writes valid JSON to `--output`.
- Edge case — incremental run: given a `--existing` with records whose hashes overlap with messages in the new exports, only genuinely new messages reach the extraction stage.
- Edge case — all messages already seen: when every message in the exports is in the existing hash set, extraction stage is skipped entirely and the existing dataset is written out unchanged.
- Edge case — `--existing` not provided (first run): pipeline processes all messages, no existing hash set.
- Covers AE1: given a batch that returns records with confidence 0.4, 0.65, 0.9 mixed, only the 0.65 and 0.9 records appear in the output JSON.
- Error path — missing `ANTHROPIC_API_KEY`: pipeline fails at stage 2 startup with a clear error message, not a cryptic API error.
- Error path — malformed WhatsApp export: file with no matching timestamp lines should emit `[SKIP]` and proceed, not crash.
- Integration — end to end with a real 3-line fixture export: output JSON contains exactly 1 event with expected fields populated.

**Verification:**
- `python scripts/ticket_ticker/pipeline.py --exports test_fixture.txt` completes without error and writes `content/ticket-ticker.json`.
- Output JSON array entries each contain at minimum: `event`, `type`, `message_date` fields.
- No records with confidence < 0.6 appear in the output.

---

### U3. Standalone cleanup CLI

**Goal:** Create `scripts/ticket_ticker/cleanup.py` — a standalone re-normalization tool that takes an existing CSV (from prior Colab runs) and re-applies the normalization logic, producing an updated output. Migrates the Cleanup notebook.

**Requirements:** R1, R2 (re-uses config module)

**Dependencies:** U1

**Files:**
- Create: `scripts/ticket_ticker/cleanup.py`

**Approach:**
- Argparse: `--input existing.csv`, `--output cleaned.csv` (defaults to `<input>_cleaned.csv`).
- Reads the 19-column CSV produced by Colab, passes records through `cleanup_records()` imported from `utils.py` (shared with pipeline.py), writes updated CSV.
- Useful when normalization maps change (FESTIVAL_MAP updated) without re-running the full extraction.
- Does NOT call the Claude API.

**Patterns to follow:**
- Same script structure as `pipeline.py` — `main()`, argparse, logging.

**Test scenarios:**
- Happy path: given a 5-row CSV with unnormalized event names, output CSV contains corrected `event_name_normalized` values per FESTIVAL_MAP.
- Edge case: rows with null `event_name` pass through without crashing.

**Verification:**
- Running `python scripts/ticket_ticker/cleanup.py --input sample.csv` produces `sample_cleaned.csv` with updated normalization.

---

### U4. Frontend data loader

**Goal:** Create `lib/ticket-ticker.ts` — a build-time server-side module that reads `content/ticket-ticker.json` and returns typed records to the page.

**Requirements:** R9, R10

**Dependencies:** U2 (data file must exist; for development, a sample fixture file is sufficient)

**Files:**
- Create: `lib/ticket-ticker.ts`
- Create: `content/ticket-ticker.json` (minimal fixture for development — `[]` or a handful of sample records)

**Approach:**
- Uses `fs.readFileSync` (Node.js, server-side only — never imported in a `'use client'` component).
- Defines and exports the `TicketRecord` TypeScript interface. Working schema: `{ event: string, type: 'BUY' | 'SELL', price: number | null, originalPrice: number | null, message_date: string, category: string | null }`.
- Exports `getTicketRecords(): TicketRecord[]` — reads and parses the file, returns the array.
- No caching needed — called once per build in a Server Component.

**Patterns to follow:**
- `lib/content.ts` — `fs.readFileSync`, typed return, exported named functions.
- `lib/journal.ts` — same pattern with more complex parsing.

**Test scenarios:**
- Happy path: `getTicketRecords()` with a 3-record fixture JSON returns a typed array of 3 items.
- Edge case: empty `[]` fixture returns an empty array without throwing.
- Edge case: record with `null` price fields is returned with nulls intact (not coerced to 0).

**Verification:**
- TypeScript compiles without errors. `getTicketRecords()` returns `TicketRecord[]` when called from a Server Component.

---

### U5. THE LABS stub page

**Goal:** Create `app/projects/page.tsx` — a minimal landing page for the `/projects` route so it doesn't 404.

**Requirements:** R9 (prerequisite — `/projects/ticket-ticker` requires a working parent route hierarchy)

**Dependencies:** None

**Files:**
- Create: `app/projects/page.tsx`

**Approach:**
- Server Component. Export `metadata` with `title: 'THE LABS'`.
- Header pattern matching `app/music/page.tsx`: metadata strip → `font-headline text-5xl font-black uppercase` H1 → `h-1 w-24 bg-primary` red divider.
- Body: a single card or text block linking to `/projects/ticket-ticker`. Minimal — full LABS design is deferred.
- Use `--node-labs` (`#e87a3a`) as the accent color for this section (maps to the existing nav `wine` class, but THE LABS node color is distinct).

**Patterns to follow:**
- `app/music/page.tsx` — layout structure.

**Test scenarios:**
- Test expectation: none — stub page with no behavioral logic.

**Verification:**
- `localhost:3000/projects` renders without 404. Title shows "THE LABS". Link to `/projects/ticket-ticker` is present.

---

### U6. Ticket Ticker page

**Goal:** Create `app/projects/ticket-ticker/page.tsx` — the Server Component that loads the data and renders the page shell with the chart.

**Requirements:** R9, R10 (page container), R15 (indirectly — the article now links here)

**Dependencies:** U4, U5

**Files:**
- Create: `app/projects/ticket-ticker/page.tsx`

**Approach:**
- Server Component (no `'use client'`).
- Export `metadata`: `title: 'Ticket Ticker'`, `description` matching the article's framing.
- Page header: metadata strip (`font-mono text-[10px] uppercase tracking-widest`) → `font-headline text-5xl font-black uppercase` H1 → `h-1 w-24 bg-primary my-4` divider → 1–2 sentence description of what the chart shows.
- Call `getTicketRecords()` from `lib/ticket-ticker.ts` (build time).
- Render `<TicketTickerChart records={records} />` — the client component from U7.
- No `generateStaticParams()` needed (non-dynamic route).

**Patterns to follow:**
- `app/music/page.tsx` for page shell.
- `app/music/gig-archive/page.tsx` for the pattern of a page that loads JSON data and renders a client-heavy component.

**Test scenarios:**
- Test expectation: none — data loading is tested in U4; chart behavior is tested in U7.

**Verification:**
- `localhost:3000/projects/ticket-ticker` renders with the correct title and description. Chart component appears (even if with fixture data).

---

### U7. TicketTickerChart client component

**Goal:** Create `components/TicketTickerChart.tsx` — the interactive `'use client'` SVG bubble chart with event/date filters and hover tooltips.

**Requirements:** R10, R11, R12, R13, R14

**Dependencies:** U4 (TicketRecord type), U6 (consumed by)

**Files:**
- Create: `components/TicketTickerChart.tsx`

**Approach:**
- `'use client'` at top.
- Props: `records: TicketRecord[]`.
- State: `eventFilter: string`, `startDate: string`, `endDate: string`, `hoveredEvent: string | null`.
- `useMemo` derives: (1) filtered records (apply event substring match + date range), (2) per-event aggregates: `{ event, demand, avgLoss, avgPrice }[]` — demand = BUY count, avgLoss = mean `(price - originalPrice) / originalPrice * 100` for SELL records where both values are present, avgPrice = mean `price` for SELL records.
- SVG coordinate math: linear scale — map demand to X (left pad to right pad), map avgLoss to Y (bottom = 0, upward), bubble radius = `sqrt(avgPrice)` normalized to a reasonable pixel range with a minimum floor (see deferred question).
- Axes: minimal SVG `<line>` elements + `<text>` tick labels. No dependency needed.
- Hover: `onMouseEnter`/`onMouseLeave` on each `<circle>` sets `hoveredEvent`. Tooltip renders as absolute-positioned `<div>` (not SVG) containing event name, demand, avg loss %, avg price.
- Filter UI: `<input type="text">` for event search, two `<input type="date">` for date range, a "Clear all" button that resets all three. Styled with existing Tailwind tokens.
- Dark mode: use `var(--coral)`, `var(--violet)` etc for bubble fill — they pick up `.dark {}` overrides automatically. Apply `mounted` guard before any `useTheme` call (per learnings).
- Mobile: chart is scrollable horizontally if viewport is narrow (`overflow-x: auto` on container). No per-frame heavy effects.
- No animation on mount (MVP). Hover opacity change only.

**Technical design:** *(directional)*
```
useMemo → filteredRecords → eventAggregates[]
  eventAggregates.map(e => ({
    ...e,
    cx: xScale(e.demand),      // linear: [0, maxDemand] → [leftPad, width - rightPad]
    cy: yScale(e.avgLoss),     // linear: [0, maxLoss] → [height - bottomPad, topPad]
    r: rScale(e.avgPrice),     // sqrt: [minPrice, maxPrice] → [minR, maxR]
  }))
```

**Patterns to follow:**
- `components/HomeGraph.tsx` — SVG coordinate math, `useRef`, `useState`, hover state pattern.
- `components/CollapsibleSection.tsx` — minimal `'use client'` + `useState`.
- Dark mode `mounted` guard pattern from `docs/solutions/design-patterns/dark-mode-tailwind-v4-next-themes-2026-06-03.md`.

**Test scenarios:**
- Covers AE2: given records with `date` spanning Jan–Dec 2025, applying a filter of Jan–Jun 2025 removes events with only post-June messages from the chart.
- Covers AE3: given a bubble for "Lollapalooza 2025" with known aggregated values, hovering it renders a tooltip containing the event name, correct demand count, and avg loss %.
- Covers AE4: given an active event filter "Coldplay" and an active date range, clicking "Clear all" resets both filters and the chart returns to showing all events.
- Happy path: given 10 fixture records across 3 events, chart renders 3 bubbles positioned correctly by their aggregated X/Y values.
- Edge case: given records where all SELL entries have null `originalPrice`, the Y-axis shows 0% loss (or N/A) without crashing.
- Edge case: event filter with no matches renders an empty chart with a "No events match" message, not a blank SVG.
- Edge case: single-record event (1 buy, no sells) renders a bubble at the minimum radius without NaN coordinates.
- Integration: filtering by date range in R12 uses `message_date` not any other date field.

**Verification:**
- `localhost:3000/projects/ticket-ticker` renders bubbles. Typing an event name in the filter updates the chart. Hovering shows a tooltip. Clear all restores full chart.
- TypeScript compiles with no `any` errors.

---

### U8. Article link update

**Goal:** Update the "visit our website" placeholder in the Stress Fractures article to link to `/projects/ticket-ticker`.

**Requirements:** R15

**Dependencies:** U6 (page must exist before linking)

**Files:**
- Modify: `content/writing/stress-fractures-india-s-concert-boom-seen-through-ticket-resale-markets.mdx` (line 53)

**Approach:**
- Replace the bold paragraph:
  ```
   **For a fully interactive view of our findings, visit our website!**
  ```
  with a linked version:
  ```
  **For a fully interactive view of our findings, [visit our website](/projects/ticket-ticker).**
  ```
- Internal link (no `target="_blank"`). The MDX `a` component in `app/writing/[slug]/page.tsx` already handles internal vs external routing by checking `href?.startsWith('http')`.

**Patterns to follow:**
- Existing MDX links in other articles — internal links use `[text](path)` syntax.

**Test scenarios:**
- Test expectation: none — MDX content change with no behavioral logic.

**Verification:**
- The article page renders the phrase as a clickable link. Clicking it navigates to `/projects/ticket-ticker`.

---

## System-Wide Impact

- **No Nav changes needed.** `components/Nav.tsx` already contains `<Link href="/projects">` — the route going live is sufficient.
- **Build-time data loading.** `content/ticket-ticker.json` is read by `lib/ticket-ticker.ts` at build time. If the file is absent, the build fails. The `[]` fixture in U4 prevents this during development; the pipeline output replaces it before deploy.
- **Dark mode.** All SVG fill colors use CSS custom properties (`var(--coral)` etc.) which pick up `.dark {}` overrides automatically. The `mounted` guard in TicketTickerChart prevents SSR hydration mismatch.
- **Static generation.** The Ticket Ticker page has no dynamic segments. No `generateStaticParams()` needed. No ISR.
- **Unchanged invariants.** The writing, record, and music sections are untouched. The Nav `/projects` link was already present — this just makes it resolve.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Existing 7k CSV not seeded into JSON before first deploy | Create a minimal valid `content/ticket-ticker.json` fixture (`[]`) as part of U4 so the build passes. Full data seeding is a one-time operation the user runs locally before deploying with real data. |
| `avgLoss` computation is thin for most events (sparse `originalPrice`) | Deferred to implementation: decide whether to show N/A or exclude from Y-axis. Document the limitation in the page's description text. |
| SVG bubble chart mobile experience | Apply `overflow-x: auto` on the chart container. Defer touch/pan interactivity to post-MVP. |
| Colab extraction prompt references old model string (`claude-sonnet-4-20250514`) | U2 sets MODEL from `config.py`; correct string is `claude-sonnet-4-6` per handoff doc note. |
| Pipeline API cost on large incremental runs | Incremental dedup (U2 stage 1) prevents re-extraction of existing messages. Each ~500-message run ≈ $0.25 at Sonnet pricing per handoff estimate. |
| Event name normalization edge cases (false positives: "sting", "fisher", "king") | Known issues documented in handoff. No fix needed for MVP — carry known edge cases as comments in `config.py`. |

---

## Documentation / Operational Notes

- After shipping, update the `ROADMAP.md` milestone for Ticket Ticker.
- **First-run data seeding** (one-time): Export each of the two baseline Google Sheets as CSV, then run `python scripts/ticket_ticker/pipeline.py --seed baseline.csv --output content/ticket-ticker.json`. This converts the existing ~7k records to the compact JSON schema without re-running Claude extraction. Repeat for both sheets and merge, or pipe sequentially using `--existing`.
- Future runs: `python scripts/ticket_ticker/pipeline.py --exports new_export.txt --existing content/ticket-ticker.json` → commit updated JSON → push → Vercel deploys.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-06-16-ticket-ticker-requirements.md](docs/brainstorms/2026-06-16-ticket-ticker-requirements.md)
- Pipeline spec: `ticket_ticker_technical_handoff.md`
- Reference viz component: `components/HomeGraph.tsx`
- Reference data loader: `lib/content.ts`, `lib/journal.ts`
- Reference script: `scripts/import-wp.ts`
- Dark mode pattern: `docs/solutions/design-patterns/dark-mode-tailwind-v4-next-themes-2026-06-03.md`
- Mobile SVG performance: `docs/solutions/design-patterns/homepage-hero-graph-flat-constellation-2026-06-03.md`
- Token convention: `docs/solutions/conventions/tailwind-v4-dual-token-palette-update-2026-06-12.md`
