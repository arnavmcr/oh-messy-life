import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import matter from 'gray-matter';

const PROJECT_ROOT = path.join(__dirname, '..');
const SUBSTACK_DIR = path.join(PROJECT_ROOT, 'Substack After EOD Archive');
const OUT_DIR = path.join(PROJECT_ROOT, 'content', 'writing');
const IMG_PUBLIC = path.join(PROJECT_ROOT, 'public', 'images');

// Strip the "firstname-lastname-" prefix — always 2 word segments
function deriveSlug(filename: string): string {
  const parts = filename.split('-');
  return parts.slice(2).join('-');
}

function parseDate(raw: string): string {
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  console.warn(`[WARN] could not parse date "${raw}", defaulting to 2020-01-01`);
  return '2020-01-01';
}

function stripH1(content: string): string {
  return content
    .split('\n')
    .filter((line, idx) => {
      // Remove the first H1 heading (duplicates the frontmatter title)
      if (line.trimStart().startsWith('# ') && idx < 5) return false;
      return true;
    })
    .join('\n')
    .trimStart();
}

function extractExcerpt(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    if (
      line.trim().startsWith('>') ||
      line.trim().startsWith('#') ||
      line.trim().startsWith('!') ||
      line.trim().startsWith('[') ||
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

function deriveSubstackImageFilename(url: string): string {
  // Substack fetch URLs encode the S3 URL as the last path segment.
  // e.g. https://substackcdn.com/image/fetch/$s_!xxx!,.../https%3A%2F%2F...%2Ffilename.gif
  // Decode that last segment to get the S3 URL, then take its last segment.
  const lastSegment = url.split('/').pop() ?? 'image';
  let filename: string;
  try {
    const decoded = decodeURIComponent(lastSegment);
    filename = decoded.split('/').pop() ?? lastSegment;
  } catch {
    filename = lastSegment;
  }
  // Sanitize: keep alphanumeric, dots, hyphens, underscores
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!filename.includes('.')) {
    filename += '.jpg';
  }
  return filename;
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

  const imgRegex = /https:\/\/substackcdn\.com\/[^\s)"']+/g;
  const urls = [...new Set(content.match(imgRegex) ?? [])];

  for (const url of urls) {
    const filename = deriveSubstackImageFilename(url);
    const destPath = path.join(destDir, filename);
    const localPath = `/images/${slug}/${filename}`;

    if (fs.existsSync(destPath)) {
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

async function processFile(filepath: string): Promise<void> {
  const filename = path.basename(filepath, '.md');
  const slug = deriveSlug(filename);

  const raw = fs.readFileSync(filepath, 'utf-8');
  const { data: fm, content: rawBody } = matter(raw);

  const title: string = fm.title ?? filename;
  const date = parseDate(String(fm.date ?? ''));
  const body = stripH1(rawBody);
  const bodyWithLocalImages = await processImages(body, slug);
  const excerpt = extractExcerpt(bodyWithLocalImages);

  const frontmatter = serializeFrontmatter({
    title,
    date,
    category: 'music',
    tags: ['after-eod'],
    ...(excerpt ? { excerpt } : {}),
    status: 'published',
  });

  const outPath = path.join(OUT_DIR, `${slug}.mdx`);
  fs.writeFileSync(outPath, `${frontmatter}\n\n${bodyWithLocalImages}`, 'utf-8');
  console.log(`[OK] ${slug} → music`);
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(IMG_PUBLIC, { recursive: true });

  const files = fs.readdirSync(SUBSTACK_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(SUBSTACK_DIR, f));

  for (const filepath of files) {
    await processFile(filepath);
  }

  console.log('\nDone.');
}

main().catch(console.error);
