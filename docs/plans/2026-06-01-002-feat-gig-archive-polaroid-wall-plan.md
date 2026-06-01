---
title: "feat: Gig Archive — polaroid wall from Google Photos CDN URLs"
type: feat
status: completed
date: 2026-06-01
origin: docs/brainstorms/2026-06-01-gig-archive-google-photos-embed.md
depth: lightweight
---

# feat: Gig Archive — polaroid wall from Google Photos CDN URLs

## Summary

Four files: a new `lib/gig-photos.ts` static URL array with transform helpers, a new `components/GigPolaroidWall.tsx` polaroid client component, a replaced `app/music/gig-archive/page.tsx` Server Component page, and a `lib/copy.ts` tagline field extension. Existing `GigArchive.tsx`, `GigLightbox.tsx`, `content/gig-archive.json`, and sync scripts are untouched per R5.

---

## Requirements

- R1. Static `GIG_PHOTOS` URL array and `thumbUrl` / `fullUrl` transform helpers in `lib/gig-photos.ts`
- R2. `GigPolaroidWall` client component with polaroid card design, deterministic rotation, tape/scan effects, columns layout, grayscale-to-colour hover, and new-tab click
- R3. `/music/gig-archive` page header, polaroid wall, stats strip, and back link matching the site's editorial style
- R4. `COPY.signal.gigArchive.tagline` field in `lib/copy.ts`
- R5. `GigArchive.tsx`, `GigLightbox.tsx`, `content/gig-archive.json`, and `scripts/sync-gig-photos.ts` are not modified

---

## Scope Boundaries

- No custom lightbox — V1 opens full-res image in a new tab
- No lazy loading or virtualization
- No Cloudinary sync pipeline changes
- No new npm dependencies
- `next/image` is not used — plain `<img>` only; `next.config.ts` is not touched

### Deferred to Follow-Up Work

- Custom lightbox and lazy loading: future iteration
- Cloudinary-backed upgrade (restore `GigArchive.tsx` path): separate PR

---

## Context & Research

### Relevant Code and Patterns

- `app/music/page.tsx` — header pattern for music section pages (eyebrow, heading, red divider)
- `app/music/gig-archive/page.tsx` — current page being replaced; already uses `max-w-7xl mx-auto px-4 py-16`
- `components/GigArchive.tsx` — do not touch; Cloudinary-backed, preserved for future upgrade
- `lib/copy.ts` — `COPY.signal.gigArchive` currently has `label`, `heading`, `description`; `tagline` must be added as a distinct field (do not repurpose `description`, which is used by the `/music` landing card)
- `app/globals.css` — `.tape-effect` (absolute pseudo-element tape strip, requires `position: relative` on parent) and `.scan-line` (4px repeating horizontal gradient overlay) confirmed

### Institutional Learnings

- `lh3.googleusercontent.com` is not in `next.config.ts` `remotePatterns` (only `res.cloudinary.com` is). Plain `<img>` is the right choice — Google CDN handles size transforms via URL suffix; `next/image` adds no benefit.
- The `/music/:path*` rewrite in `next.config.ts` does not intercept `/music/gig-archive` — App Router filesystem routes win. No routing changes needed.
- `'use client'` components in this codebase: directive as first line before imports, `interface Props`, named `export default function`.

---

## Key Technical Decisions

- **Plain `<img>` over `next/image`**: Google CDN applies size transforms via URL suffix (`=w600-h600-c`, `=w1920-h1080`). `next/image` optimization is redundant, and adding `lh3.googleusercontent.com` to `remotePatterns` is unnecessary scope. Plain `<img>` keeps the implementation clean and `next.config.ts` untouched.
- **Deterministic rotation via `index % 7`**: Cycles through `[-3, -2, -1, 0, 1, 2, 3]` degrees. Applied via inline `style={{ transform }}` since Tailwind v4 has no built-in utilities for small arbitrary degree rotations. Hover snap-back (`hover:rotate-0`) is handled via transition class, not inline style.
- **Static URL array in `lib/gig-photos.ts`**: The data layer (URLs) and transform logic (`thumbUrl`/`fullUrl`) are separated from the component. The array is populated by the implementer from extracted Google Photos embed `<object data="...">` URLs — the plan cannot pre-populate it.
- **`COPY.signal.gigArchive.tagline` as a new field**: `description` is already used by the `/music` landing card. Adding a distinct `tagline` avoids a silent breakage of the landing page copy.

---

## Open Questions

### Resolved During Planning

