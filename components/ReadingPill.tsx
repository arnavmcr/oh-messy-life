'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const SIZE_CYCLE = ['normal', 'large', 'small'] as const;
type TextSize = typeof SIZE_CYCLE[number];

const SIZE_LABELS: Record<TextSize, string> = {
  normal: 'NORMAL',
  large: 'LARGE',
  small: 'SMALL',
};

interface ReadingPillProps {
  slug: string;
  title: string;
}

export default function ReadingPill({ slug, title }: ReadingPillProps) {
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('reading-text-size') as TextSize | null;
    if (saved && SIZE_CYCLE.includes(saved)) {
      setTextSize(saved);
      applyTextSize(saved);
    }

    const bookmarks: string[] = JSON.parse(localStorage.getItem('bookmarks') ?? '[]');
    setBookmarked(bookmarks.includes(slug));
  }, [slug]);

  function applyTextSize(size: TextSize) {
    document.documentElement.classList.remove('reading-large', 'reading-small');
    if (size === 'large') document.documentElement.classList.add('reading-large');
    if (size === 'small') document.documentElement.classList.add('reading-small');
  }

  function cycleTextSize() {
    const next = SIZE_CYCLE[(SIZE_CYCLE.indexOf(textSize) + 1) % SIZE_CYCLE.length];
    setTextSize(next);
    applyTextSize(next);
    localStorage.setItem('reading-text-size', next);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or API unavailable — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleBookmark() {
    const bookmarks: string[] = JSON.parse(localStorage.getItem('bookmarks') ?? '[]');
    const next = bookmarked
      ? bookmarks.filter((s) => s !== slug)
      : [...bookmarks, slug];
    localStorage.setItem('bookmarks', JSON.stringify(next));
    setBookmarked(!bookmarked);
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-white/20 dark:border-white/10">

        {/* Text size + contrast */}
        <div className="flex items-center gap-4 border-r border-stone-200 dark:border-stone-700 pr-8">
          <button
            onClick={cycleTextSize}
            title={`Text size: ${SIZE_LABELS[textSize]}`}
            className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors relative"
          >
            <span className="material-symbols-outlined text-[20px]">format_size</span>
            {textSize !== 'normal' && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
          <button aria-hidden="true" tabIndex={-1} className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            <span className="material-symbols-outlined text-[20px]">contrast</span>
          </button>
        </div>

        {/* Archive link */}
        <div className="flex items-center gap-2">
          <Link
            href="/writing"
            className="px-6 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-label text-[10px] font-bold tracking-widest uppercase hover:bg-primary transition-colors"
          >
            ARCHIVE
          </Link>
        </div>

        {/* Share + bookmark */}
        <div className="flex items-center gap-4 border-l border-stone-200 dark:border-stone-700 pl-8">
          <button
            onClick={handleShare}
            title={copied ? 'Copied!' : 'Share'}
            className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {copied ? 'check' : 'share'}
            </span>
          </button>
          <button
            onClick={toggleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            className={`transition-colors ${bookmarked ? 'text-primary' : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0" }}>
              bookmark
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
