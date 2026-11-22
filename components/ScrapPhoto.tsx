'use client';

import { playClip } from '@/lib/ambient-audio';

// Single scrapbook-style photo with its own caption: a taped, slightly tilted
// print that alternates sides down the page. Rendered from
// `{{photo:src|caption|audio}}` placeholders in record entries. If `audio` is
// set, tapping the print plays that clip (a hidden easter egg, no visible hint).

const TAPE_COLORS = ['var(--coral)', 'var(--violet)', 'var(--kelp)', 'var(--wine)'];
const ROTATIONS = [-2, 1.5, -1, 2.5, -1.5, 1];
// Full class strings so Tailwind's scanner picks them up.
const WIDTHS = ['sm:w-3/5', 'sm:w-2/3', 'sm:w-1/2', 'sm:w-7/12'];

export default function ScrapPhoto({
  src,
  caption,
  audio,
  index,
}: {
  src: string;
  caption?: string;
  audio?: string;
  index: number;
}) {
  const onRight = index % 2 === 1;
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const tapeColor = TAPE_COLORS[index % TAPE_COLORS.length];

  return (
    <figure
      className={`my-10 w-full ${WIDTHS[index % WIDTHS.length]} ${onRight ? 'sm:ml-auto' : 'sm:mr-auto'}`}
    >
      <div
        className={`relative bg-surface p-2 pb-3 shadow-md ${audio ? 'cursor-pointer' : ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        {...(audio
          ? {
              role: 'button',
              tabIndex: 0,
              onClick: () => void playClip(audio),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') void playClip(audio);
              },
            }
          : {})}
      >
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 opacity-80"
          style={{ background: tapeColor, transform: 'rotate(-3deg)' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption ?? ''} loading="lazy" className="block w-full h-auto" />
        {caption && (
          <figcaption className="font-body italic text-sm text-on-surface-variant mt-3 px-1 leading-snug">
            {caption}
          </figcaption>
        )}
      </div>
    </figure>
  );
}
