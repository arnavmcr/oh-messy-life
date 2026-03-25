import type { Metadata } from 'next';
import { COPY } from '@/lib/copy';

export const metadata: Metadata = {
  title: COPY.signal.pageTitle,
  description: COPY.signal.pageDescription,
};

export default function MusicPage() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-16">

      {/* Metadata strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          {COPY.signal.eyebrow}
        </span>
        <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
          ACTIVE
        </span>
      </div>

      {/* Header */}
      <h1 className="font-headline text-5xl font-black uppercase">{COPY.signal.heading}</h1>
      <div className="h-1 w-24 bg-primary my-4" />
      <p className="font-body italic opacity-70">
        {COPY.signal.tagline}
      </p>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">

        {/* LIBRARY — active */}
        <a
          href="/music/index.html"
          className="border border-black/10 dark:border-white/10 p-4 block hover:border-tertiary hover:text-tertiary transition-colors"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            {COPY.signal.library.label}
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            {COPY.signal.library.heading}
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            {COPY.signal.library.description}
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
            {COPY.signal.gigArchive.label}
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            {COPY.signal.gigArchive.heading}
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            {COPY.signal.gigArchive.description}
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
            {COPY.signal.tshirtArchive.label}
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            {COPY.signal.tshirtArchive.heading}
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            {COPY.signal.tshirtArchive.description}
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
