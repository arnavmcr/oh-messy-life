import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PROJECT_ROOT = path.join(__dirname, '..');
const WP_DIR = path.join(PROJECT_ROOT, 'wp archive', 'posts');
const OUT_DIR = path.join(PROJECT_ROOT, 'content', 'writing');
const IMG_PUBLIC = path.join(PROJECT_ROOT, 'public', 'images');

// Non-ASCII directory name → ASCII slug
const NON_ASCII_SLUGS: Record<string, string> = {
  'दोस्रो': 'dastro',
  'གཅིག': 'gcig',
};

// WP catch-all categories (carry no routing signal)
const CATCH_ALLS = new Set(['writing', 'college']);

// Known subcategory-related tags to extract
const MUSIC_TAGS = new Set(['album-reviews', 'gig-reviews', 'editorials']);
const ECON_TAGS = new Set(['papers']);
const KNOWN_CATEGORIES = new Set([
  'music', 'gig-reviews', 'album-reviews', 'editorials',
  'travel', 'italy', 'meghalaya', 'sikkim', 'india', 'usa',
  'politics', 'economics', 'papers', 'sociology',
  'sports', 'society', 'film', 'events', 'experiences', 'mpower',
]);

function mapCategories(
  wpCategories: string[],
  slug: string
): { subcategory: string | undefined; tags: string[] } {
  // Strip catch-alls
  const cats = wpCategories.filter((c) => !CATCH_ALLS.has(c));

  // 1. travel (wins over film)
  if (cats.includes('travel')) {
    const locationTags = cats.filter((c) => !KNOWN_CATEGORIES.has(c) || ['italy', 'meghalaya', 'sikkim', 'india', 'usa'].includes(c));
    return { subcategory: 'travel', tags: locationTags.filter((t) => t !== 'travel') };
  }

  // 2. music or gig-reviews
  if (cats.includes('music') || cats.includes('gig-reviews')) {
    const tags = cats.filter((c) => MUSIC_TAGS.has(c));
    return { subcategory: 'music', tags };
  }

  // 3. economics or papers
  if (cats.includes('economics') || cats.includes('papers')) {
    const tags = cats.filter((c) => ECON_TAGS.has(c));
    return { subcategory: 'economics', tags };
  }

  // 4. politics
  if (cats.includes('politics')) return { subcategory: 'politics', tags: [] };

  // 5. sports
  if (cats.includes('sports')) return { subcategory: 'sports', tags: [] };

  // 6. society / sociology
  if (cats.includes('society') || cats.includes('sociology')) return { subcategory: 'society', tags: [] };

  // 7. film
  if (cats.includes('film')) return { subcategory: 'film', tags: [] };

  // 8. events / experiences / mpower
  if (cats.includes('events') || cats.includes('experiences') || cats.includes('mpower')) {
    return { subcategory: 'events', tags: [] };
  }

  // Unmapped
  if (cats.length > 0) {
    console.warn(`[UNMAPPED] ${slug}: categories=[${cats.join(', ')}] → no subcategory`);
  }
  return { subcategory: undefined, tags: [] };
}

function extractExcerpt(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    // Skip blockquotes, headings, images, HTML comments, horizontal rules
    if (line.trim().startsWith('>') || line.trim().startsWith('#') ||
        line.trim().startsWith('!') || line.trim().startsWith('<!--') ||
        line.trim().startsWith('---') || line.trim() === '') continue;
    const stripped = line
      .replace(/\*\*|__|\*|_/g, '')  // strip bold/italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip links
      .replace(/_\*\*.*?\*\*_/g, '') // strip bold-italic cross patterns
      .trim();
    if (stripped.length > 20) {
      return stripped.slice(0, 200);
    }
  }
  return '';
}

function cleanContent(content: string, slug: string): string {
  return content
    // Strip <!--more-->
    .replace(/<!--more-->/g, '')
    // [youtube url] or [youtube https://...?rel=0&w=640&h=480]
    .replace(/\[youtube\s+(https?:\/\/[^\]]+)\]/g, (_, url) => {
      const cleanUrl = url.replace(/\?.*$/, '');
      return `[Watch on YouTube](${cleanUrl})`;
    })
    // [vimeo 123456 w=640 h=480] or [vimeo 123456]
    .replace(/\[vimeo\s+(\d+)[^\]]*\]/g, (_, id) => `[Watch on Vimeo](https://vimeo.com/${id})`)
    // [gallery ids="..."] or [gallery ...]
    .replace(/\[gallery[^\]]*\]/g, '_Gallery — images available below._')
    // Rewrite inline image refs: images/foo.jpg → /images/slug/foo.jpg
    .replace(/\(images\//g, `(/images/${slug}/`)
    // Also handle markdown image syntax: ![alt](images/foo)
    .replace(/!\[([^\]]*)\]\(images\//g, `![$1](/images/${slug}/`)
    // Escape < not followed by valid HTML/JSX start chars (prevents MDX parse errors e.g. "<3")
    .replace(/<(?![a-zA-Z/!>])/g, '&lt;');
}

function copyImages(wpSlug: string, outSlug: string): void {
  const srcDir = path.join(WP_DIR, wpSlug, 'images');
  if (!fs.existsSync(srcDir)) return;

  const destDir = path.join(IMG_PUBLIC, outSlug);
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of fs.readdirSync(srcDir)) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  }
}

