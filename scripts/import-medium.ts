import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const PROJECT_ROOT = path.join(__dirname, '..');
const MEDIUM_DIR = path.join(PROJECT_ROOT, 'Medium archive');
const OUT_DIR = path.join(PROJECT_ROOT, 'content', 'writing');
const IMG_PUBLIC = path.join(PROJECT_ROOT, 'public', 'images');

// Hardcoded category map by slug
const CATEGORY_MAP: Record<string, string> = {
  'building-jhoola-world': 'projects',
  'building-koi': 'projects',
  'roads-escapism-geoguessr': 'essays',
  'my-isb-ylp-interview': 'mba',
};

function slugify(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (removes dots, &, etc.)
    .trim()
    .replace(/\s+/g, '-');           // spaces → hyphens
}

function parseTitle(raw: string): string {
  const firstLine = raw.trim().split('\n')[0].trim();
  return firstLine;
}

function parseDate(raw: string): string {
  const lines = raw.split('\n').slice(0, 30);
  const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}$/i;
  for (const line of lines) {
    const trimmed = line.trim();
    if (monthPattern.test(trimmed)) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    }
  }
  console.warn('[WARN] could not parse date, defaulting to 2020-01-01');
  return '2020-01-01';
}

function stripBoilerplate(raw: string): string {
  const lines = raw.split('\n');

  // Find the end of the boilerplate block.
  // The block contains: title, ===, author avatar, author link, read time,
  // ·, date, nameless link x2, Listen, Share — all within the first ~25 lines.
  // We look for the last occurrence of 'Share' or 'Listen' within first 30 lines.
  let boilerplateEndIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const t = lines[i].trim();
    if (t === 'Share' || t === 'Listen') {
      boilerplateEndIdx = i;
    }
  }

  if (boilerplateEndIdx === -1) {
    // No boilerplate found — return as-is minus the title line
    return lines.slice(2).join('\n').trim();
  }

  // Return everything after the boilerplate block
  return lines.slice(boilerplateEndIdx + 1).join('\n').trim();
}

function extractExcerpt(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    if (
      line.trim().startsWith('>') ||
      line.trim().startsWith('#') ||
      line.trim().startsWith('!') ||
      line.trim().startsWith('<!--') ||
      line.trim().startsWith('---') ||
      line.trim() === ''
    ) continue;
    const stripped = line
      .replace(/\*\*|__|\*|_/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (stripped.length > 20) {
      return stripped.slice(0, 200);
    }
  }
  return '';
}

function serializeFrontmatter(fm: Record<string, unknown>): string {
  const lines = Object.entries(fm).map(([k, v]) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return `${k}: []`;
      return `${k}:\n${v.map((item) => `  - "${item}"`).join('\n')}`;
    }
    if (typeof v === 'string') return `${k}: ${JSON.stringify(v)}`;
    return `${k}: ${v}`;
  });
  return `---\n${lines.join('\n')}\n---`;
}

function deriveImageFilename(url: string): string {
  // Last path segment, e.g. "1*JKxIDVuZowg2ilLHGLSLRw.png" or "0*5Up-i-1n5tSrN7mA"
  const segment = url.split('/').pop() ?? 'image';
  // Sanitize: replace * with nothing, keep alphanumeric/dot/hyphen
  const sanitized = segment.replace(/\*/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
  // If no extension, infer from URL: format:webp → .webp, else .jpg
  if (!sanitized.includes('.')) {
    const ext = url.includes('format:webp') ? '.webp' : '.jpg';
    return sanitized + ext;
  }
  return sanitized;
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = protocol.get(url, (res) => {
      // Follow one redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(destPath); } catch { /* ignore */ }
        if (res.headers.location) {
          downloadFile(res.headers.location, destPath).then(resolve);
        } else {
          resolve(false);
        }
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch { /* ignore */ }
        resolve(false);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(destPath); } catch { /* ignore */ }
      resolve(false);
    });

    req.on('error', () => { req.destroy(); file.close(); resolve(false); });
    file.on('error', () => { file.close(); resolve(false); });
  });
}

async function processImages(content: string, slug: string): Promise<string> {
  const destDir = path.join(IMG_PUBLIC, slug);
  fs.mkdirSync(destDir, { recursive: true });

  // Match all miro.medium.com image URLs
  const imgRegex = /https:\/\/miro\.medium\.com\/[^\s)"']+/g;
  const urls = [...new Set(content.match(imgRegex) ?? [])];

  // Filter out author avatar (the 64x64 profile picture)
  const contentUrls = urls.filter((u) => !u.includes('resize:fill:64:64'));

  for (const url of contentUrls) {
    const filename = deriveImageFilename(url);
    const destPath = path.join(destDir, filename);
    const localPath = `/images/${slug}/${filename}`;

    if (fs.existsSync(destPath)) {
      // Already downloaded (idempotent re-runs)
      content = content.split(url).join(localPath);
      continue;
    }

    const ok = await downloadFile(url, destPath);
    if (ok) {
      content = content.split(url).join(localPath);
    } else {
      console.warn(`  [WARN] could not download: ${url}`);
    }
  }

  return content;
}
