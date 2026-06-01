// Sync script: local folder → Cloudinary → content/gig-archive.json
// Run: node_modules/.bin/tsx scripts/sync-gig-photos.ts
//
// Workflow:
//   1. Download your Google Photos album (select all → Download → unzip)
//   2. Drop the image files into ./gig-photos-incoming/
//   3. Run this script — new photos are uploaded to Cloudinary and the manifest is updated
//   4. Commit content/gig-archive.json and push
//
// Idempotent — photos already in the manifest (matched by filename) are skipped.
// Processed files are moved to ./gig-photos-processed/ after a successful upload.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import { parseGigTitle } from '../lib/gig-utils';
import type { GigPhoto } from '../lib/types';

const MANIFEST_PATH = path.join(process.cwd(), 'content', 'gig-archive.json');
const INCOMING_DIR = path.join(process.cwd(), 'gig-photos-incoming');
const PROCESSED_DIR = path.join(process.cwd(), 'gig-photos-processed');
const SKIPPED_DIR = path.join(process.cwd(), 'gig-videos-skipped');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp']);

const missing = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
  .filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`[ERROR] Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function loadManifest(): GigPhoto[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as GigPhoto[];
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  if (!fs.existsSync(INCOMING_DIR)) {
    console.error(`[ERROR] Incoming folder not found: ${INCOMING_DIR}`);
    console.error('        Create it and drop your downloaded Google Photos into it.');
    process.exit(1);
  }

  ensureDir(PROCESSED_DIR);
  ensureDir(SKIPPED_DIR);

  const manifest = loadManifest();
  const existingFiles = new Set(manifest.map((p) => p.sourceFile));

  console.log(`[INFO] Loaded manifest: ${manifest.length} existing photos`);

  // Move non-image files (videos, Live Photo motion files) out of incoming immediately
  const allIncoming = fs.readdirSync(INCOMING_DIR).filter((f) => !f.startsWith('.'));
  const skipped = allIncoming.filter((f) => !IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
  for (const f of skipped) {
    fs.renameSync(path.join(INCOMING_DIR, f), path.join(SKIPPED_DIR, f));
  }
  if (skipped.length > 0) {
    console.log(`[SKIP] ${skipped.length} non-image files moved to gig-videos-skipped/`);
  }

  const allFiles = allIncoming.filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));

  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

  const newFiles = allFiles.filter((f) => !existingFiles.has(f)).slice(0, limit);

  console.log(`[INFO] Incoming folder: ${allFiles.length} images, ${newFiles.length} new${isFinite(limit) ? ` (limited to ${limit})` : ''}`);

  if (newFiles.length === 0) {
    console.log('[INFO] Nothing to sync — all photos already in manifest');
    return;
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // Cloudinary free plan hard limit

  for (const filename of newFiles) {
    const filePath = path.join(INCOMING_DIR, filename);
    const title = path.basename(filename, path.extname(filename));
    const parsed = parseGigTitle(title);
    const folder = `gig-archive/${parsed.year ?? 'unknown'}`;

    const fileSizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
    if (fs.statSync(filePath).size > MAX_FILE_SIZE) {
      console.log(`[SKIP] "${filename}" — too large (${fileSizeMB}MB, Cloudinary free plan max is 10MB)`);
      continue;
    }

    let cloudinaryId: string;
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
        use_filename: false,
        timeout: 120000,
      });
      cloudinaryId = result.public_id;
    } catch (err) {
      console.error(`[ERROR] Failed to upload "${filename}":`, err);
      continue;
    }

    const photo: GigPhoto = {
      id: cloudinaryId,
      sourceFile: filename,
      thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_600,c_fill,f_auto,q_auto/${cloudinaryId}`,
      fullUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_1600,f_auto,q_auto/${cloudinaryId}`,
      band: parsed.band,
      event: parsed.event,
      city: parsed.city,
      month: parsed.month,
      year: parsed.year,
      title,
    };

    manifest.push(photo);

    // Write manifest after each upload so a crash/kill doesn't orphan successful uploads
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    // Move to processed — keeps incoming clean and makes idempotency robust
    fs.renameSync(filePath, path.join(PROCESSED_DIR, filename));

    if (parsed.band) {
      console.log(`[OK] ${title}`);
    } else {
      console.log(`[WARN] unparseable title — synced with null metadata: "${title}"`);
    }
  }

  console.log(`[OK] Manifest updated — total: ${manifest.length} photos`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
