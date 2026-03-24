import { getAllPosts } from './content';
import { getAllJournalEntries } from './journal';
import changelogJson from '../content/changelog.json';

export type ChangelogEntry = {
  date: string;
  type: 'WRITING' | 'RECORD' | 'SITE';
  description: string;
  href: string;
};

export function getChangelogEntries(limit = 10): ChangelogEntry[] {
  const writing: ChangelogEntry[] = getAllPosts().map((post) => ({
    date: post.date,
    type: 'WRITING',
    description: post.title,
    href: `/writing/${post.slug}`,
  }));

  const record: ChangelogEntry[] = getAllJournalEntries().map((entry) => ({
    date: entry.date,
    type: 'RECORD',
    description: entry.title,
    href: `/record/${entry.slug}`,
  }));

  const site: ChangelogEntry[] = (changelogJson as ChangelogEntry[]).map((e) => ({
    date: e.date,
    type: 'SITE',
    description: e.description,
    href: e.href,
  }));

  return [...writing, ...record, ...site]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
