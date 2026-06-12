import type { Metadata } from 'next';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { GIG_PHOTOS } from '@/lib/gig-photos';
import GigPolaroidWall from '@/components/GigPolaroidWall';

export const metadata: Metadata = {
  title: 'Gig Archive — music — oh messy life',
  description: COPY.signal.gigArchive.tagline,
};

export default function GigArchivePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16">

      {/* Metadata strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          music / gig archive
        </span>
        <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
          ACTIVE
        </span>
      </div>

      {/* Header */}
      <h1 className="font-headline text-5xl font-black uppercase">
        {COPY.signal.gigArchive.heading}
      </h1>
      <div className="h-1 w-24 bg-primary my-4" />
      <p className="font-body italic opacity-70 mb-12">
        {COPY.signal.gigArchive.tagline}
      </p>

      {/* Polaroid wall */}
      <GigPolaroidWall photos={GIG_PHOTOS} />

      {/* Stats strip */}
      <div className="mt-12 font-mono text-xs uppercase tracking-widest opacity-50 text-center">
        2006 – PRESENT · ARNAV&apos;S LIVE MUSIC · {GIG_PHOTOS.length} PHOTOS
      </div>

      <Link
        href="/music"
        className="block mt-8 text-center font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
      >
        ← Back to The Signal
      </Link>

    </main>
  );
}
