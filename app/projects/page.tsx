import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'THE LABS — oh messy life',
  description: 'Projects and experiments by Arnav.',
};

export default function ProjectsPage() {
  return (
    <main className="max-w-3xl mx-auto px-8 py-16">

      {/* Metadata strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          projects
        </span>
        <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
          ACTIVE
        </span>
      </div>

      {/* Header */}
      <h1 className="font-headline text-5xl font-black uppercase">The Labs</h1>
      <div className="h-1 w-24 my-4" style={{ backgroundColor: 'var(--node-labs)' }} />
      <p className="font-body italic opacity-70">
        Side projects, data experiments, and things built for fun.
      </p>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">

        <Link
          href="/projects/ticket-ticker"
          className="border border-black/10 dark:border-white/10 p-4 block hover:border-primary hover:text-primary transition-colors"
        >
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-50">
            data · music
          </div>
          <div className="font-headline uppercase text-lg font-black mt-1">
            Ticket Ticker
          </div>
          <div className="font-body text-sm opacity-70 mt-1">
            India's concert resale market, visualised. 7k+ WhatsApp listings across 180+ events.
          </div>
          <div className="mt-3">
            <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
              ACTIVE
            </span>
          </div>
        </Link>

      </div>
    </main>
  );
}
