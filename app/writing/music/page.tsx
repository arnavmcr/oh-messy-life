import Link from 'next/link';
import { getPostsByCategory } from '@/lib/content';
import { CATEGORY_MAP } from '@/lib/categories';
import ArticleCard from '@/components/ArticleCard';
import { rotations, variants, accentBorder, accentText, accentBg } from '@/lib/listing-constants';

export const metadata = {
  title: 'MUSIC // Oh Messy Life',
  description: 'Scene writing, gig essays, and culture criticism.',
};

export default function MusicPage() {
  const posts = getPostsByCategory('music');
  const config = CATEGORY_MAP.music;
  const accent = config.accentColor ?? 'primary';

  return (
    <main className="relative min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      {/* Background scribbles */}
      <div className="absolute top-40 right-10 text-primary/10 pointer-events-none -rotate-12">
        <span className="material-symbols-outlined text-[200px]">music_note</span>
      </div>
      <div className="absolute bottom-20 left-0 text-secondary/5 pointer-events-none rotate-45 scale-150">
        <span className="material-symbols-outlined text-[300px]">headphones</span>
      </div>

      {/* Breadcrumb */}
      <div className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant mb-6 flex items-center gap-2">
        <Link href="/writing" className="hover:text-primary transition-colors">WRITING</Link>
        <span>/</span>
        <span className={accentText[accent]}>MUSIC</span>
      </div>

      {/* Page Header */}
      <div className="mb-12 relative">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-8 ${accentBorder[accent]} pl-6 py-2`}>
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant mb-2">
              CATEGORY: MUSIC
            </div>
            <h1 className="font-headline font-black text-6xl md:text-8xl tracking-tighter uppercase leading-none italic">
              THE{' '}
              <span className={`${accentText[accent]} ink-bleed`}>MUSIC</span>
              _<br />
              ARCHIVE
            </h1>
          </div>
          <div className="md:text-right">
            <div className={`scribble-circle px-4 py-1 inline-block ${accentText[accent]} font-bold rotate-2 font-headline`}>
              {posts.length} entries
            </div>
          </div>
        </div>
        <div className={`absolute -bottom-10 left-0 w-full h-8 ${accentBg[accent]} clip-path-drip opacity-20`} />
      </div>

      {/* Personality zone */}
      {(config.tagline || (config.postIts && config.postIts.length > 0)) && (
        <div className="relative mt-16 mb-8 flex flex-wrap items-start gap-6">
          {config.tagline && (
            <p className="font-headline italic text-2xl md:text-3xl text-on-surface-variant max-w-lg">
              {config.tagline}
            </p>
          )}
          {config.postIts?.map((note, i) => (
            <div
              key={i}
              className={`scribble-circle px-4 py-2 font-mono text-xs font-bold ${accentText[accent]} whitespace-nowrap`}
              style={{ transform: `rotate(${note.rotation})` }}
            >
              {note.text}
            </div>
          ))}
        </div>
      )}

      {/* Article Grid */}
      {posts.length === 0 ? (
        <div className="font-body italic text-stone-400">
          nothing here yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10 mt-16">
          {posts.map((post, i) => (
            <ArticleCard
              key={post.slug}
              {...post}
              variant={variants[i % variants.length]}
              rotation={rotations[i % rotations.length]}
            />
          ))}
        </div>
      )}
    </main>
  );
}
