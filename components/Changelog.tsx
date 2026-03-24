import Link from 'next/link';
import { getChangelogEntries } from '@/lib/changelog';
import type { ChangelogEntry } from '@/lib/changelog';

function typeLabel(type: ChangelogEntry['type']) {
  if (type === 'WRITING') return <span className="font-mono text-[9px] font-bold w-[52px] flex-shrink-0 text-primary">{type}</span>;
  if (type === 'RECORD')  return <span className="font-mono text-[9px] font-bold w-[52px] flex-shrink-0 text-[#7b5cf0]">{type}</span>;
  return                          <span className="font-mono text-[9px] font-bold w-[52px] flex-shrink-0 text-[#00c48c]">{type}</span>;
}

export default function Changelog() {
  const entries = getChangelogEntries(10);

  return (
    <section className="bg-zinc-900 dark:bg-black border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-8 md:px-16 py-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-white font-bold">
            CHANGELOG // SITE_LOG
          </span>
          <span className="font-mono text-[9px] text-primary animate-pulse" aria-hidden="true">
            ● LIVE
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-0">
          {entries.map((entry) => (
            <Link
              key={entry.href + entry.date}
              href={entry.href}
              className="group flex items-center gap-3 py-2.5 px-1 border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <span className="font-mono text-[9px] text-white/20 flex-shrink-0" aria-hidden="true">&gt;</span>
              <span className="font-mono text-[9px] text-zinc-500 w-[72px] flex-shrink-0">{entry.date}</span>
              {typeLabel(entry.type)}
              <span className="font-mono text-[10px] text-zinc-300 flex-grow truncate">{entry.description}</span>
              <span className="font-mono text-zinc-600 group-hover:text-primary transition-colors flex-shrink-0" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
