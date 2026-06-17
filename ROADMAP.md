# Oh Messy Life — Product Roadmap

> A public personal archive. Full technical vandalism aesthetic. Built in Next.js, hosted on Vercel, content in MDX/MD. Generalist's living document: writing, projects, music, professional journey. Ship the core, expand iteratively.

---

## Design System (locked from Stitch)
| Token | Value |
|---|---|
| Primary | `#FF1721` red |
| Secondary | `#3800c2` purple |
| Tertiary | `#006a3c` green |
| Font headline | Space Grotesk |
| Font body | Inter |
| Font mono | JetBrains Mono |
| Border radius | `0` everywhere |
| Border radius full | `9999px` only |
| Effects | `.distressed-text` `.tape-effect` `.drip-mask` `.scan-line` `.stamp-*` `.ink-bleed` |
| Icons | Material Symbols Outlined |
| Dark mode | User-toggled, system default |

---

## Site Map
```
/                     THE NEXUS        ← single-column "oh messy life." hero + content sections
/writing              THE VOID         ← writing archive (bento-punk grid)
/writing/[slug]       THE MANUSCRIPT   ← article view
/writing/college      THE COLLEGE      ← category page
/writing/college/[s]  THE SUBCATEGORY  ← subcategory page
/record               THE RECORD       ← journal archive (monthly entries) ← IN PROGRESS
/record/[slug]        THE ENTRY        ← individual monthly entry
/projects             THE LABS         ← project showcases (future)
/projects/[slug]      THE LAB_ENTRY    ← individual project (future)
/music                THE SIGNAL       ← landing page live; library proxied to /music/index.html
/about                THE CODEX        ← professional journey (future)
```

> `/record` codename "THE RECORD" is a placeholder — this is a flagship IP and the name will change.

---

## Stack
- **Framework:** Next.js 16.2.1 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + custom globals (Stitch effect classes)
- **Content (writing):** MDX files + `gray-matter` + `next-mdx-remote`
- **Content (record):** `.md` files + `gray-matter` + `next-mdx-remote/rsc` `compileMDX` for section bodies
- **Dark mode:** `next-themes` (class-based, `.dark` on `<html>`)
- **Fonts:** Google Fonts via `next/font` (Space Grotesk, Inter, JetBrains Mono)
- **Icons:** Material Symbols Outlined
- **Hosting:** Vercel

---

## Phase 1 — Foundation (v1) `[ COMPLETE ✓ ]`

> Shipped 2026-03-21. Content migration and category system completed same day.

### Milestone 1.1 — Scaffold + Design System ✓
- [x] `create-next-app` (TypeScript, Tailwind v4, App Router)
- [x] Install: `next-mdx-remote`, `gray-matter`, `next-themes`
- [x] `globals.css` — full Stitch token set via `@theme` (Tailwind v4 CSS config)
- [x] All Stitch effect classes: `.distressed-text` `.tape-effect` `.drip-mask` `.scan-line` `.stamp-*` `.ink-bleed`
- [x] Stitch HTML reference files in `_stitch/`, screenshots in `public/screenshots/`

### Milestone 1.2 — Shared Shell ✓
- [x] `Nav.tsx` — wordmark, Writing with subcategory dropdown, coming-soon stubs, dark mode toggle
- [x] `Footer.tsx` — social nodes (Instagram, GitHub, Are.na, Read.cv, Substack)
- [x] `DarkModeToggle.tsx` — next-themes class-based toggle
- [x] `layout.tsx` — Space Grotesk / Inter / JetBrains Mono via next/font, ThemeProvider

### Milestone 1.3 — Content Pipeline ✓
- [x] `lib/content.ts` — reads/parses/sorts MDX from `content/writing/`
- [x] `lib/categories.ts` — category/subcategory config with accent colors and post-it annotations
- [x] Frontmatter schema: `title`, `date`, `category`, `subcategory`, `tags[]`, `excerpt`, `coverImage`, `status`
- [x] `scripts/import-wp.ts` — one-off WP archive → MDX migration (90+ posts imported)
- [x] `scripts/import-medium.ts` — one-off Medium archive → MDX migration (4 posts, images self-hosted)
- [x] `scripts/import-substack.ts` — one-off Substack "After EOD" archive → MDX migration (6 posts, images self-hosted)
- [x] New top-level categories: `projects`, `mba`, `essays`, `music` added to `lib/categories.ts`

