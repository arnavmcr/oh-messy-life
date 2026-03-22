import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const RECORD_DIR = path.join(process.cwd(), 'content', 'record');

export interface JournalSection {
  title: string;
  body: string;
  collapsible: boolean;
  bulletList: boolean;
}

export interface JournalEntryMeta {
  slug: string;
  title: string;
  date: string;
  issue: number;
  status: 'draft' | 'published';
  sections: JournalSection[];
}

export interface JournalEntry extends JournalEntryMeta {
  prev: { slug: string; title: string; issue: number } | null;
  next: { slug: string; title: string; issue: number } | null;
}

// --- Section parsing ---

function classifySection(heading: string): Pick<JournalSection, 'collapsible' | 'bulletList'> {
  const lower = heading.toLowerCase();
  if (lower.includes('what is this')) {
    return { collapsible: true, bulletList: false };
  }
  if (lower.includes('other random things') || lower.includes('other fun things')) {
    return { collapsible: false, bulletList: true };
  }
  return { collapsible: false, bulletList: false };
}

function parseSections(markdown: string): JournalSection[] {
  const lines = markdown.split('\n');
  const sections: JournalSection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flushSection = () => {
    if (currentTitle === null) return;
    const classification = classifySection(currentTitle);
    sections.push({
      title: currentTitle,
      body: currentLines.join('\n').trim(),
      ...classification,
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)/);
    if (headingMatch) {
      flushSection();
      currentTitle = headingMatch[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flushSection();

  return sections;
}

// --- Public API ---

export function getAllJournalEntries(): JournalEntryMeta[] {
  if (!fs.existsSync(RECORD_DIR)) return [];

  const files = fs.readdirSync(RECORD_DIR).filter((f) => f.endsWith('.md'));

  const entries = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(RECORD_DIR, file), 'utf-8');
    const { data, content } = matter(raw);

    const sections = parseSections(content);

    return {
      slug,
      title: data.title ?? slug,
      date: String(data.date ?? '2024-01-01'),
      issue: Number(data.issue ?? 0),
      status: (data.status ?? 'published') as 'draft' | 'published',
      sections,
    } satisfies JournalEntryMeta;
  });

  return entries
    .filter((e) => e.status === 'published')
    .sort((a, b) => a.issue - b.issue);
}

export function getJournalEntry(slug: string): JournalEntry | null {
  const filePath = path.join(RECORD_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const status = (data.status ?? 'published') as 'draft' | 'published';
  const issue = Number(data.issue ?? 0);
  const sections = parseSections(content);

  // Build neighbour map from all published entries sorted by issue
  const all = getAllJournalEntries();
  const idx = all.findIndex((e) => e.issue === issue);

  const prev = idx > 0
    ? { slug: all[idx - 1].slug, title: all[idx - 1].title, issue: all[idx - 1].issue }
    : null;
  const next = idx !== -1 && idx < all.length - 1
    ? { slug: all[idx + 1].slug, title: all[idx + 1].title, issue: all[idx + 1].issue }
    : null;

  return {
    slug,
    title: data.title ?? slug,
    date: String(data.date ?? '2024-01-01'),
    issue,
    status,
    sections,
    prev,
    next,
  };
}
