import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'Notion archive');
const OUT_DIR = path.join(PROJECT_ROOT, 'content', 'record');

// --- Filename → metadata lookup ---

interface EntryMeta {
  slug: string;
  date: string;
  issue: number;
}

// Keys are the "middle" portion of the Notion filename (between "notion-" and the UUID)
const FILENAME_MAP: Record<string, EntryMeta> = {
  'notion-December-23-':       { slug: 'december-23',                    date: '2023-12-01', issue: 1  },
  'notion-January-24-':        { slug: 'january-24',                     date: '2024-01-01', issue: 2  },
  'notion-February-24-':       { slug: 'february-24',                    date: '2024-02-01', issue: 3  },
  'notion-March-24-':          { slug: 'march-24',                       date: '2024-03-01', issue: 4  },
  'notion-April-24-':          { slug: 'april-24',                       date: '2024-04-01', issue: 5  },
  'notion-May-24-':            { slug: 'may-24',                         date: '2024-05-01', issue: 6  },
  'notion-June-July-24-':      { slug: 'june-july-24',                   date: '2024-06-01', issue: 7  },
  'notion-August-24-':         { slug: 'august-24',                      date: '2024-08-01', issue: 8  },
  'notion-September-24-':      { slug: 'september-24',                   date: '2024-09-01', issue: 9  },
  'notion-October-24-':        { slug: 'october-24',                     date: '2024-10-01', issue: 10 },
  'notion-November-24-':       { slug: 'november-24',                    date: '2024-11-01', issue: 11 },
  'notion-December-24-':       { slug: 'december-24',                    date: '2024-12-01', issue: 12 },
  'notion-January-25-':        { slug: 'january-25',                     date: '2025-01-01', issue: 13 },
  'notion-February-25-':       { slug: 'february-25',                    date: '2025-02-01', issue: 14 },
  'notion-March-25-':          { slug: 'march-25',                       date: '2025-03-01', issue: 15 },
  'notion-April-25-':          { slug: 'april-25',                       date: '2025-04-01', issue: 16 },
  'notion-May-June-25-':       { slug: 'may-june-25',                    date: '2025-05-01', issue: 17 },
  'notion-July-August-25-':    { slug: 'july-august-25',                 date: '2025-07-01', issue: 18 },
  'notion-September-25-':      { slug: 'september-25',                   date: '2025-09-01', issue: 19 },
  'notion-October-and-November-25-': { slug: 'october-november-25',      date: '2025-10-01', issue: 20 },
  'notion-December-25-January-and-February-26-': { slug: 'december-25-january-february-26', date: '2025-12-01', issue: 21 },
};

function resolveMetaFromFilename(filename: string): EntryMeta | null {
  for (const [prefix, meta] of Object.entries(FILENAME_MAP)) {
    if (filename.startsWith(prefix)) return meta;
  }
  return null;
}

// --- Content cleaning ---

function extractTitle(raw: string): string {
  // The H1 heading is the display title
  const match = raw.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return '';
}

/**
 * Detect whether a line opens a Spotify embed block.
 * Spotify embeds start with a line like:
 *   "playlist name - Arnav Sheth \| Spotify"
 * followed by [Play on Spotify](...) and then a # heading for the playlist title.
 */
function isSpotifyEmbedStart(lines: string[], i: number): boolean {
  const line = lines[i].trim();
  // The line before [Play on Spotify] is typically "PlaylistName - Author \| Spotify"
  return /\\\|\s*Spotify\s*$/.test(line);
}

/**
 * Given we're at the label line before a Spotify embed, find the end of the embed block.
 * The embed ends after the last bullet item ("- Copy link") or a Privacy Policy line,
 * and is followed by normal content.
 */
function skipSpotifyBlock(lines: string[], startIdx: number): number {
  let i = startIdx;
  // Skip until we find "Privacy Policy" line which ends the embed
  while (i < lines.length) {
    if (lines[i].includes('Privacy Policy') && lines[i].includes('spotify.com')) {
      return i + 1; // skip past the Privacy Policy line
    }
    i++;
  }
  return startIdx + 1; // fallback: skip just the label line
}