### Milestone 1.4 — Pages ✓
- [x] **THE NEXUS** (`/`) — single-column hero ("oh messy life.", four section nav links) + article teasers + Vault section
- [x] **THE VOID** (`/writing`) — bento-punk grid with 3 card variants + rotations
- [x] **THE MANUSCRIPT** (`/writing/[slug]`) — MDX body, centered single-column layout, metadata block, cover image, floating reading pill (share, text size, bookmark — all functional)
- [x] **THE COLLEGE** (`/writing/college`) — category page
- [x] **Subcategory pages** (`/writing/college/[subcategory]`) — filtered view

### Milestone 1.5 — Ship `[ COMPLETE ✓ ]`
- [x] Dark mode working
- [x] Build passes clean
- [x] Pushed to GitHub → https://github.com/arnavmcr/oh-messy-life
- [x] Import to Vercel
- [x] Verify all routes in Vercel preview deploy
- [x] Update social links in `components/Footer.tsx` with real URLs

---

## Phase 1.6 — The Record (Journal Archive) `[ IN PROGRESS ]`

> 21 monthly journal entries (Dec 2023–Feb 2026) exported from Notion, to be published as a flagship standalone section. Name "The Record" is a placeholder.

### Design decisions (locked)
- **Archive index** `/record`: numbered issue list, year-grouped, staggered fade-in animation on load, section titles visible as muted subtitle text, brightness dims on older entries, hover turns title red + shows arrow
- **Individual entry** `/record/[slug]`: editorial/magazine long-read, linear scroll, `###` headings rendered as named chapter breaks
- **"What is this and why am I doing this?" section**: collapsed by default, toggle reveals it
- **"Other random things" / "Other fun things"**: distinct bullet-list visual treatment (lighter type, more spacing)
- **Architecture**: `.md` files with YAML frontmatter (gray-matter) + structure-aware section parser. No MDX authoring — frontmatter is the escape hatch for per-entry overrides.

### Content schema — `content/record/*.md`
```yaml
---
title: "March '25"
date: "2025-03-01"
slug: "march-25"
issue: 15
status: published
# optional per-entry overrides:
# featured: true
# note: "short note shown in archive index"
---
```

### Section detection rules (in `lib/journal.ts`)
- Heading contains `"What is this"` (case-insensitive) → `collapsible: true`
- Heading matches `"Other random things"` or `"Other fun things"` (case-insensitive) → `bulletList: true`
- `"Links to previous months"` → strip entirely, do not render
- **Adaptive heading level:** if an entry has no named `###` sections beyond "What is this", `####` headings are promoted to top-level sections automatically. Entries with named `###` sections keep `####` as body subsections.

### Milestones
- [x] Content migration — 21 Notion exports → `content/record/*.md`
- [x] `lib/journal.ts` — section-aware parser: `getAllJournalEntries()`, `getJournalEntry(slug)` with prev/next
- [x] `components/CollapsibleSection.tsx` — client component (`'use client'`) for the collapsible "what is this" toggle
- [x] `app/record/page.tsx` — animated archive index
- [x] `app/record/[slug]/page.tsx` — editorial entry page with `generateStaticParams`
- [x] `components/Nav.tsx` — add RECORD as top-level nav link (no dropdown)
- [x] Add `.superpowers/` to `.gitignore`

### Milestone 1.7 — Homepage Changelog ✓
- [x] `content/changelog.json` — manual SITE-type entries
- [x] `lib/changelog.ts` — merges WRITING + RECORD + SITE entries, sorts by date desc, slices to limit
- [x] `components/Changelog.tsx` — terminal-feed Server Component, color-coded type labels (WRITING=red, RECORD=purple, SITE=green), no client JS
- [x] Wired into `app/page.tsx` between hero and content grid

### Milestone 1.8 — Nav fixes ✓
- [x] Category pages for `projects`, `mba`, `essays`, `music` — `[slug]/page.tsx` now dual-purpose: detects category keys and renders listing view, otherwise renders article
- [x] Writing dropdown hover gap fixed — replaced CSS `group-hover` with JS state + 150ms close delay

