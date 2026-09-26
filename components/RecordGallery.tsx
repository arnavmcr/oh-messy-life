'use client';

import { useCallback, useState } from 'react';
import type { JournalGallery } from '@/lib/journal';
import Lightbox from '@/components/Lightbox';

const TAPE_COLORS = ['var(--coral)', 'var(--violet)', 'var(--kelp)', 'var(--wine)'];
const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5];

function chunkRoundRobin(images: string[], cols: number) {
  const columns: { src: string; index: number }[][] = Array.from({ length: cols }, () => []);
  images.forEach((src, i) => columns[i % cols].push({ src, index: i }));
  return columns;
}

function Photo({ src, index, onOpen }: { src: string; index: number; onOpen: (index: number) => void }) {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const tapeColor = TAPE_COLORS[index % TAPE_COLORS.length];
  const tapeOnLeft = index % 2 === 0;

  return (
    <button type="button" onClick={() => onOpen(index)} className="relative block w-full text-left">
      <div className="relative" style={{ transform: `rotate(${rotation}deg)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" className="block w-full h-auto" />
        <span
          className={`absolute -top-2 ${tapeOnLeft ? 'left-3' : 'right-3'} w-8 h-3 opacity-80`}
          style={{ background: tapeColor, transform: 'rotate(-3deg)' }}
        />
      </div>
    </button>
  );
}

// Distributes photos round-robin across a fixed number of columns (capped to
// the photo count, so a gallery never renders more columns than it has
// photos for). This replaces CSS `columns-N` masonry, whose auto-balancing
// can leave a column looking empty when photo heights vary a lot.
function ColumnLayout({
  images,
  cols,
  className,
  onOpen,
}: {
  images: string[];
  cols: number;
  className: string;
  onOpen: (index: number) => void;
}) {
  const columns = chunkRoundRobin(images, Math.max(1, Math.min(cols, images.length)));
  return (
    <div className={`${className} gap-4 sm:gap-5`}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-4 sm:gap-5">
          {col.map(({ src, index }) => (
            <Photo key={src} src={src} index={index} onOpen={onOpen} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function RecordGallery({ gallery }: { gallery: JournalGallery }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const navigate = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        const count = gallery.images.length;
        return (current + direction + count) % count;
      });
    },
    [gallery.images.length]
  );

  return (
    <div className="my-8">
      {/* Two variants swapped by breakpoint (not columns-N) so column count
          can adapt to photo count without ever leaving a column empty. */}
      <ColumnLayout images={gallery.images} cols={2} className="flex sm:hidden" onOpen={setOpenIndex} />
      <ColumnLayout images={gallery.images} cols={3} className="hidden sm:flex" onOpen={setOpenIndex} />

      <div className="-rotate-1 mt-6">
        <span
          className="block w-9 h-3 mb-2 ml-2 opacity-80"
          style={{ background: TAPE_COLORS[0], transform: 'rotate(-4deg)' }}
        />
        <p className="font-body italic text-sm text-on-surface-variant">
          {gallery.caption}
        </p>
      </div>

      {openIndex !== null && (
        <Lightbox
          images={gallery.images}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
