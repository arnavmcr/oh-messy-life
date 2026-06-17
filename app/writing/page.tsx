import { getAllPosts } from '@/lib/content';
import HomeGraph from '@/components/HomeGraph';

export const metadata = {
  title: 'WRITING // Oh Messy Life',
  description: 'Everything written.',
};

export default function WritingIndexPage() {
  const allPosts = getAllPosts();
  const writingLeaves = allPosts.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags ?? [] }));

  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Masthead */}
      <div className="px-6 md:px-12 pt-24 pb-6 max-w-5xl mx-auto w-full">
        <div className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant mb-3 uppercase">
          Archive · {allPosts.length} entries
        </div>
        <h1 className="font-headline font-black text-5xl md:text-7xl tracking-tighter leading-none italic">
          <span className="text-primary ink-bleed">writing</span>
        </h1>
        <p className="font-body text-on-surface-variant text-sm mt-3">
          hover to preview · click to read · drag to explore
        </p>
      </div>

      {/* Writing graph — fills remaining viewport height */}
      <section className="hero-graph flex-1" style={{ minHeight: '520px', height: 'calc(100dvh - 200px)' }}>
        <HomeGraph
          writingLeaves={writingLeaves}
          writingOnly
        />
      </section>
    </main>
  );
}
