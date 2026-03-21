import { getPost, getAllSlugs } from '@/lib/content';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';

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
    <p className="font-body text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">{children}</p>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="relative py-8 px-8 bg-surface-container-low dark:bg-surface-container overflow-hidden my-8 border-l-4 border-primary">
      <span className="material-symbols-outlined text-primary text-3xl mb-2 block">format_quote</span>
      <div className="font-headline text-xl font-medium tracking-tight leading-tight text-zinc-900 dark:text-zinc-100">
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
    <li className="font-body text-zinc-700 dark:text-zinc-300 flex gap-3 leading-relaxed">
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
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="lg:ml-64 pt-24 pb-20 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto min-h-screen">
      {/* Marginalia sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200/20 dark:border-zinc-800/20 p-6 overflow-y-auto z-40">
        <div className="mb-8">
          <h2 className="text-lg font-black text-zinc-900 dark:text-white font-headline">
            MARGINALIA_V1.0
          </h2>
          <p className="font-label text-[10px] text-zinc-400">{post.slug.toUpperCase()}</p>
        </div>
        <div className="space-y-8">
          <div>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase block mb-4">
              SYSTEM_LOGS
            </span>
            <div className="space-y-2 font-mono text-[9px] text-zinc-500 leading-tight">
              <p className="text-tertiary">MOUNTING_ARCHIVE... OK</p>
              <p>FETCHING_REF_ID: {post.slug.slice(0, 8).toUpperCase()}</p>
              <p>DECRYPTING_LAYER_04</p>
              <p className="text-primary animate-pulse">WRITING_TO_BUFFER</p>
            </div>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div>
              <span className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase block mb-3">
                TAGS
              </span>
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[9px] border border-outline-variant px-2 py-0.5 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto pt-8 border-t border-zinc-200/10">
          <div className="relative p-4 bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] font-mono tape-effect -rotate-1">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-zinc-300/40 backdrop-blur-sm" />
            ANOMALY_DETECTED: Contents may contain unverified erraticism.
          </div>
        </div>
      </aside>

      {/* Document Header */}
      <header className="mb-16 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-primary pb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary text-on-primary text-[10px] font-headline font-bold px-2 py-0.5 tracking-tighter">
                STATUS: DECLASSIFIED
              </span>
              {post.tags?.[0] && (
                <span className="text-zinc-400 text-[10px] font-mono uppercase">
                  {post.tags[0]}
                </span>
              )}
            </div>
            <h1 className="font-headline text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] max-w-2xl">
              {post.title}
            </h1>
          </div>
          <div className="text-right font-mono text-[10px] text-on-surface-variant flex flex-col items-end">
            <span>TIMESTAMP: {formattedDate}</span>
            <span className="text-secondary font-bold mt-1">STRICT_CONFIDENTIAL_PROTOCOL</span>
          </div>
        </div>
      </header>

      {/* Article Body */}
      <article className="max-w-2xl space-y-4">
        <MDXRemote source={post.content} components={mdxComponents} />
      </article>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-zinc-800/50 z-50 flex justify-around items-center h-16 px-4">
        <a href="/" className="flex flex-col items-center gap-1 text-zinc-400">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[8px] font-headline">NEXUS</span>
        </a>
        <span className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="text-[8px] font-headline">MANUSCRIPT</span>
        </span>
        <a href="/writing" className="flex flex-col items-center gap-1 text-zinc-400">
          <span className="material-symbols-outlined">folder_open</span>
          <span className="text-[8px] font-headline">VOID</span>
        </a>
      </nav>
    </main>
  );
}
