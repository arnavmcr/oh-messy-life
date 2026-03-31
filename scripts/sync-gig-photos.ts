// Sync script: Google Photos album → Cloudinary → content/gig-archive.json
// Run: node_modules/.bin/tsx scripts/sync-gig-photos.ts
//
// Idempotent — photos already in the manifest are skipped.
// Google Photos baseUrls expire in ~60 min; upload happens immediately in the same run.

import 'dotenv/config';
import { google } from 'googleapis';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { parseGigTitle } from '../lib/gig-utils';
import type { GigPhoto } from '../lib/types';

const MANIFEST_PATH = path.join(process.cwd(), 'content', 'gig-archive.json');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_ALBUM_ID,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const requiredVars = [
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_ALBUM_ID', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
];
const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[ERROR] Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

async function loadManifest(): Promise<GigPhoto[]> {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as GigPhoto[];
}

async function fetchAlbumItems(auth: InstanceType<typeof google.auth.OAuth2>): Promise<Array<{ id: string; baseUrl: string; filename: string }>> {
  const items: Array<{ id: string; baseUrl: string; filename: string }> = [];
  let pageToken: string | undefined;

  do {
    const response = await fetch(
      `https://photoslibrary.googleapis.com/v1/mediaItems:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${(await auth.getAccessToken()).token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ albumId: GOOGLE_ALBUM_ID, pageSize: 100, pageToken }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Photos API error: ${response.status} ${text}`);
    }

    const data = await response.json() as {
      mediaItems?: Array<{ id: string; baseUrl: string; filename: string }>;
      nextPageToken?: string;
    };

    if (data.mediaItems) items.push(...data.mediaItems);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

async function main() {
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const manifest = await loadManifest();
  const existingIds = new Set(manifest.map((p) => p.googlePhotoId));

  console.log(`[INFO] Loaded manifest: ${manifest.length} existing photos`);

  const albumItems = await fetchAlbumItems(oauth2Client);
  console.log(`[INFO] Album contains ${albumItems.length} photos`);

  const newItems = albumItems.filter((item) => !existingIds.has(item.id));
  console.log(`[INFO] ${newItems.length} new photos to sync`);

  for (const item of newItems) {
    const title = item.filename.replace(/\.[^.]+$/, ''); // strip extension
    const parsed = parseGigTitle(title);
    const folder = `gig-archive/${parsed.year ?? 'unknown'}`;

    // Google baseUrls expire — upload immediately
    const uploadUrl = `${item.baseUrl}=d`; // =d requests full resolution download

    let cloudinaryId: string;
    try {
      const result = await cloudinary.uploader.upload(uploadUrl, { folder, resource_type: 'image' });
      cloudinaryId = result.public_id;
    } catch (err) {
      console.error(`[ERROR] Failed to upload "${title}":`, err);
      continue;
    }

    const cloud = CLOUDINARY_CLOUD_NAME;
    const photo: GigPhoto = {
      id: cloudinaryId,
      googlePhotoId: item.id,
      thumbnailUrl: `https://res.cloudinary.com/${cloud}/image/upload/w_600,h_600,c_fill,f_auto,q_auto/${cloudinaryId}`,
      fullUrl: `https://res.cloudinary.com/${cloud}/image/upload/w_1600,f_auto,q_auto/${cloudinaryId}`,
      band: parsed.band,
      event: parsed.event,
      city: parsed.city,
      month: parsed.month,
      year: parsed.year,
      title,
    };

    manifest.push(photo);

    if (parsed.band) {
      console.log(`[OK] ${title}`);
    } else {
      console.log(`[WARN] unparseable title — synced with null metadata: "${title}"`);
    }
  }

  if (newItems.length === 0) {
    console.log('[INFO] Nothing to sync — all photos already in manifest');
  } else {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`[OK] Manifest updated — total: ${manifest.length} photos`);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