### Milestone 1.9 — Hero graph: flat constellation ✓ `2026-06-03`
- [x] Hub nodes removed — graph is now a flat leaf-only constellation
- [x] SIGNAL_LEAVES trimmed to 2 valid entries; LABS_LEAVES and `CAT_HREFS` deleted (LABS returns when `/projects` ships)
- [x] `GraphNode.kind`, `ax`, `ay` removed — no conditional branches in physics or render hot path
- [x] `makeLeafNode` spread widened: angle `rand(-1.6, 1.6)`, distance `rand(40, 300)`
- [x] Physics: `k_anchor` force deleted; all nodes get uniform weak center pull
- [x] Entry animation collapsed to single 1.2s opacity fade (was 2-speed hubs-then-leaves)
- [x] Labels at zoom ≥ 1.5×, scale-normalised font (`10 / view.scale`), truncated at 22 chars
- [x] Mobile: SVG `feDisplacementMap` filters gated off below 640px; 30fps frame-skip; 1.4s settle
- [x] Legend trimmed to 3 chips — WRITING, RECORD, SIGNAL

### Milestone 1.10 — Record: warm-organic animation system ✓ `2026-06-11`
- [x] `.entry-header-row` in `globals.css` — reuses `@keyframes fadeUp`; issue #, date, title stagger in at 0s / 0.08s / 0.18s (server component, CSS-only)
- [x] `.entry-section-reveal` + `.is-visible` in `globals.css` — CSS `transition` triggered by class toggle from IntersectionObserver
- [x] `.record-vignette::before` in `globals.css` — warm radial gradient on page edges; `mix-blend-mode: multiply` light / `screen` dark; `> *` z-index lift ensures content stays above pseudo-element
- [x] `components/ScrollReveal.tsx` — `'use client'` leaf component; IO-based one-shot reveal; `IntersectionObserver` unavailability guard; optional `delay` prop as `transitionDelay`
- [x] `app/record/[slug]/page.tsx` — header stagger wired, all three section variants wrapped in `ScrollReveal`, `<main>` gets `record-vignette`
- [x] `app/record/page.tsx` — `<main>` gets `record-vignette`; pre-existing `text-stone-400` replaced with `text-on-surface-variant`
- [x] `prefers-reduced-motion` extended — both new classes get `animation/transition: none`, `opacity: 1`, `transform: none`; vignette unaffected (non-motion)

---

## Phase 2 — Labs (Projects) `[ IN PROGRESS ]`

> Showcase work with varying levels of interactivity.

### 2a — Ticket Ticker `[ V1 + V2 LIVE ✓ ]`

**V1 (shipped 2026-06-16):** WhatsApp-to-chart pipeline. 16,544 records extracted from Mumbai concert ticket resale groups (Nov 2023 – Jun 2026), normalised, seeded to `content/ticket-ticker.json`. SVG bubble chart at `/projects/ticket-ticker` — plotted by buy demand (X), avg seller loss % (Y), bubble size = avg price. Static JSON load, zero new runtime dependencies.
- [x] `scripts/ticket_ticker/` — 4-stage Python pipeline: extract → normalise → infer → seed (CSV + JSON merge)
- [x] `lib/ticket-ticker.ts` — `getTicketRecords()`, `TicketRecord` 7-field interface, JSON loader
- [x] `components/TicketTickerChart.tsx` — SVG bubble chart with event/date-range filters and hover tooltips
- [x] `app/projects/ticket-ticker/page.tsx` — project page at `/projects/ticket-ticker`
- [x] Linked from stress-fractures article (`/writing/stress-fractures`)

**V2 (shipped 2026-06-17):** Schema enrichment, data quality, and chart drill-down.
- [x] 11-field JSON schema — `location` split from `event`, added `event_date`, `num_tickets`, `original_price_inferred`, `price_inference_source`
- [x] `normalize_event_name()` returns `(canonical, city)` tuple — city no longer fused into event names
- [x] Dataset price inference: 93.2% SELL coverage (target: ≥85%) via first-found `(event, category)` lookup
- [x] Reseed: 16,544 records, post-Jan-27 carry-forward preserved; `message_hash` dedup
- [x] Chart: minDemand filter (default 40), artist→city drill-down with breadcrumb, loss metric uses `original_price_inferred`, event date shown in tooltip
- [x] Root cleanup — pipeline data files gitignored, handoff doc moved to `docs/`
- [x] LABS category added to homepage constellation graph with Ticket Ticker node

