import type { JournalGallery } from '@/lib/journal';

const TAPE_COLORS = ['var(--coral)', 'var(--violet)', 'var(--kelp)', 'var(--wine)'];
const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5];

export default function RecordGallery({ gallery }: { gallery: JournalGallery }) {
  return (
    <div className="my-8">
      <div className="columns-2 sm:columns-3 gap-4 sm:gap-5">
        {gallery.images.map((src, i) => {
          const rotation = ROTATIONS[i % ROTATIONS.length];
          const tapeColor = TAPE_COLORS[i % TAPE_COLORS.length];
          const tapeOnLeft = i % 2 === 0;

          return (
            <a
              key={src}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mb-5 block break-inside-avoid"
            >
              <div className="relative" style={{ transform: `rotate(${rotation}deg)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="block w-full h-auto"
                />
                <span
                  className={`absolute -top-2 ${tapeOnLeft ? 'left-3' : 'right-3'} w-8 h-3 opacity-80`}
                  style={{ background: tapeColor, transform: 'rotate(-3deg)' }}
                />
              </div>
            </a>
          );
        })}
      </div>

      <div className="-rotate-1 mt-6">
        <span
          className="block w-9 h-3 mb-2 ml-2 opacity-80"
          style={{ background: TAPE_COLORS[0], transform: 'rotate(-4deg)' }}
        />
        <p className="font-body italic text-sm text-on-surface-variant">
          {gallery.caption}
        </p>
      </div>
    </div>
  );
}
