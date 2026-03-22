# Medium Archive Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import 4 Medium archive markdown files into `content/writing/` as MDX, downloading all content images to `public/images/` for self-hosting, and adding 3 new top-level categories.

**Architecture:** A single script `scripts/import-medium.ts` parses each file — extracting title/date from inline content, stripping Medium boilerplate, downloading `miro.medium.com` images to disk and rewriting URLs, then writing `.mdx` files with proper frontmatter. Three new categories (`projects`, `mba`, `essays`) are added to `lib/categories.ts` first.

**Tech Stack:** Node.js (built-in `https`/`fs`), TypeScript via `tsx`, `gray-matter` (frontmatter output only), same conventions as `scripts/import-wp.ts`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `lib/categories.ts` | Add `projects`, `mba`, `essays` top-level entries |
| Create | `scripts/import-medium.ts` | Full import script: parse, strip, download, write |

---

## Task 1: Add new categories to lib/categories.ts

**Files:**
- Modify: `lib/categories.ts`

- [ ] **Step 1: Read the current file**

Open `lib/categories.ts` and locate the `CATEGORY_MAP` export. The existing pattern is:

```ts
college: {
  label: 'College',
  accentColor: 'secondary',
  tagline: '...',
  postIts: [...],
  subcategories: { ... },
},
```

- [ ] **Step 2: Add the three new entries after `college`**

```ts
projects: {
  label: 'Projects',
  accentColor: 'primary',
  tagline: '',
  postIts: [],
  subcategories: {},
},
mba: {
  label: 'MBA',
  accentColor: 'secondary',
  tagline: '',
  postIts: [],
  subcategories: {},
},
essays: {
  label: 'Essays',
  accentColor: 'tertiary',
  tagline: '',
  postIts: [],
  subcategories: {},
},
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/categories.ts
git commit -m "feat: add projects, mba, essays categories"
```

---

## Task 2: Write parsing utilities

**Files:**
- Create: `scripts/import-medium.ts` (partial — utilities only)

These are all pure functions. Build and verify them before adding I/O.

- [ ] **Step 1: Create the file with imports and constants**

```ts
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
```

- [ ] **Step 2: Write `slugify`**

Converts a filename (without extension) to a URL-safe slug.

```ts
function slugify(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (removes dots, &, etc.)
    .trim()
    .replace(/\s+/g, '-');           // spaces → hyphens
}
```

Manual check — expected outputs:
- `"Building jhoola.world"` → `"building-jhoola-world"` ✓
- `"Roads, Escapism & GeoGuessr"` → `"roads-escapism-geoguessr"` ✓
- `"my ISB YLP interview"` → `"my-isb-ylp-interview"` ✓
- `"Building koi"` → `"building-koi"` ✓

- [ ] **Step 3: Write `parseTitle`**

The first line of every Medium export is the title in plain text (before the `===` underline).

```ts
function parseTitle(raw: string): string {
  const firstLine = raw.split('\n')[0].trim();
  return firstLine;
}
```

- [ ] **Step 4: Write `parseDate`**

The date appears as a standalone line like `Jun 26, 2020` in the boilerplate block. Scan the first 30 lines for a line that `new Date()` can parse and that looks like a month-name date.

```ts
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
```

- [ ] **Step 5: Write `stripBoilerplate`**

Removes everything from the top of the file up to and including the Medium header block, leaving only the article body. The boilerplate ends at the last occurrence of `Share` or `Listen` in the opening block. Strategy: find the line index of the last boilerplate marker, then take everything after it.

```ts
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
```

- [ ] **Step 6: Write `extractExcerpt`**

Identical logic to `import-wp.ts` — first real paragraph, stripped of markdown, max 200 chars.

```ts
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
```

- [ ] **Step 7: Write YAML serializer helper**

Reused from `import-wp.ts` pattern — serialize frontmatter without gray-matter stringify quirks.

```ts
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
```

---

## Task 3: Write image download function

**Files:**
- Modify: `scripts/import-medium.ts` (add image functions)

- [ ] **Step 1: Write `deriveImageFilename`**

Extracts a safe local filename from a miro.medium.com URL.

```ts
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
```

- [ ] **Step 2: Write `downloadFile`**

Downloads a single URL to a destination path. Returns `true` on success, `false` on failure.