### Milestones (remaining)
- [ ] `/projects` — THE LABS listing page (grid of project cards)
- [ ] `/projects/[slug]` — THE LAB_ENTRY template (MDX for case studies)
- [ ] Live embed component (sandboxed iframe with fallback)
- [ ] Graph visualisation component (D3, lazy-loaded)
- [ ] Integrate projects into THE NEXUS home

---

## Phase 3 — Signal (Music) `[ IN PROGRESS ]`

> `/music` currently proxies entirely to `arnav-music-library.vercel.app` via Next.js rewrite. Being restructured into a proper section with a landing page and sub-routes.

### Milestone 3.0 — Nav + Landing + Library rewrite `[ PARTIAL ✓ ]`
- [x] Promote SIGNAL in `Nav.tsx` from `comingSoon` span to real link with dropdown (Library + greyed stubs for Gig Archive, T-shirt Archive)
- [x] `app/music/page.tsx` — THE SIGNAL landing page with links to sub-sections
- [x] Library rewrite — not needed. External app has `base href="/music/"`, page file handles `/music`, rewrite handles `/music/:path*` sub-routes. No config change required.

### 3a — Gig Archive `[ V1 LIVE ✓ ]`

**V1 (shipped 2026-06-01):** Polaroid wall from Google Photos CDN URLs. Bypassed Cloudinary sync entirely — 238 base URLs in `lib/gig-photos.ts`, plain `<img>` with `=w600-h600-c` / `=w1920-h1080` transforms. No new dependencies, `next.config.ts` untouched.
- [x] `lib/gig-photos.ts` — 238 Google Photos CDN base URLs + `thumbUrl` / `fullUrl` helpers
- [x] `components/GigPolaroidWall.tsx` — polaroid card grid, deterministic rotation, tape/scan effects, group-hover grayscale-to-colour
- [x] `app/music/gig-archive/page.tsx` — Server Component page (replaced empty grid)
- [x] `lib/copy.ts` — added `COPY.signal.gigArchive.tagline`
- [x] `components/Nav.tsx` — Gig Archive link enabled
- [x] `app/music/page.tsx` — Gig Archive card active

**Cloudinary pipeline (preserved, deferred):** `GigArchive.tsx`, `GigLightbox.tsx`, `scripts/sync-gig-photos.ts`, and `content/gig-archive.json` are untouched and ready for a V2 upgrade with filters + lightbox when the sync script is run with real credentials.

### 3b — T-shirt Archive `[ PLANNED ]`
- `app/music/tshirt-archive/page.tsx`

### 3c — Library Browser (existing, being moved)
- External app at `arnav-music-library.vercel.app`, proxied to `/music/library`

---

## Phase 4 — Codex (Professional Journey) `[ EXPLORATORY ]`

> Non-linear career story. Career changer — the messiness *is* the point.

### Milestones
- [ ] Decide on visualisation approach (constellation vs timeline vs scrolling narrative)
- [ ] `/about` — THE CODEX page

---

## Phase 5 — Polish + Growth `[ FUTURE ]`

- [ ] Real domain + DNS on Vercel
- [ ] OG images per page (Vercel OG)
- [ ] RSS feed for writing + record
- [ ] Search (Fuse.js client-side)
- [ ] "TERMINAL" easter egg (fake CLI, keyboard navigable)
- [ ] Analytics (Plausible or Fathom)
- [ ] Performance audit (Core Web Vitals)

---

