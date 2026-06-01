import Link from 'next/link';
import { getAllPosts } from '@/lib/content';
import { CATEGORY_MAP } from '@/lib/categories';
import { accentText, accentBg } from '@/lib/listing-constants';

export const metadata = {
  title: 'WRITING // Oh Messy Life',
  description: 'Everything written.',
};

const DISPLAY_ORDER = ['college', 'music', 'essays', 'mba', 'projects'] as const;

const CATEGORY_ICONS: Record<string, string> = {
  college: 'history_edu',
  music: 'music_note',
  essays: 'edit',
  mba: 'school',
  projects: 'code',
};

export default function WritingIndexPage() {
  const allPosts = getAllPosts();
  const categories = DISPLAY_ORDER.map((key) => ({
    key,
    config: CATEGORY_MAP[key],
    postCount: allPosts.filter((p) => p.category === key).length,
    href: `/writing/${key}`,
    icon: CATEGORY_ICONS[key],
  }));

  return (
    <main className="relative min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-5xl mx-auto overflow-hidden">
      {/* Background decorative element */}
      <div className="absolute top-32 right-0 text-primary/5 pointer-events-none -rotate-6">
        <span className="material-symbols-outlined text-[400px]">auto_stories</span>
      </div>

      {/* Page header */}
      <div className="mb-16">
        <div className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant mb-4 uppercase">
          Archive
        </div>
        <h1 className="font-headline font-black text-7xl md:text-9xl tracking-tighter uppercase leading-none italic mb-6">
          THE{' '}
          <span className="text-primary ink-bleed">VOID</span>
        </h1>
        <p className="font-body text-on-surface-variant text-sm max-w-md">
          Everything written. Pick a category.
        </p>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant border border-outline-variant">
        {categories.map(({ key, config, postCount, href, icon }) => {
          const accent = config.accentColor ?? 'primary';
          return (
            <Link
              key={key}
              href={href}
              className="group relative bg-paper p-8 flex flex-col gap-4 hover:bg-surface-container transition-colors duration-150"
            >
              {/* Accent bar */}
              <div className={`absolute top-0 left-0 w-1 h-full ${accentBg[accent]}`} />

              {/* Icon */}
              <div className={`${accentText[accent]} opacity-30 group-hover:opacity-60 transition-opacity`}>
                <span className="material-symbols-outlined text-5xl">{icon}</span>
              </div>

              {/* Label */}
              <div>
                <div className={`font-headline font-black text-4xl md:text-5xl tracking-tighter uppercase leading-none ${accentText[accent]}`}>
                  {config.label.toUpperCase()}
                </div>
                {config.tagline && (
                  <p className="font-body text-on-surface-variant text-sm mt-2 leading-relaxed">
                    {config.tagline}
                  </p>
                )}
              </div>

              {/* Post count + arrow */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant">
                <span className={`font-mono text-[10px] tracking-[0.25em] uppercase ${accentText[accent]}`}>
                  {postCount} {postCount === 1 ? 'entry' : 'entries'}
                </span>
                <span className={`${accentText[accent]} text-lg group-hover:translate-x-1 transition-transform`}>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