/**
 * Detect and skip Spotify playlist track listings.
 * These come after the [Play on Spotify] / Privacy Policy block and look like:
 *   01. 1
 *       ### Track Name
 *       #### Artist Name
 *       03:45
 */
function isSpotifyTrackListing(lines: string[], i: number): boolean {
  const line = lines[i].trim();
  // Numbered track: "01. 1" or "02. 2" etc
  return /^\d{2}\.\s+\d+$/.test(line);
}

/**
 * Skip the entire Spotify track listing block.
 * It ends when we hit a line that is clearly not part of a track entry
 * (not a number, not a heading inside the track, not a duration, not blank).
 */
function skipSpotifyTrackBlock(lines: string[], startIdx: number): number {
  let i = startIdx;
  // The block consists of: numbered lines, blank lines, ###/#### headings for title/artist,
  // duration strings (mm:ss), and indented content.
  // It ends when we hit a bullet list starting with "- [Play on Spotify]"
  // or a non-track-looking line after an empty line.
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // These bullet lines appear after all tracks and signal end of embed
    if (trimmed.startsWith('- [Play on Spotify]') || trimmed === '- Save on Spotify' || trimmed === '- Copy link') {
      // Skip until past the Privacy Policy line
      while (i < lines.length) {
        if (lines[i].includes('Privacy Policy') && lines[i].includes('spotify.com')) {
          return i + 1;
        }
        i++;
      }
      return i;
    }
    i++;
  }
  return i;
}

/**
 * Detect Instagram embed blocks.
 * They start with a line containing "@username on Instagram:" or
 * a line with "Instagram" followed by an image link to cdninstagram.com,
 * and contain complex nested HTML-ish markdown.
 */
function isInstagramEmbedStart(line: string): boolean {
  return (
    /^@\S+ on Instagram:/.test(line.trim()) ||
    line.includes('cdninstagram.com') ||
    (line.includes('instagram.com') && line.startsWith('[View'))
  );
}

/**
 * Skip an Instagram embed block.
 * These blocks end at the first blank line after the cluster of Instagram links.
 * We look for the pattern: after "Instagram" text link there are several image/link
 * lines, ending with lines like "Like", "Comment", "Share", etc. and then a blank line.
 */
function skipInstagramBlock(lines: string[], startIdx: number): number {
  let i = startIdx;
  // Look for end markers: "_Instagram_" link is usually near the end
  // Or we look for the "Add a comment..." line
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.includes('_Instagram_') || trimmed.startsWith('[Add a comment')) {
      // Skip to next blank line
      i++;
      while (i < lines.length && lines[i].trim() !== '') i++;
      return i;
    }
    // Safety: if we hit a `###` heading, stop
    if (trimmed.startsWith('###') || trimmed.startsWith('##')) return i;
    i++;
  }
  return i;
}

/**
 * Strip the "Links to previous months" section (#### or ### heading) and everything after it.
 * This is always the last section, so we cut from this heading to end of file.
 */
