---
date: 2026-06-16
topic: ticket-ticker-phase2
---

# Ticket Ticker — Phase 2: Data Quality, Schema Enrichment, Drill-Down

Continues from `docs/brainstorms/2026-06-16-ticket-ticker-requirements.md` (the Phase 1 MVP, now live).

---

## Problem Frame

The shipped MVP has four compounding quality gaps:

1. **Loss metric is nearly meaningless.** The current pipeline only captures original price when explicitly stated in the message. Only ~35% of SELL records have an original price → the remaining 65% show Y=0 not because sellers break even but because we have no data. The chart's Y-axis is therefore unreliable.

2. **Event name fragmentation.** "Coldplay", "Coldplay Mumbai", "Coldplay Ahmedabad" appear as separate bubbles. City is part of the event name rather than a separate field, so there's no way to aggregate by artist or drill down by city.

3. **Noisy default view.** With no minimum demand filter, micro-events (1–2 buy requests) clutter the chart. The reader has to manually filter before anything useful is visible.

4. **Base folder disarray.** 22 `extracted_*.json` pipeline checkpoint files, the source CSV and ZIP, and miscellaneous docs litter the project root.

The `Ticket ticker - Expanded 27 Jan.csv` file (the original Colab output, manually QC'd) contains the richer schema we should aspire to. Reseeding from it and aligning the pipeline to its format fixes gaps 1 and 2 in one pass.

---

## Actors

Same as Phase 1.
- **A1. Arnav (data operator)** — runs the pipeline, commits data, deploys.
- **A2. Reader (public explorer)** — visits the page and explores the chart.

---

## Work Tracks

Three sequential tracks:

```
C (Cleanup) → A (Data / Pipeline) → B (Frontend)
```

---

## Requirements

### Track C — Cleanup

- **C1.** Delete all `extracted_*.json` pipeline checkpoint files from the project root (already gitignored; no longer needed after the reseed).
- **C2.** Move source data files to `scripts/ticket_ticker/data/`: the Expanded CSV, the Master CSV, and the WhatsApp ZIP.
- **C3.** Remove the `node_modules 2` phantom directory from the project root.
- **C4.** Move `ticket_ticker_technical_handoff.md` to `docs/`.
- **C5.** Update `.gitignore` to cover the new data subfolder if needed (CSV and ZIP should remain untracked — they are large personal data files).

---

### Track A — Data Schema + Pipeline

#### Schema

The target JSON schema for `content/ticket-ticker.json` extends the current 7-field compact format:

| Field | Type | Notes |
|---|---|---|
| `event` | string | Artist / festival name only — **no city suffix** |
| `location` | string \| null | Normalized city: "Mumbai", "Delhi", etc. |
| `event_date` | string \| null | Concert date (YYYY-MM-DD), from `event_date_mapped` / `Event date vF` |
| `type` | "BUY" \| "SELL" | Unchanged |
| `price` | number \| null | Resale ask price |
| `original_price_inferred` | number \| null | Face value (explicit, dataset-inferred, or price_map) |
| `price_inference_source` | "explicit" \| "dataset" \| "price_map" \| null | Reliability indicator |
| `num_tickets` | number \| null | Number of tickets in the listing |
| `category` | string \| null | Normalized ticket category |
| `message_date` | string | YYYY-MM-DD (when the message was posted) |
| `message_hash` | string | MD5 dedup key (internal, not exposed to frontend) |

The existing `originalPrice` field is replaced by `original_price_inferred`. The existing `price` field maps to `price_per_ticket`.

#### Reseed (replaces the Master CSV baseline)

- **A1.** Reseed `content/ticket-ticker.json` from `scripts/ticket_ticker/data/Ticket ticker - Expanded 27 Jan.csv` using the new schema. Use `Event date vF` as `event_date`, `original_price_inferred` (or `Original Price vF` where populated) as `original_price_inferred`, `location_normalized` as `location`, `event_name_normalized` as `event`.
- **A2.** Keep `message_hash` computed as before (MD5 of `sender_name|content`) for dedup continuity.

#### Pipeline updates (for post-Jan-27 WhatsApp extractions)

- **A3.** Update the Claude extraction prompt to output `event_name` and `location` as separate fields rather than a concatenated string. City should NOT be appended to the event name.
- **A4.** Update `config.py` ARTIST_MAP and FESTIVAL_MAP: city suffixes are no longer appended to normalized event names. All "Coldplay Mumbai", "Coldplay Ahmedabad" → `event = "Coldplay"`, `location = "Mumbai" / "Ahmedabad"`.
- **A5.** Add a post-extraction inference step: after extraction, for each SELL record missing `original_price_inferred`, look up other SELL records for the same `event + category` pair with `price_inference_source = "explicit"` and copy their `original_price`. Mark these as `price_inference_source = "dataset"`. This replicates the Colab "dataset" inference method.
- **A6.** Update `renorm.py` to handle the new schema fields when re-applying maps.
- **A7.** Update `lib/ticket-ticker.ts` TypeScript type to reflect the new schema (add `location`, `event_date`, `original_price_inferred`, `price_inference_source`, `num_tickets`).

---

### Track B — Frontend

#### Default state and noise reduction

- **B1.** Pre-load the chart with `minDemand = 40` (events with fewer than 40 buy requests are hidden by default). This state is initialised in `useState`, not a URL param. A control in the filter bar shows the current threshold and allows adjustment (slider or input).

#### Artist-level aggregation

- **B2.** The primary chart aggregates by `event` (artist/festival name), summing demand and averaging loss/price across all cities and dates. "Coldplay Mumbai" and "Coldplay Ahmedabad" both contribute to one "Coldplay" bubble.
- **B3.** When drilling down (see B4), aggregation switches to `event + location`, rendering one bubble per city.

#### Drill-down interaction

- **B4.** Clicking an artist bubble re-renders the chart to show only that artist's city-level sub-events. Each sub-bubble represents one city (and one tour year if the artist appeared in multiple years). A breadcrumb row above the chart shows the path (e.g., `ALL ARTISTS › COLDPLAY`) and clicking the root restores the full artist view.
- **B5.** If an artist has only one city in the data, clicking their bubble still enters drill-down mode (breadcrumb appears; "back" returns to artist view). This avoids a special-case where clicking seems to do nothing.

#### Loss metric fix

- **B6.** Compute `avgLoss` using `original_price_inferred` (not the old `originalPrice`). Formula unchanged: `(original_price_inferred - price) / original_price_inferred × 100`.
- **B7.** Distinguish "0% loss" from "no loss data" visually. Events with `avgLossValid = false` (no records with both price and inferred original price) are plotted on the X-axis at Y=0 but rendered with a distinct appearance (lower opacity, dashed stroke, or a different fill color) with a note in the legend.

#### Tooltip enrichment

- **B8.** Tooltip (hover/tap) adds to existing fields:
  - Event date (from `event_date`) — shown as a formatted date if available
  - Sell count (total SELL records, alongside existing buy count)
  - Loss data coverage note if `avgLossValid = false` ("loss data unavailable")

#### Copy / metadata

- **B9.** Update the source strip on the page to reflect the full date range (Nov 2023 – Jun 2026).

---

## Acceptance Examples

- **AE-A1.** Given the Expanded CSV reseed, ≥ 85% of SELL records in `content/ticket-ticker.json` have a non-null `original_price_inferred`.
- **AE-A2.** "Coldplay Mumbai" messages are stored with `event = "Coldplay"` and `location = "Mumbai"`, not as `event = "Coldplay Mumbai"`.
- **AE-B1.** On page load (no user interaction), the chart shows only events with ≥ 40 buy requests. A "Min demand: 40" control is visible in the filter bar.
- **AE-B2.** Clicking the Coldplay bubble re-renders the chart with 3–4 sub-bubbles (Mumbai, Ahmedabad, Delhi, and possibly an unlabelled "other" for ambiguous city records). The breadcrumb reads `ALL ARTISTS › COLDPLAY`. Clicking `ALL ARTISTS` returns to the full view.
- **AE-B3.** An event bubble with no `original_price_inferred` records appears at Y=0 with a distinct visual treatment (lower opacity / dashed stroke). The legend notes this state.

---

## Success Criteria

- Seller loss % is computable for ≥ 85% of SELL records (up from ~35%).
- Default artist view shows ≤ ~60 bubbles without any filter interaction, making the chart legible on first load.
- Clicking any artist bubble renders the city drill-down in < 100ms (pure client-side re-aggregation, no fetch).
- Project root contains no stray pipeline artifacts, loose data files, or phantom `node_modules` directories.

---

## Scope Boundaries

- **Manual QC price overrides** (`Manual QC Price`, `QC Inferred Price`, `Manual QC Date` columns from the Expanded CSV) — Colab-specific overrides, not replicable without the original Colab tooling. Deferred.
- **Price_map for new events (post-Jan 27)** — requires a maintained lookup table of face values per event/category. The Expanded CSV has this for known events; new events added after Jan 27 won't have it until explicitly built. Deferred.
- **`sender_name`, `original_message`, `source_file`** — personal data or bulk data that would bloat the committed JSON. Not in output schema.
- **Chart view type switchers** (supply/demand ratio, price over time, category breakdown) — still deferred per Phase 1 doc.
- **Shareable filter URLs, saved state, user accounts** — still deferred.
- **Automated ingestion** (cron, webhook) — still laptop-triggered only.

---

## Key Decisions

- **Reseed from Expanded CSV, not Master CSV.** The Expanded CSV has `original_price_inferred`, `location_normalized`, and `event_date_mapped` already computed and QC'd. Starting from it collapses three separate pipeline problems into one reseed operation.
- **`event` = artist only, `location` = city.** Separating these fields is the prerequisite for both artist-level aggregation and city-level drill-down. All existing normalization maps need to be updated to not append city to event names.
- **Dataset inference (A5) over price_map.** The price_map (known face values per event) exists in the Colab notebooks but hasn't been ported. Dataset inference (copy from an explicit record for the same event) is simpler to implement and covers the majority of the gap.
- **Drill-down is client-side re-aggregation.** No new data fetch — the full dataset is already in memory. The drill-down is a state switch from `groupBy: event` to `groupBy: event+location`.

---

## Dependencies / Assumptions

- The Expanded CSV (`scripts/ticket_ticker/data/Ticket ticker - Expanded 27 Jan.csv` after cleanup) is the authoritative baseline for Nov 2023 – Jan 27 2026.
- Post-Jan-27 records (Jan 27 – Jun 2026, already in `content/ticket-ticker.json`) will need to be re-extracted with the updated pipeline if we want `location` and `event_date` populated for them. Alternatively, we accept that post-Jan-27 records have `location = null` and `event_date = null` initially.
- The `message_hash` dedup key format is unchanged — existing post-Jan-27 hashes remain valid after reseed.

---

## Work Order

1. **Track C** — clean the root folder (mechanical, low risk)
2. **Track A** — update pipeline, reseed JSON, update TypeScript type
3. **Track B** — update frontend chart component to use new schema and interactions

Each track is a clean PR boundary.