## Decisions Log
| Date | Decision | Rationale |
|---|---|---|
| 2026-03-21 | Next.js App Router | Vercel-native, SSG-friendly |
| 2026-03-21 | MDX + gray-matter (no CMS) | Content in repo, version-controlled |
| 2026-03-21 | Full technical vandalism aesthetic | Committed to Stitch direction |
| 2026-03-21 | Dark mode both (user-toggled) | Accessibility + preference |
| 2026-03-21 | WP content under `college` category | All WP content is undergraduate-era writing |
| 2026-03-22 | Journal section uses `.md` not `.mdx` | Pure prose, no JSX needed; structure-aware parser gives more control |
| 2026-03-22 | Journal frontmatter as escape hatch | Auto-structure by default, manual override when needed per entry |
| 2026-03-22 | Journal as flagship IP ("The Record") | Name is placeholder — will change; treat as premium standalone section |
| 2026-03-22 | Adaptive `###`/`####` section splitting in parser | Newer entries evolved to use `####` for all sections except "What is this"; fixed parser to detect this and promote `####` to top-level when no named `###` sections exist |
| 2026-03-22 | Medium posts use `projects`, `mba`, `essays` categories (not `college`) | Medium writing is post-grad era; taxonomy will continue to evolve |
| 2026-03-22 | Medium images self-hosted in `public/images/<slug>/` | Avoids dependency on miro.medium.com CDN going away |
| 2026-03-22 | Substack "After EOD" posts (6) under new top-level `music` category | These are 2024–2026 posts, distinct from `college → music` (2014–2019); `/music` is a planned route |
| 2026-03-22 | Substack images self-hosted in `public/images/<slug>/` | Avoids dependency on substackcdn.com CDN |
| 2026-03-22 | Hero redesigned: removed tech-jargon two-column workbench | Aesthetic shifted from hacker/systems to raw/personal soft-punk; "oh messy life." replaces "THE NEXUS" as the visual anchor |
| 2026-03-23 | THE MANUSCRIPT redesigned: removed sidebar, centered single-column | Based on "Refined Portfolio Article" Stitch reference; sidebar felt like dev tool, not reading experience; drop cap + floating pill added |
| 2026-03-24 | Homepage changelog: hybrid auto-derived + manual, terminal feed aesthetic | Auto-derives WRITING/RECORD entries from content files; manual `changelog.json` for SITE entries; pure Server Component, no client JS; 10 entries below hero |
| 2026-03-25 | SIGNAL nav: plain `<a>` for `/music/index.html` (not Next.js `<Link>`) | Avoids prefetch of the external library app; drop-in rewrite handles the proxy, no config change needed |
| 2026-03-29 | Reading pill extracted to `ReadingPill.tsx` client component | Enables Web Share API + clipboard fallback for share, localStorage text-size preference, localStorage bookmark toggle |
| 2026-06-03 | Hero graph: hub nodes removed, flat constellation | Hub-spoke topology fought the constellation aesthetic; toggle-on-hub-click was non-obvious; LABS nodes all linked to `/projects` (unbuilt route) |
| 2026-06-03 | Hero graph: `GraphNode.kind` discriminant deleted | Its only consumers were `k_anchor` physics branch and hub render split — removing it cleaned all three simultaneously |
| 2026-06-03 | Hero graph: labels at zoom ≥ 1.5× with `10 / view.scale` normalised font | Orientation without persistent visual clutter; scale-normalised size keeps labels consistent at any zoom |
| 2026-06-03 | Hero graph: SVG filter gating + 30fps frame-skip on mobile | `feDisplacementMap` exceeds 16ms budget on mobile; frame-skip keeps gesture loop at native fps without a canvas rewrite |
| 2026-06-11 | Record animations: CSS-first, no animation library | Three patterns (fadeUp, scroll-reveal, vignette) don't justify a motion token layer yet; introduce tokens when a fourth distinct pattern is added site-wide |
| 2026-06-11 | Record scroll-reveal: IntersectionObserver fires once, CSS transition for visibility | Prevents re-animation on back-scroll; CSS transition avoids new keyframe; `ScrollReveal` is a leaf client component wrapping a server-rendered section tree |
| 2026-06-11 | Record vignette: page-scoped `::before` on `<main>`, not a fixed overlay | Avoids z-index entanglement with existing `body::after` fog (z-index 0) and `body::before` grain (z-index 1000) |
| 2026-06-16 | Ticket Ticker: WhatsApp group → static JSON pipeline (no live API) | Data lives in WhatsApp exports, not a live service; static JSON seeded at build time keeps the chart zero-latency and dependency-free |
| 2026-06-17 | Ticket Ticker: `normalize_event_name()` returns `(canonical, city)` tuple | City was being fused into event names (e.g., "Coldplay Mumbai"), fragmenting artist aggregation; tuple return separates concerns without re-extraction |
| 2026-06-17 | Ticket Ticker: first-found price inference strategy for `original_price_inferred` | Average-of-SELL prices skews on resale outliers; first explicit value from same `(event, category)` pair is stable and deterministic |
| 2026-06-17 | Ticket Ticker: `"Unknown"` label for null location in drill-down | Consistent with Null Object pattern used throughout the chart; surfaces location-unattributed records rather than silently dropping them |
