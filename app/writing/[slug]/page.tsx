import { getPost, getAllSlugs } from '@/lib/content';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} // Oh Messy Life`,
    description: post.excerpt,
  };
}

const mdxComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="font-headline text-xl font-bold uppercase tracking-tight flex items-center gap-3 mb-6 mt-12">
      <span className="w-8 h-[2px] bg-primary flex-shrink-0" />
      {children}
    </h2>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="font-body text-stone-800 dark:text-stone-200 leading-[1.8] mb-6">{children}</p>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="px-12 border-l-4 border-primary py-4 my-16">
      <div className="font-headline text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight uppercase">
        {children}
      </div>
    </blockquote>
  ),
  hr: () => <hr className="border-zinc-200 dark:border-zinc-800 my-12" />,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-on-surface">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-tertiary">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="font-mono text-sm bg-surface-container px-1.5 py-0.5 text-secondary">
      {children}
    </code>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-2 mb-6 ml-4">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="font-body text-stone-800 dark:text-stone-200 flex gap-3 leading-relaxed">
      <span className="text-primary font-bold flex-shrink-0">—</span>
      <span>{children}</span>
    </li>
  ),
};

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const formattedDate = new Date(post.date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).toUpperCase().replace(/ /g, '_');

  return (
    <main className="pt-32 pb-32 min-h-screen">
      <article className="max-w-3xl mx-auto px-8">

        {/* Centralized Metadata */}
        <div className="flex flex-col items-center text-center space-y-8 mb-20">
          <div className="inline-block bg-primary text-on-primary px-3 py-1 font-label text-[10px] font-bold tracking-widest uppercase">
            STATUS: DECLASSIFIED
          </div>
          <div className="flex flex-wrap justify-center gap-8 border-y border-stone-200 dark:border-stone-800 py-6 w-full">
            <div className="space-y-1">
              <p className="font-label text-[10px] text-stone-400 tracking-widest uppercase">CATALOG_ID</p>
              <p className="font-headline font-bold text-xs tracking-tight text-on-surface uppercase">{post.slug.slice(0, 12).toUpperCase()}</p>
            </div>
            <div className="space-y-1">
              <p className="font-label text-[10px] text-stone-400 tracking-widest uppercase">TIMESTAMP</p>
              <p className="font-headline font-bold text-xs tracking-tight text-on-surface">{formattedDate}</p>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="space-y-1">
                <p className="font-label text-[10px] text-stone-400 tracking-widest uppercase">KEYWORDS</p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {post.tags.map((tag) => (
                    <span key={tag} className="border border-outline-variant px-2 py-0.5 font-label text-[9px] text-stone-500 uppercase">
                      {tag.replace(/ /g, '_')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title + Divider + Excerpt */}
        <header className="mb-16 text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-stone-900 dark:text-stone-100 mb-8 uppercase">
            {post.title}
          </h1>
          <div className="h-1 w-24 bg-primary mb-8 mx-auto" />
          {post.excerpt && (
            <p className="font-body italic text-xl md:text-2xl text-stone-500 dark:text-stone-400 leading-relaxed font-light">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="w-full aspect-video bg-surface-container-high mb-16 overflow-hidden relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="article-body text-lg space-y-0 mb-32">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

      </article>

      {/* Floating Reading Controls Pill */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-4 border-r border-stone-200 dark:border-stone-700 pr-8">
            <button className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors" aria-label="Change font size">
              <span className="material-symbols-outlined text-[20px]">format_size</span>
            </button>
            <button className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors" aria-label="Toggle contrast">
              <span className="material-symbols-outlined text-[20px]">contrast</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a href="/writing" className="px-6 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-label text-[10px] font-bold tracking-widest uppercase hover:bg-primary transition-colors">
              ARCHIVE
            </a>
          </div>
          <div className="flex items-center gap-4 border-l border-stone-200 dark:border-stone-700 pl-8">
            <button className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors" aria-label="Share">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <button className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors" aria-label="Bookmark">
              <span className="material-symbols-outlined text-[20px]">bookmark</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
