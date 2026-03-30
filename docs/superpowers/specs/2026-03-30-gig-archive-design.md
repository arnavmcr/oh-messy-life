# Gig Archive — Design Spec
**Date:** 2026-03-30
**Route:** `/music/gig-archive`
**Codename:** THE SIGNAL › Gig Archive (Milestone 3a)

---

## Overview

A photo gallery displaying ~350 gig photos sourced from a single Google Photos album. Photos are synced to Cloudinary via a local script and metadata is stored in a static JSON manifest. The page is a statically generated Next.js Server Component with a client-side filter + lightbox component.

---

## Data Layer

### Manifest: `content/gig-archive.json`

Array of photo objects, one per gig photo:

```json
[
  {
    "id": "gig-archive/2024/abc123",
    "thumbnailUrl": "https://res.cloudinary.com/<cloud>/image/upload/w_600,h_600,c_fill,f_auto,q_auto/gig-archive/2024/abc123",
    "fullUrl": "https://res.cloudinary.com/<cloud>/image/upload/w_1600,f_auto,q_auto/gig-archive/2024/abc123",
    "band": "OX7GEN",
    "event": "Nh7 Weekender",
    "city": "Pune",
    "month": "November",
    "year": 2024,
    "title": "OX7GEN, Nh7 Weekender, Pune, November 2024"
  }
]
```

**Title parsing rule:** Split on `", "` → `[band, event, city, monthYear]`. Split `monthYear` on `" "` → `[month, year]`. If format doesn't match, store the raw title and leave other fields null — no photo is silently dropped.

---

## Sync Script

**File:** `scripts/sync-gig-photos.ts`
**Run:** `node_modules/.bin/tsx scripts/sync-gig-photos.ts`

### Flow
1. Load existing `content/gig-archive.json` (or start empty)
2. Authenticate with Google Photos API using a stored OAuth2 refresh token
3. Fetch all items from the configured album (`GOOGLE_ALBUM_ID`)
4. Diff: identify photos not yet in the manifest (by Google Photos `mediaItem.id`)
5. For each new photo:
   - Upload to Cloudinary under `gig-archive/<year>/` using the temp Google Photos URL
   - Parse the photo title into metadata fields
   - Append entry to manifest array
6. Write updated manifest back to `content/gig-archive.json`
7. Log `[OK] <title>` / `[SKIP] already synced` / `[WARN] unparseable title` per photo

**Idempotent:** Photos already in the manifest are skipped. Re-running is safe.

### Environment variables (`.env.local`, never committed)
| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token (obtained once via OAuth flow) |
| `GOOGLE_ALBUM_ID` | Google Photos album ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**Vercel env vars:** Only `CLOUDINARY_*` are needed at build time (page reads from JSON, not the API).

### One-time setup
A small one-time OAuth flow script (`scripts/get-google-token.ts`) to exchange an auth code for a refresh token. Run once locally, paste the refresh token into `.env.local`.

---

## Page: `app/music/gig-archive/page.tsx`

Server Component. At build time:
- Reads and parses `content/gig-archive.json`
- Derives stats:
  - `totalPhotos`: array length
  - `yearRange`: `"${min}–${max}"` of all `year` values
  - `uniqueArtists`: count of distinct `band` values
  - `uniqueEvents`: count of distinct `event` values
  - `uniqueCities`: count of distinct `city` values
- Derives filter option lists (sorted): years, bands, events, cities
- Passes all data as props to `<GigArchive />` client component

**Metadata:**
```ts
export const metadata: Metadata = {
  title: 'Gig Archive — THE SIGNAL',
  description: 'Photos from gigs, festivals, and shows.',
};
```

---

## Components

### `components/GigArchive.tsx` — `'use client'`

Renders the full interactive page body: header, stats, filters, grid, and lightbox trigger.

**State:**
- `activeFilters: { years: number[], bands: string[], events: string[], cities: string[] }`
- `lightboxIndex: number | null`

**Filter logic:** AND across all dimensions. A photo passes if it matches every non-empty filter set. Active filters shown as removable tags below the filter bar with a "Clear all" option.

**Grid:** CSS grid, 4 columns, `gap: 3px`. Each cell: `aspect-ratio: 1`, `overflow: hidden`, `object-fit: cover`. Thumbnails rendered grayscale (`filter: grayscale(1)`), transition to colour on hover (`filter: grayscale(0)`). Hover reveals a bottom gradient overlay with band + event + city + month/year.

**Photo count:** Shown between active filter tags and the grid — "N photos".

### `components/GigLightbox.tsx` — `'use client'`

Full-screen overlay triggered by clicking a grid photo.

**Layout:** Photo (3/4 width) + metadata panel (1/4 width). Prev/next arrows overlaid on the photo. Metadata panel shows: Artist, Event, City, Date, Photo index (e.g. "7 / 350").

**Navigation:** Prev/next arrows. Keyboard: `ArrowLeft` / `ArrowRight` to navigate, `Escape` to close.

**Image:** `next/image` with `fill` inside a `relative` container. Uses `fullUrl` from the manifest.

---

## Navigation Updates

- `components/Nav.tsx`: promote Gig Archive from greyed stub to active link pointing to `/music/gig-archive`
- `app/music/page.tsx`: enable the Gig Archive card (remove `opacity-40 cursor-not-allowed pointer-events-none`, change stamp from `stamp-red` COMING SOON to `stamp-green` ACTIVE, wrap in `<Link>`)

---

## Cloudinary Configuration

- **Folder:** `gig-archive/<year>/`
- **Thumbnail transform** (grid): `w_600,h_600,c_fill,f_auto,q_auto`
- **Full transform** (lightbox): `w_1600,f_auto,q_auto`
- Transforms are applied via URL parameters at render time — no pre-generated variants needed.

---

## Styling Notes

- Follow existing design tokens: `font-mono`, `font-headline`, `font-body`, `text-primary` (red), `stamp-green`, `stamp-red`
- Stats row: `border-y` divider, `font-mono` numbers, `text-[9px] uppercase tracking-widest opacity-50` labels
- Filter chips: `border`, `font-mono text-[9px] uppercase tracking-widest`. Active: `border-primary text-primary`
- Active filter tags: same as active chips with a `×` button
- No border radius (except `rounded-full` if used)
- Lightbox overlay: fixed, full-screen, dark background, `z-50`

---

## File Summary

| File | Action |
|---|---|
| `content/gig-archive.json` | New — manifest, updated by sync script |
| `scripts/sync-gig-photos.ts` | New — Google Photos → Cloudinary sync |
| `scripts/get-google-token.ts` | New — one-time OAuth token helper |
| `app/music/gig-archive/page.tsx` | New — Server Component page |
| `components/GigArchive.tsx` | New — client component (filters + grid) |
| `components/GigLightbox.tsx` | New — client component (lightbox) |
| `components/Nav.tsx` | Update — enable Gig Archive link |
| `app/music/page.tsx` | Update — enable Gig Archive card |
| `ROADMAP.md` | Update — mark 3a in progress |
