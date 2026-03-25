import Link from 'next/link';
import { getAllJournalEntries } from '@/lib/journal';
import { COPY } from '@/lib/copy';

export const metadata = {
  title: COPY.record.pageTitle,
  description: COPY.record.pageDescription,
};

function getAgeClass(year: number, newestYear: number): string {
  const delta = newestYear - year;
  if (delta === 0) return 'text-on-surface';
  if (delta === 1) return 'text-on-surface/70';
  return 'text-on-surface/40';
}

function formatIssue(n: number): string {
  return String(n).padStart(3, '0');
}

function getEntryYear(date: string): number {
  return new Date(date).getFullYear();
}

function formatDateRange(entries: ReturnType<typeof getAllJournalEntries>): string {
  if (entries.length === 0) return '';
  const oldest = entries[0];
  const oldDate = new Date(oldest.date);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  return `${fmt(oldDate)} – present`;
}

function getSectionNames(entry: ReturnType<typeof getAllJournalEntries>[number]): string {
  return entry.sections
    .filter((s) => !s.collapsible)
    .map((s) => s.title)
    .join(' · ');
}

export default function RecordPage() {
  // getAllJournalEntries returns sorted ascending by issue number
  const entries = getAllJournalEntries();

  // Reverse for display (newest first)
  const displayEntries = [...entries].reverse();

  const newestYear = displayEntries.length > 0 ? getEntryYear(displayEntries[0].date) : new Date().getFullYear();
  const dateRange = formatDateRange(entries);

  // Group by year, maintaining descending order
  const years: number[] = [];
  const byYear: Record<number, typeof displayEntries> = {};
  for (const entry of displayEntries) {
    const year = getEntryYear(entry.date);
    if (!byYear[year]) {
      years.push(year);
      byYear[year] = [];
    }
    byYear[year].push(entry);
  }

  // Build a flat list with year breaks for animation indexing
  type Row =
    | { type: 'year'; year: number; animIndex: number }
    | { type: 'entry'; entry: (typeof displayEntries)[number]; animIndex: number; isLatest: boolean; isFirst: boolean };

  const rows: Row[] = [];
  let animIndex = 0;
  for (const year of years) {
    rows.push({ type: 'year', year, animIndex });
    animIndex++;
    for (const entry of byYear[year]) {
      const isLatest = entry.issue === displayEntries[0]?.issue;
      const isFirst = entry.issue === entries[0]?.issue;
      rows.push({ type: 'entry', entry, animIndex, isLatest, isFirst });
      animIndex++;
    }
  }

  return (
    <main className="min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-4xl mx-auto">

      {/* Masthead */}
      <div className="flex justify-between items-end border-b-2 border-primary pb-6 mb-0">
        <h1 className="font-headline font-black leading-none tracking-tighter" style={{ fontSize: 'clamp(48px, 8vw, 80px)', letterSpacing: '-3px' }}>
          THE<br />RECORD
        </h1>
        <div className="text-right font-mono text-[10px] tracking-widest text-on-surface-variant uppercase leading-relaxed">
          {entries.length} issues<br />
          {dateRange}<br />
          Monthly
        </div>
      </div>

      {/* Column header */}
      <div className="grid grid-cols-[48px_1fr] gap-4 py-3 border-b border-surface-container-high font-mono text-[9px] tracking-[3px] text-surface-container-highest uppercase">
        <span>#</span>
        <span>Entry &amp; sections</span>
      </div>

      {/* Archive rows */}
      {entries.length === 0 ? (
        <p className="font-mono text-[10px] text-on-surface-variant mt-8">
          NO_ENTRIES_FOUND // CHECK CONTENT DIRECTORY
        </p>
      ) : (
        <div>
          {rows.map((row) => {
            const delay = `${0.02 + row.animIndex * 0.04}s`;

            if (row.type === 'year') {
              return (
                <div
                  key={`year-${row.year}`}
                  className="record-row grid grid-cols-[48px_1fr] gap-4 pt-10 pb-2"
                  style={{ animationDelay: delay }}
                >
                  <span className="font-mono text-[9px] tracking-[3px] text-on-surface-variant/30 uppercase pt-0.5">
                    {row.year}
                  </span>
                  <div
                    className="mt-1.5 h-px"
                    style={{ background: 'linear-gradient(to right, var(--color-outline-variant), transparent)' }}
                  />
                </div>
              );
            }

            // entry row
            const { entry, isLatest, isFirst } = row;
            const sectionNames = getSectionNames(entry);
            const ageClass = getAgeClass(getEntryYear(entry.date), newestYear);

            return (
              <Link
                key={entry.slug}
                href={`/record/${entry.slug}`}
                className="record-entry record-row grid grid-cols-[48px_1fr_auto] gap-4 py-3.5 border-b border-surface-container items-start transition-colors duration-150 -mx-2 px-2"
                style={{ animationDelay: delay }}
              >
                {/* Issue number */}
                <span className="record-entry-num font-mono text-[10px] text-on-surface-variant/20 transition-colors duration-200 pt-0.5">
                  {formatIssue(entry.issue)}
                </span>

                {/* Body */}
                <div className="min-w-0">
                  <div className={`record-entry-title font-headline font-semibold text-sm leading-snug tracking-tight transition-colors duration-150 ${ageClass}`}>
                    {entry.title}
                  </div>
                  {sectionNames && (
                    <div className="font-mono text-[10px] text-on-surface-variant/30 mt-1 leading-relaxed tracking-wide">
                      {sectionNames}
                    </div>
                  )}
                </div>

                {/* Right: badges + arrow */}
                <div className="flex items-start gap-2 pt-0.5">
                  {isLatest && (
                    <span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border border-secondary text-secondary">
                      Latest
                    </span>
                  )}
                  {isFirst && !isLatest && (
                    <span className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border border-surface-container-high text-on-surface-variant/30">
                      First
                    </span>
                  )}
                  <span className="record-entry-arrow text-primary text-sm">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div
        className="record-row mt-16 font-mono text-[9px] tracking-widest text-on-surface-variant/20 uppercase text-center pb-8"
        style={{ animationDelay: `${0.02 + animIndex * 0.04}s` }}
      >
        {COPY.record.footerNote}
      </div>

    </main>
  );
}
