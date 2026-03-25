import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music — Oh Messy Life',
  description: 'THE SIGNAL. Crate digging, gigs, and everything in between.',
};

export default function MusicPage() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-16">

      {/* Metadata strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          THE SIGNAL
        </span>
        <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
          ACTIVE
        </span>
      </div>

      {/* Header */}
      <h1 className="font-headline text-5xl font-black uppercase">MUSIC</h1>
      <div className="h-1 w-24 bg-primary my-4" />
      <p className="font-body italic opacity-70">
        Crate digging, live shows, and everything in between.
      </p>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">

        {/* LIBRARY — active */}
        <a
          href="/music/index.html"
          className="border border-black/10 dark:border-white/10 p-4 block hover:border-tertiary hover:text-tertiary transition-colors"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            THE LIBRARY
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            LIBRARY
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            The crate. 8 records, hand-picked.
          </div>
          <div className="mt-3">
            <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
              ACTIVE
            </span>
          </div>
        </a>

        {/* GIG ARCHIVE — stub */}
        <div
          className="border border-black/10 dark:border-white/10 p-4 opacity-40 cursor-not-allowed pointer-events-none"
          aria-disabled="true"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            THE GIG ARCHIVE
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            GIG ARCHIVE
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            Live shows, documented.
          </div>
          <div className="mt-3">
            <span className="stamp-red font-mono text-[9px] uppercase tracking-widest font-bold">
              COMING SOON
            </span>
          </div>
        </div>

        {/* T-SHIRT ARCHIVE — stub */}
        <div
          className="border border-black/10 dark:border-white/10 p-4 opacity-40 cursor-not-allowed pointer-events-none"
          aria-disabled="true"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            THE T-SHIRT ARCHIVE
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            T-SHIRT ARCHIVE
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            Every shirt, every tour.
          </div>
          <div className="mt-3">
            <span className="stamp-red font-mono text-[9px] uppercase tracking-widest font-bold">
              COMING SOON
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
