---
name: gig-archive-local-sync
description: Replace broken Google Photos API ingestion with local-folder-based sync to Cloudinary
metadata:
  type: project
---

# Gig Archive — Local Folder Sync (Approach A)

**Status:** Ready for implementation
**Created:** 2026-05-29
**Replaces:** `docs/plans/2026-05-28-001-feat-gig-archive-sync-and-workflow-plan.md`

---

## Problem

The existing `scripts/sync-gig-photos.ts` uses `photoslibrary.googleapis.com/v1/mediaItems:search` — an endpoint Google deprecated and effectively killed in April 2025. The manifest (`content/gig-archive.json`) is empty and cannot be populated.

## Solution

Replace the Google Photos API call with a local folder reader. The user downloads photos from Google Photos manually (album → Download all → unzip) and drops them into `./gig-photos-incoming/`. The script scans that folder, skips already-synced photos, uploads new ones to Cloudinary, and updates the manifest. Everything downstream is unchanged.

---

## Scope

### In scope
- Rewrite `scripts/sync-gig-photos.ts` to read from `./gig-photos-incoming/` instead of Google Photos API
- Remove all Google OAuth/API code from the script and its env var requirements
- Rename `googlePhotoId` → `sourceFile` in `GigPhoto` type and manifest (dedup key is now the filename)
- Add `gig-photos-incoming/` and `gig-photos-processed/` to `.gitignore`
- Update `docs/plans/2026-05-28-001-feat-gig-archive-sync-and-workflow-plan.md` to reflect the new workflow

### Out of scope
- UI changes (GigArchive, GigLightbox — already complete and unchanged)
- Cloudinary config changes
- Naming convention changes (`Band, Event, City, Month Year` stays the same)
- Automation (GitHub Actions, cron) — manual trigger is sufficient

---

## Behavior

### Sync workflow (steady state)
1. In Google Photos, open the album → select all → Download → unzip
2. Drop photos into `./gig-photos-incoming/` (jpg, jpeg, png, heic accepted)
3. Run: `node_modules/.bin/tsx scripts/sync-gig-photos.ts`
4. Commit `content/gig-archive.json` and push — Vercel deploys

### Script logic
- Reads all image files from `./gig-photos-incoming/`
- Dedup: checks if `item.filename` already exists as `sourceFile` in the manifest → skip if so
- Parses title via existing `parseGigTitle` (strips extension, same logic)
- Uploads each new photo to Cloudinary under `gig-archive/<year>/` (unchanged)
- Appends to manifest
- **Optionally** moves processed files to `./gig-photos-processed/` (keeps incoming folder clean for next run)

### Idempotency
Running the script multiple times is safe. Dedup is by filename, so re-running with the same folder produces no changes.

### HEIC handling
Cloudinary accepts HEIC natively — no pre-conversion needed. The script passes the file path directly to Cloudinary's `upload()` with `resource_type: 'image'`.

---

## Type change

`GigPhoto.googlePhotoId: string` → `GigPhoto.sourceFile: string`

The field stores the original filename (with extension). The UI never reads this field — it exists only for deduplication during sync. The manifest field name changes; no UI code needs updating.

---

## Env vars removed
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_ALBUM_ID`

Cloudinary vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are unchanged.

---

## Success criteria
- `node_modules/.bin/tsx scripts/sync-gig-photos.ts` with photos in `./gig-photos-incoming/` populates `content/gig-archive.json` with correct entries
- Running it a second time with the same folder logs "Nothing to sync"
- `/music/gig-archive` shows the photo grid after a Vercel deploy
