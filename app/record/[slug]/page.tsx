import { compileMDX } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllJournalEntries, getJournalEntry, type JournalSection } from '@/lib/journal';
import CollapsibleSection from '@/components/CollapsibleSection';

// ─── MDX component map (matches writing/[slug]/page.tsx) ─────────────────────

const mdxComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="font-headline text-lg font-bold uppercase tracking-tight flex items-center gap-3 mb-4 mt-8">
      <span className="w-6 h-[2px] bg-primary flex-shrink-0" />
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="font-headline text-base font-bold uppercase tracking-tight mb-3 mt-6 text-on-surface-variant">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="font-headline text-sm font-semibold uppercase tracking-widest mb-2 mt-4 text-on-surface-variant">
      {children}
    </h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="font-body text-on-surface leading-relaxed mb-4">{children}</p>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary pl-4 my-6 font-headline text-lg font-medium leading-snug text-on-surface">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-outline-variant my-8" />,
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
    <li className="font-body text-on-surface flex gap-3 leading-relaxed">
      <span className="text-primary font-bold flex-shrink-0">—</span>
      <span>{children}</span>
    </li>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      className="w-full my-6 border border-outline-variant"
    />
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="text-secondary underline underline-offset-2 hover:text-primary transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
};

// Bullet-list MDX: uses · bullets and muted colour
const bulletMdxComponents = {
  ...mdxComponents,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="font-body text-on-surface-variant leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-3 mb-4">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="font-body text-on-surface-variant flex gap-3 leading-relaxed">
      <span className="text-outline flex-shrink-0">·</span>
      <span>{children}</span>
    </li>
  ),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function renderSection(section: JournalSection) {
  if (section.bulletList) {
    const { content } = await compileMDX({
      source: section.body,
      components: bulletMdxComponents,
      options: { mdxOptions: { format: 'md' } },
    });
    return content;
  }
  const { content } = await compileMDX({
    source: section.body,
    components: mdxComponents,
    options: { mdxOptions: { format: 'md' } },
  });
  return content;
}

function formatIssue(n: number): string {
  return String(n).padStart(3, '0');
}

function formatEntryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return getAllJournalEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) return {};
  return {
    title: `${entry.title} // Oh Messy Life`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getJournalEntry(slug);
  if (!entry) notFound();

  // Render all section bodies (async, concurrent via Promise.all)
  const renderedBodies = await Promise.all(entry.sections.map(renderSection));

  const formattedDate = formatEntryDate(entry.date);

  return (
    <main className="min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-2xl mx-auto">

      {/* ── Entry Header ─────────────────────────────────────────────── */}
      <header className="mb-16 border-b-2 border-primary pb-8">
        <div className="font-mono text-[10px] tracking-[3px] uppercase text-on-surface-variant mb-2">
          Issue {formatIssue(entry.issue)}
        </div>
        <div className="font-mono text-[10px] tracking-[2px] uppercase text-outline mb-6">
          {formattedDate}
        </div>
        <h1 className="font-headline font-black tracking-tighter leading-none text-4xl md:text-5xl lg:text-6xl">
          {entry.title}
        </h1>
      </header>

      {/* ── Sections ─────────────────────────────────────────────────── */}
      <div className="space-y-12">
        {entry.sections.map((section, i) => {
          const body = renderedBodies[i];

          if (section.collapsible) {
            return (
              <CollapsibleSection key={section.title} title={section.title}>
                <div className="font-body text-on-surface-variant text-sm leading-relaxed space-y-3 pt-2">
                  {body}
                </div>
              </CollapsibleSection>
            );
          }

          if (section.bulletList) {
            return (
              <section key={section.title} aria-label={section.title}>
                <div className="border-t border-outline-variant pt-6 mb-6">
                  <span className="font-mono text-[9px] tracking-[4px] uppercase text-outline">
                    {section.title}
                  </span>
                </div>
                <div className="space-y-2">
                  {body}
                </div>
              </section>
            );
          }

          // Standard chapter section
          return (
            <section key={section.title} aria-label={section.title}>
              <div className="border-t-2 border-on-surface pt-6 mb-8">
                <h2 className="font-headline font-black text-2xl tracking-tight uppercase leading-tight">
                  {section.title}
                </h2>
              </div>
              <div>
                {body}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Prev / Next nav ───────────────────────────────────────────── */}
      {(entry.prev || entry.next) && (
        <nav
          className="mt-20 pt-8 border-t border-outline-variant grid grid-cols-2 gap-4"
          aria-label="Adjacent entries"
        >
          <div>
            {entry.prev && (
              <Link
                href={`/record/${entry.prev.slug}`}
                className="group flex flex-col gap-1 text-left"
              >
                <span className="font-mono text-[9px] tracking-[3px] uppercase text-outline group-hover:text-primary transition-colors">
                  ← Previous
                </span>
                <span className="font-headline font-semibold text-sm text-on-surface group-hover:text-primary transition-colors leading-snug">
                  {entry.prev.title}
                </span>
                <span className="font-mono text-[9px] text-outline">
                  #{formatIssue(entry.prev.issue)}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {entry.next && (
              <Link
                href={`/record/${entry.next.slug}`}
                className="group flex flex-col gap-1 items-end"
              >
                <span className="font-mono text-[9px] tracking-[3px] uppercase text-outline group-hover:text-primary transition-colors">
                  Next →
                </span>
                <span className="font-headline font-semibold text-sm text-on-surface group-hover:text-primary transition-colors leading-snug">
                  {entry.next.title}
                </span>
                <span className="font-mono text-[9px] text-outline">
                  #{formatIssue(entry.next.issue)}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* ── Back to archive ───────────────────────────────────────────── */}
      <div className="mt-12 text-center">
        <Link
          href="/record"
          className="font-mono text-[10px] tracking-[3px] uppercase text-outline hover:text-primary transition-colors"
        >
          ↑ Back to The Record
        </Link>
      </div>

    </main>
  );
}