- **`next/image` or plain `<img>`**: Plain `<img>` — user confirmed. Google CDN handles transforms; `next.config.ts` unchanged.
- **Does `.tape-effect` need `position: relative`**: Yes, confirmed from `globals.css`. Polaroid card divs must have `relative` positioning.

### Deferred to Implementation

- **Exact number of photos in `GIG_PHOTOS`**: Depends on how many URLs the implementer extracts from the Google Photos embed HTML. The component renders whatever the array contains.
- **Whether `pb-8` is the right polaroid strip height**: Tweak during visual QA if the strip looks too thick or thin at the grid scale.

---

## Implementation Units

### U1. Static photo URL array and helpers

**Goal:** Create `lib/gig-photos.ts` exporting the `GIG_PHOTOS` array and the `thumbUrl` / `fullUrl` transform helpers.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Create: `lib/gig-photos.ts`

**Approach:**
- Export `const GIG_PHOTOS: string[]` — a plain array of CDN base URLs without size suffix
- Export `thumbUrl(base: string): string` returning `base + '=w600-h600-c'`
- Export `fullUrl(base: string): string` returning `base + '=w1920-h1080'`
- The array is populated from `<object data="...">` URLs extracted from the Google Photos shared album embed code; strip any trailing size suffix before storing
- No dependency on Cloudinary types or `lib/gig-utils.ts`

**Patterns to follow:**
- `lib/content.ts` and `lib/journal.ts` for the pattern of a focused module exporting named functions and a typed constant

**Test scenarios:**
- Happy path: `thumbUrl('https://lh3.googleusercontent.com/pw/ABC')` returns `'https://lh3.googleusercontent.com/pw/ABC=w600-h600-c'`
- Happy path: `fullUrl('https://lh3.googleusercontent.com/pw/ABC')` returns `'https://lh3.googleusercontent.com/pw/ABC=w1920-h1080'`
- Edge case: `GIG_PHOTOS` array has at least one entry after the implementer populates it (fail fast if empty — the page will render a blank wall)

**Verification:**
- `lib/gig-photos.ts` exports `GIG_PHOTOS`, `thumbUrl`, and `fullUrl` without TypeScript errors
- At least one URL in `GIG_PHOTOS` when populated; thumbnails load in browser

---

### U2. Add `tagline` to `COPY.signal.gigArchive`

**Goal:** Extend `lib/copy.ts` with a `tagline` field under `COPY.signal.gigArchive`.

**Requirements:** R4

**Dependencies:** None

**Files:**
- Modify: `lib/copy.ts`

**Approach:**
- Add `tagline: '20 years of live music, photographed.'` to the existing `COPY.signal.gigArchive` object
- Do not modify or repurpose `description` (`'Live shows, documented.'`) — it is used by the `/music` landing page card
- Check current structure before editing; `label`, `heading`, and `description` must remain unchanged

**Patterns to follow:**
- Existing fields in `COPY.signal.gigArchive` — same format, same level of nesting

**Test scenarios:**
- Happy path: `COPY.signal.gigArchive.tagline` equals `'20 years of live music, photographed.'`
- Edge case: `COPY.signal.gigArchive.description` is unchanged — the `/music` landing page card still renders `'Live shows, documented.'`

**Verification:**
- TypeScript compiles without errors; `COPY.signal.gigArchive.tagline` is accessible and correct

---

### U3. GigPolaroidWall client component

**Goal:** Create `components/GigPolaroidWall.tsx` — the polaroid card grid.

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `components/GigPolaroidWall.tsx`

**Approach:**
- `'use client'` directive as first line
- Accepts `photos: string[]` prop (base URLs from `GIG_PHOTOS`)
- Layout: `columns-2 md:columns-3 lg:columns-4` container with `gap-6`; each card uses `break-inside-avoid mb-6`
- Card structure: `relative` wrapper (required for `.tape-effect`) → polaroid div with `bg-white shadow-md p-2 pb-8` (no border radius, per site convention) → `<img>` with `object-cover` square dimensions using `thumbUrl()` + `grayscale hover:grayscale-0 transition-all duration-500`
- Rotation: inline `style={{ transform: \`rotate(\${ROTATIONS[index % 7]}deg)\` }}` where `ROTATIONS = [-3, -2, -1, 0, 1, 2, 3]`; hover classes `hover:rotate-0 hover:scale-105 hover:z-10 transition-all duration-300` on the card div
- Effects: `tape-effect` class added to card when `index % 4 === 0`; `scan-line` class added to image when `index % 7 === 3`
- Click: wraps card in `<a href={fullUrl(base)} target="_blank" rel="noopener" className="cursor-pointer">`
- `dark:bg-[#f0ece4]` on card for dark mode contrast against `--paper` background

