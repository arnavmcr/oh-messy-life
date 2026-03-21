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

## Phase 1 — Foundation (v1) `[ CURRENT ]`

> Ship a working site with home, writing archive, and article view. Real posts go live.

### Milestone 1.1 — Scaffold + Design System
- [ ] `create-next-app` (TypeScript, Tailwind, App Router)
- [ ] Install: `next-mdx-remote`, `gray-matter`, `next-themes`
- [ ] `tailwind.config.ts` — port full Stitch token set (colours, fonts, radius)
- [ ] `globals.css` — port all Stitch effect classes
- [ ] Download Stitch HTML to `_stitch/` (local reference, not deployed)
- [ ] Download Stitch screenshots to `public/screenshots/`

### Milestone 1.2 — Shared Shell
- [ ] `Nav.tsx` — wordmark, nav links, build tag, dark mode toggle
- [ ] `Footer.tsx` — social nodes (Instagram, GitHub, Are.na, Read.cv, Substack)
- [ ] `DarkModeToggle.tsx` — next-themes integration
- [ ] `layout.tsx` — ThemeProvider wrap, nav + footer, font loading

### Milestone 1.3 — Content Pipeline
- [ ] `lib/content.ts` — read/parse/sort MDX from `content/writing/`
- [ ] Frontmatter schema: `title`, `date`, `tags[]`, `excerpt`, `status: draft | published`
- [ ] Custom MDX components: blockquote, pull-quote, footnote, code block
- [ ] Seed with user's existing posts

### Milestone 1.4 — Pages
- [ ] **THE NEXUS** (`/`) — hero with massive type, workbench with pinned/taped elements, real article list in Scriptorium, Vault stats from MDX count, Labs stub ("COMING SOON")
- [ ] **THE VOID** (`/writing`) — bento-punk grid of `ArticleCard` components from MDX frontmatter
- [ ] **THE MANUSCRIPT** (`/writing/[slug]`) — marginalia sidebar (TOC, system logs), article body, footnotes, mobile bottom nav

### Milestone 1.5 — Ship
- [ ] Dark mode: light `#f2f2f2` ↔ dark `#0a0a0a` backgrounds, same accent colours
- [ ] `npm run build` passes
- [ ] Push to GitHub, import to Vercel
- [ ] Verify all routes in Vercel preview

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
