# Oh Messy Life — Product Roadmap

> A public personal archive. Full technical vandalism aesthetic. Built in Next.js, hosted on Vercel, content in MDX. Generalist's living document: writing, projects, music, professional journey. Ship the core, expand iteratively.

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
/writing/[slug]       THE MANUSCRIPT   ← article view (marginalia sidebar)
/projects             THE LABS         ← project showcases (future)
/projects/[slug]      THE LAB_ENTRY    ← individual project (future)
/music                THE SIGNAL       ← photo archive + library browser (future)
/about                THE CODEX        ← professional journey (future)
```

---

## Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + custom globals (Stitch effect classes)
- **Content:** MDX files + `gray-matter` + `next-mdx-remote`
- **Dark mode:** `next-themes`
- **Hosting:** Vercel
- **Domain:** TBD
- **Name/copy:** Placeholder for now

---

## Phase 1 — Foundation (v1) `[ COMPLETE ✓ ]`

> Shipped 2026-03-21. All routes build clean, committed to git.

### Milestone 1.1 — Scaffold + Design System ✓
- [x] `create-next-app` (TypeScript, Tailwind v4, App Router)
- [x] Install: `next-mdx-remote`, `gray-matter`, `next-themes`
- [x] `globals.css` — full Stitch token set via `@theme` (Tailwind v4 CSS config)
- [x] All Stitch effect classes: `.distressed-text` `.tape-effect` `.drip-mask` `.scan-line` `.stamp-*` `.ink-bleed`
- [x] Stitch HTML reference files in `_stitch/`, screenshots in `public/screenshots/`

### Milestone 1.2 — Shared Shell ✓
- [x] `Nav.tsx` — wordmark, nav links (Writing live, Labs/Signal coming soon), dark mode toggle
- [x] `Footer.tsx` — social nodes (Instagram, GitHub, Are.na, Read.cv, Substack)
- [x] `DarkModeToggle.tsx` — next-themes class-based toggle
- [x] `layout.tsx` — Space Grotesk / Inter / JetBrains Mono via next/font, ThemeProvider

### Milestone 1.3 — Content Pipeline ✓
- [x] `lib/content.ts` — reads/parses/sorts MDX from `content/writing/`
- [x] Frontmatter schema: `title`, `date`, `tags[]`, `excerpt`, `status: draft | published`
- [x] Custom MDX components: h2, p, blockquote, hr, strong, em, code, ul, li
- [x] 3 seed posts added (replace/extend with real writing)

### Milestone 1.4 — Pages ✓
- [x] **THE NEXUS** (`/`) — hero + workbench + Scriptorium article list + Vault + Labs stub
- [x] **THE VOID** (`/writing`) — bento-punk grid with 3 card variants
- [x] **THE MANUSCRIPT** (`/writing/[slug]`) — marginalia sidebar, MDX body, mobile nav

### Milestone 1.5 — Ship `[ IN PROGRESS ]`
- [x] Dark mode working (light/dark toggle, system default)
- [x] Build passes (all 4 routes prerendering clean)
- [x] Initial commit on `main`
- [x] Push to GitHub remote → https://github.com/arnavmcr/oh-messy-life
- [ ] Import to Vercel
- [ ] Verify all routes in Vercel preview deploy
- [ ] Update social links in `components/Footer.tsx` with real URLs
- [ ] Replace seed posts with real writing

---

## Phase 2 — Labs (Projects) `[ PLANNED ]`

> Showcase work with varying levels of interactivity.

### Project card types
- **Simple** — title, description, tags, link (text-only)
- **Case study** — annotated scroll: images, code snippets, diagrams, commentary (MDX-driven)
- **Live embed** — iframe/sandbox of running project
- **Graph** — D3/force-directed graph showing connections between projects/ideas (Obsidian-style)

### Milestones
- [ ] `/projects` — THE LABS listing page (grid of project cards)
- [ ] `/projects/[slug]` — THE LAB_ENTRY template (MDX for case studies)
- [ ] Live embed component (sandboxed iframe with fallback)
- [ ] Graph visualisation component (D3, lazy-loaded)
- [ ] Integrate projects into THE NEXUS home (replace Labs stub)

---

## Phase 3 — Signal (Music) `[ PLANNED ]`

> Two sub-sections: photo archive and music library browser.

### 3a — Photo Archive
- Gallery grid of photos (gigs, studios, scenes)
- Lightbox on click
- Filterable by tag/year

### 3b — Library Browser
- Input: existing JSON file of music library
- Display: browsable archive by artist/album/tag
- Aesthetic: terminal/database read-out — monospaced, dense, scannable
- Optional: visualise as graph (artist connections, genre clusters)

### Milestones
- [ ] `/music` — THE SIGNAL landing (split: photos vs library)
- [ ] Photo gallery component with lightbox
- [ ] Library browser: parse JSON, render as searchable/filterable table
- [ ] Library graph visualisation (optional stretch)

---

## Phase 4 — Codex (Professional Journey) `[ EXPLORATORY ]`

> Non-linear career story. Career changer — the messiness *is* the point.

### Concepts to explore
- **Constellation** — skills, roles, projects as connected nodes. Relationships visible at a glance.
- **Annotated timeline** — horizontal scroll with key inflection points, not a CV
- **Scrolling narrative** — long-form, story-driven, punctuated by visuals

### Milestones
- [ ] Decide on visualisation approach (timeline vs constellation vs narrative)
- [ ] `/about` — THE CODEX page with chosen visualisation
- [ ] Content: write the non-linear career narrative

---

## Phase 5 — Polish + Growth `[ FUTURE ]`

- [ ] Real domain + DNS on Vercel
- [ ] Real name/bio copy
- [ ] OG images per page (auto-generated with Vercel OG)
- [ ] RSS feed for writing
- [ ] Search (Fuse.js client-side or Algolia)
- [ ] "TERMINAL" easter egg (fake CLI, navigable via keyboard)
- [ ] Analytics (privacy-respecting: Plausible or Fathom)
- [ ] Performance audit (Core Web Vitals)

---

## Decisions Log
| Date | Decision | Rationale |
|---|---|---|
| 2026-03-21 | Next.js App Router | Vercel-native, SSG-friendly, App Router is the direction |
| 2026-03-21 | MDX + gray-matter (no CMS) | Content in repo, version-controlled, no external dependency |
| 2026-03-21 | Full technical vandalism aesthetic | Committed to the Stitch direction |
| 2026-03-21 | Dark mode both (user-toggled) | Accessibility + preference |
| 2026-03-21 | Core first (home + writing) | Posts exist, ship value fast |
| 2026-03-21 | Domain TBD | "Oh Messy Life" name likely but not locked |
