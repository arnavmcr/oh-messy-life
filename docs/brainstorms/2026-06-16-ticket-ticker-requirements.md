---
date: 2026-06-16
topic: ticket-ticker
---

# Ticket Ticker

## Summary

A new standalone page on Oh Messy Life (`/projects/ticket-ticker`) with an interactive, filterable bubble chart of India's secondary concert ticket market, backed by a local Python CLI pipeline that ingests WhatsApp export files and outputs an updated data file for the site.

---

## Problem Frame

The Stress Fractures article already contains analysis of India's ticket resale market — but it presents that analysis as static images with a placeholder line promising an interactive version ("For a fully interactive view of our findings, visit our website"). That link goes nowhere.

The underlying data pipeline (three Google Colab notebooks) is also unergonomic: it has Colab-specific file picker calls, the normalization maps are duplicated across two notebooks, and a separate deduplication preprocessing notebook sits upstream with no clear documented sequence. Each time new WhatsApp exports arrive, the update process is manual, fragile, and spread across multiple notebooks.

The result: the interactive chart the article promised has never shipped, and the pipeline that powers it requires Colab to run — making future updates a chore.

---

## Actors

- A1. **Arnav (data operator)** — runs the pipeline on his laptop with new WhatsApp exports, commits the updated data file, and deploys.
- A2. **Reader (public explorer)** — visits the page on Oh Messy Life, filters the chart by event or date, and explores the secondary market data.

---

## Key Flows

- F1. **Ingestion and update**
  - **Trigger:** New WhatsApp `.txt` exports are available on A1's laptop.
  - **Actors:** A1
  - **Steps:** (1) Run dedup preprocessing on new exports to filter out messages already in the dataset. (2) Run extraction stage — calls Claude API on new messages in batches. (3) Run cleanup/normalization — event name canonicalization, pass type detection, post-extraction dedup. (4) Output updated data file. (5) Commit data file and deploy.
  - **Outcome:** The public page reflects the updated dataset within one deploy cycle.
  - **Covered by:** R1, R2, R3, R4, R5, R6, R7, R8

- F2. **Reader exploration**
  - **Trigger:** A2 visits `/projects/ticket-ticker`.
  - **Actors:** A2
  - **Steps:** (1) Page loads with full dataset rendered as a bubble chart. (2) A2 applies event/artist filter and/or date range filter. (3) Chart updates to show the filtered subset. (4) A2 hovers or taps a bubble to see event-level details.
  - **Outcome:** A2 understands demand and resale-loss patterns for the events they care about.
  - **Covered by:** R9, R10, R11, R12, R13, R14

---

## Requirements

**Pipeline**

- R1. The pipeline runs as CLI scripts from the user's laptop with no `google.colab` dependencies.
- R2. A single shared config module contains all normalization maps (FESTIVAL_MAP, ARTIST_MAP, CITY_MAP, LOLLA_WINDOWS, DGTL_WINDOWS, MULTI_DAY_EVENTS) — imported by all pipeline scripts, not duplicated.
- R3. The pipeline covers the full flow in a documented sequence: dedup preprocessing → Claude extraction → normalization/cleanup → data file output.
- R4. The dedup preprocessing step (previously the standalone third notebook) is part of the local workflow and runs before extraction.
- R5. The pipeline outputs a single data file in a format the frontend can consume directly.
- R6. Records with `confidence < 0.6` are excluded from the output data file.
- R7. The CLI accepts WhatsApp `.txt` export file paths as arguments, not via interactive file picker or hardcoded paths.
- R8. The Anthropic API key is read from an environment variable.

**Frontend**

- R9. A new page exists at `/projects/ticket-ticker` on Oh Messy Life.
- R10. The page displays an interactive bubble chart: X-axis = demand (buy request count per event), Y-axis = average seller loss %, bubble size proportional to average ticket price.
- R11. The chart is filterable by event/artist name.
- R12. The chart is filterable by date range, using `message_date` (the date the WhatsApp message was sent) as the axis — not `event_date`.
- R13. Hovering or tapping a bubble surfaces event-level details: event name, buy count, average seller loss %, average ticket price.
- R14. Filters can be cleared individually or all at once.
- R15. The Stress Fractures article (`content/writing/stress-fractures-india-s-concert-boom-seen-through-ticket-resale-markets.mdx`) is updated so its "visit our website" placeholder links to `/projects/ticket-ticker`.

---

## Acceptance Examples

- AE1. **Covers R6.** Given a dataset containing records with confidence scores of 0.4, 0.65, and 0.9, the output data file contains only the two records with confidence ≥ 0.6.

- AE2. **Covers R12.** Given a date range filter of Jan 2025 – Jun 2025, the chart shows only bubbles for events where buy/sell messages were posted in that window — regardless of when the event itself occurred.

- AE3. **Covers R13.** Given a bubble representing Lollapalooza 2025, when a reader hovers it, they see: event name, buy request count, average seller loss %, and average ticket price.

- AE4. **Covers R14.** Given an active event filter of "Coldplay" and an active date range, when the reader clears all filters, the chart returns to showing the full dataset.

---

## Success Criteria

- A reader landing on `/projects/ticket-ticker` can identify which events had the strongest secondary market demand and the steepest resale losses without reading the Stress Fractures article.
- Processing a batch of new WhatsApp exports completes end-to-end on a laptop in under 15 minutes.
- The article's static chart placeholder links to the live interactive page.

---

## Scope Boundaries

- Other dashboard views (supply/demand ratio, price over time scatter, top sellers by volume, event heatmap, category breakdown) — post-MVP.
- Web/browser UI for running the pipeline or uploading exports — CLI on laptop only.
- Cloud storage or database — data lives as a committed file in the repo; zero infra added at MVP.
- Live or streaming data updates — Vercel deploy is the update mechanism.
- User accounts, saved filter state, or shareable filter URLs.
- Automated ingestion scheduling (cron, webhook, cloud function) — laptop-triggered only.
- The pipeline is not ported to TypeScript/Node; it stays Python.

---

## Key Decisions

- **Data as a committed file in the repo:** At ~7k records the file is small, the site already uses static generation, and this requires no infra changes. Revisit if data exceeds ~100k records or update frequency demands something faster than a deploy.
- **`message_date` as the primary date axis:** `event_date` is frequently null or unreliable (extracted from informal text like "feb wkend"). `message_date` is always present and structurally reliable.
- **Pipeline stays Python:** The existing logic (pandas, anthropic SDK, regex-heavy parsing) has no meaningful TypeScript equivalent and porting adds cost with no user-visible benefit.

---

## Dependencies / Assumptions

- Anthropic API key available locally for the extraction stage.
- The existing ~7k record dataset from previous Colab runs exists as a CSV on the user's laptop; the pipeline must incorporate it as the starting baseline rather than re-extracting from scratch.
- A charting library will need to be added to the site — none is currently installed (verified against `package.json`).
- Vercel deployment is already configured and working.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R10, R11, R12] [Needs research] Which charting library best fits the React 19 / Next.js App Router stack? Observable Plot and Recharts are the primary candidates; selection depends on bundle size, the specific bubble/scatter chart type, and ease of filter wiring.
- [Affects R5] [Technical] What is the exact shape of the output data file? Planning should determine which fields from the 19-column CSV the chart actually needs and how event-level aggregation is computed (per-event demand count, avg loss %, avg price).
- [Affects R3, R4] [Technical] How does the pipeline handle incremental runs — does it append to the existing dataset file or rebuild from all source CSVs? The existing ~7k baseline needs to be the starting point, not re-extracted.
