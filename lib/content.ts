import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const WRITING_DIR = path.join(process.cwd(), 'content', 'writing');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

export interface Post extends PostMeta {
  content: string;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(WRITING_DIR)) return [];

  const files = fs.readdirSync(WRITING_DIR).filter((f) => f.endsWith('.mdx'));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(WRITING_DIR, file), 'utf-8');
    const { data } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? '2024-01-01',
      excerpt: data.excerpt,
      tags: data.tags ?? [],
      status: data.status ?? 'published',
    } as PostMeta;
  });

  return posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | null {
  const filePath = path.join(WRITING_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? '2024-01-01',
    excerpt: data.excerpt,
    tags: data.tags ?? [],
    status: data.status ?? 'published',
    content,
  };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(WRITING_DIR)) return [];
  return fs
    .readdirSync(WRITING_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}