**Patterns to follow:**
- `'use client'` structure from any existing client component in `components/`
- `.tape-effect` and `.scan-line` usage pattern in `app/globals.css` (check pseudo-element requirements)

**Test scenarios:**
- Happy path: given 8 photos, renders 8 card elements in the DOM
- Happy path: card at index 0 has `.tape-effect` class; card at index 4 also has `.tape-effect`; card at index 1 does not
- Happy path: image at index 3 has `.scan-line` class; image at index 0 does not
- Happy path: clicking a card opens `fullUrl(base)` (not `thumbUrl`) in a new tab
- Edge case: `photos = []` renders an empty container without crashing
- Visual: cards show correct rotation (index 0 = -3deg, index 1 = -2deg, …, index 6 = 3deg, index 7 = -3deg again)
- Visual: grayscale filter on images lifts to colour on hover
- Visual: polaroid strip (bottom padding) is visible and proportional

**Verification:**
- Component renders without TypeScript or console errors
- Visual QA at `/music/gig-archive` confirms polaroid layout, rotation, effects, and hover behaviour

---

### U4. Replace gig archive page

**Goal:** Replace `app/music/gig-archive/page.tsx` with a Server Component that renders the page header, `GigPolaroidWall`, stats strip, and back link.

**Requirements:** R3

**Dependencies:** U1, U2, U3

**Files:**
- Modify: `app/music/gig-archive/page.tsx`

**Approach:**
- Server Component (no `'use client'`)
- Import `GIG_PHOTOS` from `lib/gig-photos.ts` and `COPY` from `lib/copy.ts`
- Import `GigPolaroidWall` from `components/GigPolaroidWall.tsx`; pass `photos={GIG_PHOTOS}`
- Page width: `max-w-7xl mx-auto px-4` (wider than standard `max-w-3xl` — wall needs room)
- Header section follows `app/music/page.tsx` pattern:
  - Eyebrow: `THE SIGNAL / GIG ARCHIVE`
  - ACTIVE stamp (`.stamp-red` or `.stamp-green`)
  - Heading: `GIG ARCHIVE` (large, uppercase)
  - Red divider: `h-1 w-24 bg-primary`
  - Tagline from `COPY.signal.gigArchive.tagline`
- Stats strip below the wall: `font-mono text-xs uppercase tracking-widest opacity-50` — `2006 – 2026 · ARNAV'S LIVE MUSIC`
- Back link: `← Back to The Signal` linking to `/music`
- Do NOT render `<GigArchive>` — the old component is preserved but not used in this page

**Patterns to follow:**
- `app/music/page.tsx` for header and eyebrow structure
- `app/writing/[slug]/page.tsx` for back-link style reference (floating pill), though a simpler inline link is fine here

**Test scenarios:**
- Happy path: page renders at `/music/gig-archive` with heading `GIG ARCHIVE` and tagline `20 years of live music, photographed.`
- Happy path: `GigPolaroidWall` is mounted and visible with photo cards
- Happy path: back link `← Back to The Signal` navigates to `/music`
- Happy path: stats strip contains `2006 – 2026 · ARNAV'S LIVE MUSIC`
- Edge case: `GIG_PHOTOS` array is empty — page renders header and stats strip without crashing; wall section is blank
- Visual: page header style (eyebrow, heading, divider, tagline) matches the music section aesthetic

**Verification:**
- `next build` completes without type errors or build failures
- `/music/gig-archive` renders correctly in dev and production; no console errors

---

## System-Wide Impact

- **Unchanged invariants:** `GigArchive.tsx`, `GigLightbox.tsx`, `content/gig-archive.json`, `scripts/sync-gig-photos.ts`, and `next.config.ts` are not modified. The Cloudinary-backed upgrade path is preserved.
- **`lib/copy.ts` change:** Adding `tagline` to `COPY.signal.gigArchive` is additive and does not affect existing consumers (`/music` landing uses `description`, not `tagline`).
- **`lib/gig-photos.ts` is a new leaf module** — no existing code imports it; no circular dependency risk.
- **`GigPolaroidWall` is a new `'use client'` component** — it does not affect the Server Component hydration boundary of `page.tsx`.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-06-01-gig-archive-google-photos-embed.md](docs/brainstorms/2026-06-01-gig-archive-google-photos-embed.md)
- Related: `app/music/page.tsx`, `lib/copy.ts`, `components/GigArchive.tsx` (do not touch)
- Related plan: `docs/plans/2026-05-28-001-feat-gig-archive-sync-and-workflow-plan.md` (Cloudinary sync path, preserved for future)