function processPost(wpSlug: string, filePath: string, isDraft: boolean): void {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Determine output slug (transliterate if non-ASCII)
  const outSlug = NON_ASCII_SLUGS[wpSlug] ?? wpSlug;

  // Skip logic (regular posts only)
  if (!isDraft) {
    const hasCategories = Array.isArray(data.categories) && data.categories.length > 0;
    const isPlaceholder = typeof data.title === 'string' &&
      data.title.toLowerCase().includes('blog post title');

    if (!hasCategories || isPlaceholder) {
      console.log(`[SKIP] ${wpSlug}${isPlaceholder ? ' (placeholder)' : ' (no categories)'}`);
      return;
    }
  }

  // Map categories
  const wpCategories: string[] = isDraft ? [] : (data.categories ?? []);
  const { subcategory, tags } = mapCategories(wpCategories, outSlug);

  // Clean content
  const cleanedContent = cleanContent(content, outSlug);

  // Extract excerpt
  const excerpt: string = data.excerpt ?? extractExcerpt(cleanedContent);

  // Handle coverImage
  let coverImage: string | undefined;
  if (data.coverImage) {
    const filename = path.basename(String(data.coverImage));
    coverImage = `/images/${outSlug}/${filename}`;
  }

  // Copy images
  copyImages(wpSlug, outSlug);

  // Format date as YYYY-MM-DD
  const rawDate = data.date;
  let formattedDate = '2016-01-01';
  if (rawDate instanceof Date) {
    formattedDate = rawDate.toISOString().slice(0, 10);
  } else if (typeof rawDate === 'string' && rawDate.trim()) {
    formattedDate = rawDate.trim().slice(0, 10);
  }

  // Build frontmatter
  const frontmatter: Record<string, unknown> = {
    title: data.title ?? outSlug,
    date: formattedDate,
    category: 'college',
    ...(subcategory ? { subcategory } : {}),
    tags: tags.length > 0 ? tags : [],
    ...(excerpt ? { excerpt } : {}),
    ...(coverImage ? { coverImage } : {}),
    status: isDraft ? 'draft' : 'published',
  };

  // Serialize frontmatter as YAML manually (avoid gray-matter stringify quirks with dates)
  const yamlLines = Object.entries(frontmatter).map(([k, v]) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return `${k}: []`;
      return `${k}:\n${v.map((item) => `  - "${item}"`).join('\n')}`;
    }
    // Always JSON.stringify strings — guarantees valid YAML for any content
    if (typeof v === 'string') {
      return `${k}: ${JSON.stringify(v)}`;
    }
    return `${k}: ${v}`;
  });

  const output = `---\n${yamlLines.join('\n')}\n---\n${cleanedContent}`;
  const outPath = path.join(OUT_DIR, `${outSlug}.mdx`);
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`[OK] ${outSlug}${isDraft ? ' (draft)' : ''}${subcategory ? ` → college/${subcategory}` : ' → college (uncategorized)'}`);
}

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(IMG_PUBLIC, { recursive: true });

  let count = 0;
  let skipped = 0;

  // Regular posts
  const regularDirs = fs.readdirSync(WP_DIR).filter((d) => {
    if (d === '_drafts') return false;
    return fs.statSync(path.join(WP_DIR, d)).isDirectory();
  });

  for (const dir of regularDirs) {
    const filePath = path.join(WP_DIR, dir, 'index.md');
    if (!fs.existsSync(filePath)) continue;
    const before = fs.readdirSync(OUT_DIR).length;
    processPost(dir, filePath, false);
    const after = fs.readdirSync(OUT_DIR).length;
    if (after > before) count++; else skipped++;
  }

  // Draft posts
  const draftsDir = path.join(WP_DIR, '_drafts');
  if (fs.existsSync(draftsDir)) {
    const draftDirs = fs.readdirSync(draftsDir).filter((d) =>
      fs.statSync(path.join(draftsDir, d)).isDirectory()
    );
    for (const dir of draftDirs) {
      const filePath = path.join(draftsDir, dir, 'index.md');
      if (!fs.existsSync(filePath)) continue;
      processPost(dir, filePath, true);
      count++;
    }
  }

  console.log(`\nDone. ${count} posts imported, ${skipped} skipped.`);
}

main();