function stripLinksSection(content: string): string {
  // Match ### or #### Links to previous months (at any heading level)
  const match = content.match(/\n#{3,4}\s+Links to previous months[\s\S]*/);
  if (match) {
    return content.slice(0, match.index);
  }
  return content;
}

function cleanContent(raw: string): string {
  // 1. Strip "Links to previous months" section entirely (from ### or #### heading to EOF)
  let content = stripLinksSection(raw);

  // 2. Process line by line for embed blocks and other artifacts
  const lines = content.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // --- Skip to content link at the very top ---
    if (trimmed.startsWith('[Skip to content](') && trimmed.includes('notion.site')) {
      i++;
      continue;
    }

    // --- Strip base64 image lines (standalone) ---
    // e.g. ![](<Base64-Image-Removed>) or ![💔 Page icon](<Base64-Image-Removed>)
    if (/^!\[.*?\]\(<Base64-Image-Removed>\)/.test(trimmed)) {
      i++;
      continue;
    }

    // --- Strip Notion emoji icon lines (icon URLs from notion-emojis S3) ---
    if (trimmed.includes('notion-emojis.s3') && trimmed.startsWith('![')) {
      i++;
      continue;
    }

    // --- Strip inline Base64-Image-Removed tokens inside emoji references ---
    // e.g. ![🙂](<Base64-Image-Removed>) in the middle of text
    // We'll handle this in post-processing, not line-by-line

    // --- Spotify embed: label line ---
    // e.g. "playlist name - Arnav Sheth \| Spotify"
    if (isSpotifyEmbedStart(lines, i)) {
      // The label line itself: extract just the playlist name and a Spotify link
      // Look ahead for [Play on Spotify](url)
      let spotifyUrl = '';
      let playlistName = trimmed.replace(/\s*-\s*Arnav Sheth\s*\\\|\s*Spotify\s*$/, '').replace(/\s*\\\|\s*Spotify\s*$/, '').trim();
      // Scan next few lines for the URL
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const urlMatch = lines[j].match(/\[Play on Spotify\]\(([^)]+)\)/);
        if (urlMatch) {
          spotifyUrl = urlMatch[1].split('?')[0]; // strip query params
          break;
        }
      }
      if (spotifyUrl && playlistName) {
        output.push(`[Listen: ${playlistName}](${spotifyUrl})`);
      } else if (spotifyUrl) {
        output.push(`[Listen on Spotify](${spotifyUrl})`);
      }
      // Emit a blank line after the link so it doesn't run into the next paragraph
      output.push('');
      // Now skip past the embed block (until Privacy Policy line)
      i = skipSpotifyBlock(lines, i + 1);
      // Skip track listing if it follows immediately
      // Find the next numbered track line
      while (i < lines.length && lines[i].trim() === '') i++;
      if (i < lines.length && isSpotifyTrackListing(lines, i)) {
        i = skipSpotifyTrackBlock(lines, i);
      }
      continue;
    }

    // --- Skip [Play on Spotify] lines that weren't caught above ---
    if (trimmed.match(/^\[Play on Spotify\]/)) {
      i = skipSpotifyBlock(lines, i);
      while (i < lines.length && lines[i].trim() === '') i++;
      if (i < lines.length && isSpotifyTrackListing(lines, i)) {
        i = skipSpotifyTrackBlock(lines, i);
      }
      continue;
    }

    // --- Instagram embed blocks ---
    // Starts with "@username on Instagram:" line
    if (/^@\S+\s+on Instagram:/.test(trimmed)) {
      // Output a simple text reference
      const handleMatch = trimmed.match(/^(@\S+)/);
      if (handleMatch) {
        output.push(`_(Instagram post by ${handleMatch[1]})_`);
      }
      i = skipInstagramBlock(lines, i + 1);
      continue;
    }

    // Skip standalone Instagram embed component lines (the nested image links)
    if (
      trimmed.startsWith('[![') && trimmed.includes('cdninstagram.com') ||
      trimmed.startsWith('[View more on Instagram]') ||
      trimmed.startsWith('[View profile]') && trimmed.includes('instagram.com') ||
      trimmed.match(/^\[Like\].*instagram/) ||
      trimmed.match(/^\[_Comment_\].*instagram/) ||
      trimmed.match(/^\[_Share_\].*instagram/) ||
      trimmed.match(/^\[_Save_\].*instagram/) ||
      trimmed.match(/^\[\d+ likes?\].*instagram/) ||
      trimmed.startsWith('[Add a comment...]') ||
      (trimmed.includes('ig_embed') && trimmed.startsWith('['))
    ) {
      i++;
      continue;
    }

    // Skip "Instagram" standalone line (appears between @handle and image)
    if (trimmed === 'Instagram') {
      i++;
      continue;
    }

    // --- Skip Spotify Privacy Policy / Terms lines ---
    if (trimmed.includes('Privacy Policy') && trimmed.includes('spotify.com')) {
      i++;
      continue;
    }

    // --- Skip "Save on Spotify" / "Copy link" orphan lines ---
    if (trimmed === 'Save on Spotify' || trimmed === 'Copy link') {
      i++;
      continue;
    }

    // --- Skip "PreviewE" (Spotify embed UI artifact) ---
    if (trimmed === 'PreviewE' || trimmed === 'Preview') {
      i++;
      continue;
    }

    // --- Skip Spotify track listing numbered lines and their sub-lines ---
    if (isSpotifyTrackListing(lines, i)) {
      i = skipSpotifyTrackBlock(lines, i);
      continue;
    }

    // --- Strip "ALT" lines (Notion's inline alt text label) ---
    if (trimmed === 'ALT') {
      i++;
      continue;
    }

    // --- Strip Notion page links (preserve text, strip UUID URL) ---
    // e.g. [Page Title](https://tidal-seahorse-bc0.notion.site/Page-Title-UUID?pvs=25)
    // Convert to just the display text (inline replacement done in post-processing)

    // Output the line (will be post-processed below)
    output.push(line);
    i++;
  }

  let result = output.join('\n');

  // --- Post-processing: regex replacements ---

  // Strip inline Base64-Image-Removed emoji references: ![emoji](<Base64-Image-Removed>)
  // These appear mid-sentence like "I'm grateful ![🙏🏽](<Base64-Image-Removed>)​"
  result = result.replace(/!\[[^\]]*?\]\(<Base64-Image-Removed>\)\u200B?/g, '');

  // Strip standalone Base64 image lines that may have snuck through
  result = result.replace(/^!\[.*?\]\(<Base64-Image-Removed>\)\s*$/gm, '');

  // Notion page links → plain text
  // e.g. [Page Name](https://tidal-seahorse-bc0.notion.site/Page-Name-UUID)
  result = result.replace(
    /\[([^\]]+)\]\(https:\/\/tidal-seahorse-bc0\.notion\.site\/[^)]+\)/g,
    '$1'
  );

  // Notion image links → preserve as markdown images (they already are)
  // e.g. ![](https://tidal-seahorse-bc0.notion.site/image/...) — these are fine as-is

  // Strip H1 heading (it becomes the frontmatter title)
  result = result.replace(/^#\s+.+\n?/m, '');

  // Collapse 3+ consecutive blank lines into 2
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

// --- Frontmatter serializer ---

function serializeFrontmatter(fields: Record<string, unknown>): string {
  const lines = Object.entries(fields).map(([k, v]) => {
    if (typeof v === 'string') return `${k}: ${JSON.stringify(v)}`;
    if (typeof v === 'number') return `${k}: ${v}`;
    return `${k}: ${v}`;
  });
  return `---\n${lines.join('\n')}\n---`;
}

// --- Main ---

function processFile(filename: string): void {
  const meta = resolveMetaFromFilename(filename);
  if (!meta) {
    console.log(`[SKIP] ${filename} (no metadata match)`);
    return;
  }

  const srcPath = path.join(SRC_DIR, filename);
  const raw = fs.readFileSync(srcPath, 'utf-8');

  const title = extractTitle(raw);
  if (!title) {
    console.log(`[SKIP] ${meta.slug} (no H1 title found)`);
    return;
  }

  const body = cleanContent(raw);

  const frontmatter = serializeFrontmatter({
    title,
    date: meta.date,
    slug: meta.slug,
    issue: meta.issue,
    status: 'published',
  });

  const output = `${frontmatter}\n\n${body}\n`;
  const outPath = path.join(OUT_DIR, `${meta.slug}.md`);
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`[OK] ${meta.slug} (issue ${meta.issue})`);
}

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'));

  let ok = 0;
  let skipped = 0;

  for (const file of files.sort()) {
    const before = fs.readdirSync(OUT_DIR).length;
    processFile(file);
    const after = fs.readdirSync(OUT_DIR).length;
    if (after > before) ok++; else skipped++;
  }

  console.log(`\nDone. ${ok} files written, ${skipped} skipped.`);
}

main();
