import { getAllPosts } from '@/lib/content';
import ArticleCard from '@/components/ArticleCard';
import { COPY } from '@/lib/copy';

const rotations = ['-1deg', '2deg', '-0.5deg', '1.5deg', '0deg'];
const variants: ('featured' | 'compact' | 'default')[] = [
  'featured', 'compact', 'default', 'compact', 'featured',
];

export const metadata = {
  title: COPY.writing.pageTitle,
  description: COPY.writing.pageDescription,
};

export default function WritingPage() {
  const posts = getAllPosts();

  return (
    <main className="relative min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
      {/* Background scribbles */}
      <div className="absolute top-40 right-10 text-secondary/10 pointer-events-none -rotate-12">
        <span className="material-symbols-outlined text-[200px]">draw</span>
      </div>
      <div className="absolute bottom-20 left-0 text-primary/5 pointer-events-none rotate-45 scale-150">
        <span className="material-symbols-outlined text-[300px]">brush</span>
      </div>

      {/* Page Header */}
      <div className="mb-20 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-8 border-primary pl-6 py-2">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant mb-2">
              SPEC_VERSION: 0.1.0 // STATUS: VOLATILE
            </div>
            <h1 className="font-headline font-black text-6xl md:text-8xl tracking-tighter uppercase leading-none italic">
              THE{' '}
              <span className="text-secondary ink-bleed">MANUSCRIPT</span>
              _<br />
              VOID
            </h1>
          </div>
          <div className="md:text-right">
            <div className="font-mono text-[10px] tracking-widest text-on-surface-variant">
              LOG_ACCESS: GRANTED
            </div>
            <div className="scribble-circle px-4 py-1 inline-block mt-2 text-tertiary font-bold rotate-2 font-headline">
              {posts.length} ENTRIES
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 left-0 w-full h-8 bg-primary clip-path-drip opacity-20" />
      </div>

      {/* Article Grid */}
      {posts.length === 0 ? (
        <div className="font-mono text-[10px] text-on-surface-variant">
          NO_ENTRIES_FOUND // CHECK CONTENT DIRECTORY
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

      {/* Floating action */}
      <div className="fixed bottom-8 right-8 z-50">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-white p-4 font-mono font-bold uppercase tracking-tighter text-sm flex items-center gap-3 hover:-translate-y-1 hover:translate-x-1 transition-transform"
        >
          <span>NEW_ENTRY</span>
          <span className="material-symbols-outlined">add</span>
        </a>
      </div>
    </main>
  );
}
