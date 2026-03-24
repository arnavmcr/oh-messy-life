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

The external app (`arnav-music-library.vercel.app`) was built with `<base href="/music/">`. Moving the proxy to `/music/library/:path*` would break all asset resolution without rebuilding the external app. No change is needed: in Next.js App Router, `afterFiles` rewrites (the default) run after the filesystem check, so `app/music/page.tsx` is served at `/music` before the rewrite is evaluated. This can be verified in `node_modules/next/dist/docs/`. All other `/music/*` paths continue proxying to the external app unchanged.

### External app route map (via proxy)

- `/music/index.html` → external app master index (the "enter library" entry point)
- `/music/band-practice`, `/music/blue-frog`, `/music/dive-bar`, etc. — 8 individual crate pages

---

## Nav Changes (`components/Nav.tsx`)

Remove SIGNAL from the `comingSoon` array entirely (affects both desktop and mobile rendering). Add a new dropdown section for SIGNAL, mirroring the WRITING dropdown pattern exactly.

**Desktop dropdown — implementation pattern:**

The outer wrapper `<div>` carries `onMouseEnter`/`onMouseLeave` handlers, identical to the WRITING pattern. State vars: `signalDropdownOpen` / `setSignalDropdownOpen` (boolean) and `signalCloseTimer` (a second `useRef<ReturnType<typeof setTimeout> | null>`). The 150ms close delay uses the same pattern as `closeTimer`.

- The SIGNAL label itself is `<Link href="/music">SIGNAL</Link>` — same as WRITING which uses `<Link href="/writing">` as the label
- No active/highlight state — the nav does not currently implement active link detection; SIGNAL follows the same pattern
- Dropdown panel appears when `signalDropdownOpen` is true, same positioning as WRITING dropdown

**Dropdown items:**
- **LIBRARY** → `<a href="/music/index.html">` (use `<a>` not `<Link>` — this is a proxied external route; Next.js prefetching on a rewrite target can cause spurious 404s in prefetch requests). Styles: `border-l-2 border-tertiary`, `hover:text-tertiary hover:bg-tertiary/5 transition-colors`, `font-mono text-[10px] tracking-widest uppercase font-bold`
- **GIG ARCHIVE** → `<span className="opacity-30 cursor-not-allowed pointer-events-none">`, no href, same font classes
- **T-SHIRT ARCHIVE** → `<span className="opacity-30 cursor-not-allowed pointer-events-none">`, no href, same font classes

**Mobile nav:**
- SIGNAL appears after RECORD as a simple top-level `<Link href="/music">` — no dropdown
- Order in mobile nav: WRITING toggle → RECORD → SIGNAL
- Same font/style classes as the RECORD mobile link

---

## Landing Page (`app/music/page.tsx`)

**Route:** `/music`
**Codename:** THE SIGNAL
**Component type:** Server Component (no `'use client'`)
**Static generation:** No `generateStaticParams` needed (no dynamic segments). No `export const dynamic` override needed — static is the default.

### Metadata

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music — Oh Messy Life',
  description: 'THE SIGNAL. Crate digging, gigs, and everything in between.',
};
```

### Layout

Single centered column (`max-w-3xl mx-auto px-8 py-16`), consistent with THE MANUSCRIPT.

### Structure (top to bottom)

1. **Metadata strip**
   - Codename label: `THE SIGNAL` — `font-mono text-[10px] uppercase tracking-widest opacity-50`
   - Status badge: `ACTIVE` — `.stamp-green` effect class

2. **Header block**
   - Large uppercase title: `MUSIC` — `font-headline text-5xl font-black uppercase`
   - Red divider: `h-1 w-24 bg-primary my-4`
   - Italic editorial tagline: `"Crate digging, live shows, and everything in between."` — `font-body italic opacity-70` (placeholder — user will rewrite)

3. **Section cards** — `grid grid-cols-1 md:grid-cols-3 gap-4 mt-12`

   Each card contains:
   - Codename label: `font-mono text-[9px] uppercase tracking-widest opacity-50`
   - Section name: `font-headline uppercase text-lg font-black mt-1`
   - Description: `font-body text-sm opacity-70 mt-1`
   - Status badge at bottom

   **LIBRARY** card:
   - `<a href="/music/index.html">` wrapper
   - Full opacity, `border border-black/10 dark:border-white/10 p-4 block`
   - `hover:border-tertiary hover:text-tertiary transition-colors`
   - Codename: `THE LIBRARY` | Name: `LIBRARY` | Description: `"The crate. 8 records, hand-picked."` | Status: `.stamp-green` "ACTIVE"

   **GIG ARCHIVE** card:
   - `<div>` wrapper (not a link), `aria-disabled="true"`
   - `opacity-40 cursor-not-allowed pointer-events-none`
   - `border border-black/10 dark:border-white/10 p-4`
   - Codename: `THE GIG ARCHIVE` | Name: `GIG ARCHIVE` | Description: `"Live shows, documented."` | Status: `.stamp-red` "COMING SOON"

   **T-SHIRT ARCHIVE** card:
   - `<div>` wrapper (not a link), `aria-disabled="true"`
   - `opacity-40 cursor-not-allowed pointer-events-none`
   - `border border-black/10 dark:border-white/10 p-4`
   - Codename: `THE T-SHIRT ARCHIVE` | Name: `T-SHIRT ARCHIVE` | Description: `"Every shirt, every tour."` | Status: `.stamp-red` "COMING SOON"

### Styling constraints (from CLAUDE.md)

- No hardcoded colors — use design tokens only
- No border radius except `rounded-full`
- Font classes: `font-headline`, `font-body`, `font-mono`/`font-label`
- `.stamp-green` for active/positive states; `.stamp-red` for unavailable/coming-soon states
- De-emphasised text uses `opacity-50` (consistent with rest of codebase)

---

## Out of Scope (this milestone)

- Full UI overhaul of THE SIGNAL landing (deferred)
- Moving the library proxy to `/music/library` (requires rebuilding external app with new base href)
- Gig Archive implementation (`app/music/gig-archive/page.tsx`)
- T-shirt Archive implementation (`app/music/tshirt-archive/page.tsx`)
- Mobile dropdown for SIGNAL (deferred — mobile gets a simple link for now)
