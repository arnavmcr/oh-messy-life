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
/                     THE NEXUS        ← dense workbench home
/writing              THE VOID         ← writing archive (bento-punk grid)
/writing/[slug]       THE MANUSCRIPT   ← article view
/writing/college      THE COLLEGE      ← category page
/writing/college/[s]  THE SUBCATEGORY  ← subcategory page
/record               THE RECORD       ← journal archive (monthly entries) ← IN PROGRESS
/record/[slug]        THE ENTRY        ← individual monthly entry
/projects             THE LABS         ← project showcases (future)
/projects/[slug]      THE LAB_ENTRY    ← individual project (future)
/music                THE SIGNAL       ← photo archive + library browser (future)
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
- [x] New top-level categories: `projects`, `mba`, `essays` added to `lib/categories.ts`

### Milestone 1.4 — Pages ✓
- [x] **THE NEXUS** (`/`) — hero + workbench + article teasers + Vault section
- [x] **THE VOID** (`/writing`) — bento-punk grid with 3 card variants + rotations
- [x] **THE MANUSCRIPT** (`/writing/[slug]`) — MDX body, prev/next nav
- [x] **THE COLLEGE** (`/writing/college`) — category page
- [x] **Subcategory pages** (`/writing/college/[subcategory]`) — filtered view

### Milestone 1.5 — Ship `[ PARTIAL ]`
- [x] Dark mode working
- [x] Build passes clean
- [x] Pushed to GitHub → https://github.com/arnavmcr/oh-messy-life
- [ ] Import to Vercel
- [ ] Verify all routes in Vercel preview deploy
- [ ] Update social links in `components/Footer.tsx` with real URLs

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

---

## Phase 2 — Labs (Projects) `[ PLANNED ]`

> Showcase work with varying levels of interactivity.

### Milestones
- [ ] `/projects` — THE LABS listing page (grid of project cards)
- [ ] `/projects/[slug]` — THE LAB_ENTRY template (MDX for case studies)
- [ ] Live embed component (sandboxed iframe with fallback)
- [ ] Graph visualisation component (D3, lazy-loaded)
- [ ] Integrate projects into THE NEXUS home

---

## Phase 3 — Signal (Music) `[ PLANNED ]`

### 3a — Photo Archive
- Gallery grid of photos (gigs, studios, scenes), lightbox on click, filterable by tag/year

### 3b — Library Browser
- Input: existing JSON file of music library
- Aesthetic: terminal/database read-out — monospaced, dense, scannable

### Milestones
- [ ] `/music` — THE SIGNAL landing (split: photos vs library)
- [ ] Photo gallery component with lightbox
- [ ] Library browser: parse JSON, render as searchable/filterable table

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
