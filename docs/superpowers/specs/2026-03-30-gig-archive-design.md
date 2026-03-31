# Gig Archive — Design Spec
**Date:** 2026-03-30
**Route:** `/music/gig-archive`
**Codename:** THE SIGNAL › Gig Archive (Milestone 3a)

---

## Overview

A photo gallery displaying ~350 gig photos sourced from a single Google Photos album. Photos are synced to Cloudinary via a local script and metadata is stored in a static JSON manifest. The page is a statically generated Next.js Server Component with a client-side filter + lightbox component.

---

## Types

Create `lib/types.ts` (this file does not currently exist):

```ts
export interface GigPhoto {
  id: string;             // Cloudinary public ID (also used as stable unique key)
  googlePhotoId: string;  // Google Photos mediaItem.id — used by sync script for diffing, not exposed in UI
  thumbnailUrl: string;
  fullUrl: string;
  band: string | null;
  event: string | null;
  city: string | null;
  month: string | null;   // e.g. "November"
  year: number | null;
  title: string;          // raw original title, always present
}
```

---

## Data Layer

### Manifest: `content/gig-archive.json`

Array of `GigPhoto` objects, one per gig photo:

```json
[
  {
    "id": "gig-archive/2024/abc123",
    "googlePhotoId": "ABC123xyz",
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

The `googlePhotoId` field stores the Google Photos `mediaItem.id` and is used solely for diffing during sync — it is not exposed in the UI.

**Title parsing rule:** Split on `", "` → `[band, event, city, monthYear]`. Split `monthYear` on `" "` → `[month, year]`. If format doesn't match, store the raw title and leave other fields null — no photo is silently dropped.

---

## Sync Script

**File:** `scripts/sync-gig-photos.ts`
**Run:** `node_modules/.bin/tsx scripts/sync-gig-photos.ts`

### Flow
1. Load existing `content/gig-archive.json` (or start empty)
2. Authenticate with Google Photos API using a stored OAuth2 refresh token
3. Fetch all items from the configured album (`GOOGLE_ALBUM_ID`)
4. Diff: identify photos not yet in the manifest by comparing `mediaItem.id` against `googlePhotoId` values in the existing manifest
5. For each new photo:
   - Upload to Cloudinary **immediately** using the temp Google Photos `baseUrl` (these URLs expire in ~60 minutes — upload must happen in the same script run, not deferred)
   - Cloudinary folder: `gig-archive/<year>/` (year parsed from title, or "unknown" if null)
   - Parse the photo title into metadata fields
   - Append entry to manifest array including `googlePhotoId: mediaItem.id`
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
  - `totalPhotos`: full array length (includes photos with null metadata)
  - `yearRange`: `"${min}–${max}"` of all non-null `year` values; fallback `"—"` if all years are null
  - `uniqueArtists`: count of distinct non-null `band` values
  - `uniqueEvents`: count of distinct non-null `event` values
  - `uniqueCities`: count of distinct non-null `city` values
- Derives filter option lists: years descending (newest first), bands/events/cities alphabetically ascending. Null values are excluded from filter lists.
- If `content/gig-archive.json` does not exist at build time, the page renders an empty state ("No photos yet") without erroring.
- Passes all data as props to `<GigArchive />` client component

**Props passed to `<GigArchive />`:**
```ts
{
  photos: GigPhoto[];
  stats: { totalPhotos: number; yearRange: string; uniqueArtists: number; uniqueEvents: number; uniqueCities: number };
  filterOptions: { years: number[]; bands: string[]; events: string[]; cities: string[] };
}
```

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

**Empty filter state:** If the active filter combination returns zero photos, show a message — "No photos match the selected filters." — with a "Clear filters" link.

**Hover overlay null handling:** If a metadata field is null (unparseable title), omit that field from the overlay. Show only the fields that are present. If all fields are null, show the raw `title` string instead.

**`GigLightbox` is rendered inside `GigArchive`**, conditionally mounted when `lightboxIndex !== null`. It receives `filteredPhotos` (the post-filter subset), not the full `photos` prop. `lightboxIndex` is an index into `filteredPhotos`.

### `components/GigLightbox.tsx` — `'use client'`

Full-screen overlay triggered by clicking a grid photo.

**Props:**
```ts
{
  photos: GigPhoto[];        // the currently filtered photo array
  index: number;             // currently shown photo index within filtered array
  onClose: () => void;
  onNavigate: (index: number) => void;
}
```

**Layout:** Photo (3/4 width) + metadata panel (1/4 width). Prev/next arrows overlaid on the photo. Metadata panel shows: Artist, Event, City, Date (displayed as `"${month} ${year}"`, e.g. "November 2024"), Photo index (e.g. "7 / 350"). Null fields are omitted from the panel.

**Navigation:** Prev/next arrows. Keyboard: `ArrowLeft` / `ArrowRight` to navigate, `Escape` to close.

**Image:** `next/image` with `fill` inside a `relative` container sized with `aspect-video` (16:9). No blur placeholder — keep it simple; Cloudinary serves optimised images fast enough. Uses `fullUrl` from the manifest.

---

## Navigation Updates

- `components/Nav.tsx` (desktop): promote Gig Archive from greyed `<span>` stub to `<Link href="/music/gig-archive">`. Label text already comes from `COPY` — no copy change needed.
- `components/Nav.tsx` (mobile): the mobile nav links to `/music` top-level only (no dropdown). No mobile nav change needed — the Gig Archive is reachable via the `/music` landing page card.
- `app/music/page.tsx`: enable the Gig Archive card — remove `opacity-40 cursor-not-allowed pointer-events-none` and `aria-disabled`, change stamp from `stamp-red` COMING SOON to `stamp-green` ACTIVE, wrap the `<div>` in `<Link href="/music/gig-archive">`, add `hover:border-tertiary hover:text-tertiary transition-colors` to match the LIBRARY card style.

## Next.js Config

### Rewrite conflict
The existing `/music/:path*` rewrite in `next.config.ts` proxies to the external library app. Because it is returned as a flat array (afterFiles semantics in Next.js), the App Router filesystem route at `app/music/gig-archive/page.tsx` takes precedence — the rewrite only fires when no filesystem match exists. No config change is needed to resolve this conflict.

### `next/image` remote patterns
Add `res.cloudinary.com` to `remotePatterns` so `next/image` can serve Cloudinary URLs:

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'res.cloudinary.com' },
  ],
},
```

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
| `next.config.ts` | Update — add Cloudinary to remotePatterns |
| `lib/types.ts` | New or update — add `GigPhoto` interface |
| `ROADMAP.md` | Update — mark 3a in progress |
