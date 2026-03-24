# THE SIGNAL — Music Section Design Spec

**Date:** 2026-03-24
**Milestone:** 3.0 — Nav + Landing (Phase 3)
**Status:** Approved

---

## Overview

Promote the SIGNAL music section from a `comingSoon` stub to a real, navigable section of the site. Deliver a barebones-but-correct landing page and nav integration. Full UI overhaul is deferred to a later milestone.

---

## Architecture

### What changes

| File | Change |
|---|---|
| `components/Nav.tsx` | Promote SIGNAL from `comingSoon[]` to real nav link with dropdown |
| `app/music/page.tsx` | New. THE SIGNAL landing page (Server Component) |

### What does NOT change

- `next.config.ts` — rewrite stays exactly as-is: `source: "/music/:path*"` → `arnav-music-library.vercel.app/:path*`

### Why no rewrite change

The external app (`arnav-music-library.vercel.app`) was built with `<base href="/music/">`. Moving the proxy to `/music/library/:path*` would break all asset resolution without rebuilding the external app. No change is needed: Next.js serves `app/music/page.tsx` at `/music` because page files take priority over `afterFiles` rewrites. All other `/music/*` paths continue proxying to the external app unchanged.

### External app route map (via proxy)

- `/music/index.html` → external app master index (the "enter library" entry point)
- `/music/band-practice`, `/music/blue-frog`, `/music/dive-bar`, etc. — 8 individual crate pages

---

## Nav Changes (`components/Nav.tsx`)

Remove SIGNAL from the `comingSoon` array. Add a new dropdown section for SIGNAL, mirroring the WRITING dropdown pattern.

**Desktop dropdown:**
- Triggered by hover, using independent `useState` + `useRef` close timer (same 150ms delay pattern as WRITING — no new abstraction)
- SIGNAL label links to `/music` (landing page)
- Dropdown items:
  - **LIBRARY** → `/music/index.html` — active `Link`, `border-l-2 border-tertiary`, `hover:text-tertiary`
  - **GIG ARCHIVE** → greyed stub, `opacity-30 cursor-not-allowed`, no href
  - **T-SHIRT ARCHIVE** → greyed stub, `opacity-30 cursor-not-allowed`, no href

**Mobile nav:**
- Add SIGNAL as a top-level link (no dropdown on mobile — same treatment as RECORD)
- Links to `/music`

---

## Landing Page (`app/music/page.tsx`)

**Route:** `/music`
**Codename:** THE SIGNAL
**Component type:** Server Component (no `'use client'`)

### Layout

Single centered column (`max-w-3xl mx-auto px-8`), consistent with THE MANUSCRIPT.

### Structure (top to bottom)

1. **Metadata strip**
   - Codename label: `THE SIGNAL` (muted, mono, small caps)
   - Status badge: `ACTIVE` (same `.stamp-green` effect class)

2. **Header block**
   - Large uppercase title: `MUSIC`
   - Red divider: `h-1 w-24 bg-primary`
   - Italic editorial tagline (placeholder copy — user will rewrite)

3. **Section cards** — 3 cards in a row on desktop (`grid grid-cols-1 md:grid-cols-3 gap-4`), stacked on mobile
   - Each card: codename label, section name, one-line description, status indicator
   - **LIBRARY** card: `<Link href="/music/index.html">`, full opacity, hover accent tertiary
   - **GIG ARCHIVE** card: `<div>` (not a link), `opacity-40`, `.stamp-green` "COMING SOON"
   - **T-SHIRT ARCHIVE** card: `<div>` (not a link), `opacity-40`, `.stamp-green` "COMING SOON"

### Styling constraints (from CLAUDE.md)

- No hardcoded colors — use design tokens only
- No border radius except `rounded-full`
- Font classes: `font-headline`, `font-body`, `font-mono`/`font-label`
- Effect classes: `.stamp-green` for COMING SOON badges

---

## Out of Scope (this milestone)

- Full UI overhaul of THE SIGNAL landing (deferred)
- Moving the library proxy to `/music/library` (requires rebuilding external app with new base href)
- Gig Archive implementation (`app/music/gig-archive/page.tsx`)
- T-shirt Archive implementation (`app/music/tshirt-archive/page.tsx`)
- Mobile dropdown for SIGNAL (deferred — mobile gets a simple link for now)