```ts
function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = protocol.get(url, (res) => {
      // Follow one redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        if (res.headers.location) {
          downloadFile(res.headers.location, destPath).then(resolve);
        } else {
          resolve(false);
        }
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        resolve(false);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    });

    req.on('error', () => { file.close(); resolve(false); });
    file.on('error', () => { file.close(); resolve(false); });
  });
}
```

- [ ] **Step 3: Write `processImages`**

Finds all miro.medium.com image URLs in content (excluding the author avatar), downloads each, rewrites URLs.

```ts
async function processImages(content: string, slug: string): Promise<string> {
  const destDir = path.join(IMG_PUBLIC, slug);
  fs.mkdirSync(destDir, { recursive: true });

  // Match all miro.medium.com image URLs
  const imgRegex = /https:\/\/miro\.medium\.com\/[^\s)\"']+/g;
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
```

---

## Task 4: Write processFile and main

**Files:**
- Modify: `scripts/import-medium.ts` (add processFile + main)

- [ ] **Step 1: Write `processFile`**

Orchestrates parse → strip → download images → build frontmatter → write MDX.

```ts
async function processFile(filepath: string): Promise<void> {
  const filename = path.basename(filepath, '.md');
  const slug = slugify(filename);
  const category = CATEGORY_MAP[slug];

  if (!category) {
    console.log(`[SKIP] ${slug} — no category mapping`);
    return;
  }

  const raw = fs.readFileSync(filepath, 'utf-8');

  const title = parseTitle(raw);
  const date = parseDate(raw);
  const body = stripBoilerplate(raw);
  const bodyWithLocalImages = await processImages(body, slug);
  const excerpt = extractExcerpt(bodyWithLocalImages);

  const frontmatter = serializeFrontmatter({
    title,
    date,
    category,
    tags: [],
    ...(excerpt ? { excerpt } : {}),
    status: 'published',
  });

  const outPath = path.join(OUT_DIR, `${slug}.mdx`);
  fs.writeFileSync(outPath, `${frontmatter}\n${bodyWithLocalImages}`, 'utf-8');
  console.log(`[OK] ${slug} → ${category}`);
}
```

- [ ] **Step 2: Write `main`**

```ts
async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(IMG_PUBLIC, { recursive: true });

  const files = fs.readdirSync(MEDIUM_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(MEDIUM_DIR, f));

  for (const filepath of files) {
    await processFile(filepath);
  }

  console.log('\nDone.');
}

main().catch(console.error);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

---

## Task 5: Run and verify

- [ ] **Step 1: Run the script**

```bash
npx tsx scripts/import-medium.ts
```

Expected output:
```
[OK] building-jhoola-world → projects
[OK] building-koi → projects
[OK] my-isb-ylp-interview → mba
[OK] roads-escapism-geoguessr → essays

Done.
```

Any `[WARN]` lines for failed image downloads are acceptable — verify the remote URL still loads in a browser.

- [ ] **Step 2: Check the output MDX files**

Open each file in `content/writing/` and verify:
- Frontmatter has correct `title`, `date`, `category`, `status: "published"`
- No Medium boilerplate in the body (no "nameless link", no "Listen", no "Share")
- Image URLs are rewritten to `/images/<slug>/...` (not miro.medium.com)
- `excerpt` is a real sentence from the article, not boilerplate

Files to check:
- `content/writing/building-jhoola-world.mdx`
- `content/writing/building-koi.mdx`
- `content/writing/roads-escapism-geoguessr.mdx`
- `content/writing/my-isb-ylp-interview.mdx`

- [ ] **Step 3: Check downloaded images**

```bash
ls public/images/building-jhoola-world/
ls public/images/building-koi/
ls public/images/roads-escapism-geoguessr/
```

Expect image files (`.png`, `.jpg`, or `.webp`) in each directory.

- [ ] **Step 4: Spot-check in the dev server**

```bash
npm run dev
```

Navigate to `/writing` and confirm the 4 new posts appear. Open one post and confirm images load.

- [ ] **Step 5: Commit**

```bash
git add scripts/import-medium.ts content/writing/building-jhoola-world.mdx content/writing/building-koi.mdx content/writing/roads-escapism-geoguessr.mdx content/writing/my-isb-ylp-interview.mdx public/images/building-jhoola-world/ public/images/building-koi/ public/images/roads-escapism-geoguessr/ public/images/my-isb-ylp-interview/
git commit -m "feat: import Medium archive (4 posts, images self-hosted)"
```
