import type { JournalGallery } from '@/lib/journal';

const TAPE_COLORS = ['var(--coral)', 'var(--violet)', 'var(--kelp)', 'var(--wine)'];
const ROTATIONS = [-3, 2, -2, 3, -1.5, 1.5, -2.5, 2.5];

function isHero(index: number) {
  return index % 5 === 2;
}

export default function RecordGallery({ gallery }: { gallery: JournalGallery }) {
  return (
    <div className="my-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-[110px] sm:auto-rows-[150px] md:auto-rows-[170px] gap-3 sm:gap-4 grid-flow-dense">
        {gallery.images.map((src, i) => {
          const hero = isHero(i);
          const rotation = ROTATIONS[i % ROTATIONS.length];
          const tapeColor = TAPE_COLORS[i % TAPE_COLORS.length];
          const doodle = i % 6 === 4;
          const tapeOnLeft = i % 2 === 0;

          return (
            <a
              key={src}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative block overflow-visible ${hero ? 'col-span-2 row-span-2' : ''}`}
            >
              <div className="relative w-full h-full" style={{ transform: `rotate(${rotation}deg)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute -top-2 ${tapeOnLeft ? 'left-3' : 'right-3'} w-8 h-3 opacity-80`}
                  style={{ background: tapeColor, transform: 'rotate(-3deg)' }}
                />
                {doodle && (
                  <span
                    className="scribble-circle absolute -inset-2 pointer-events-none"
                    style={{ color: tapeColor }}
                  />
                )}
              </div>
            </a>
          );
        })}
      </div>

      <div className="-rotate-1 mt-4">
        <span
          className="block w-9 h-3 mb-[-6px] ml-2 opacity-80"
          style={{ background: TAPE_COLORS[0], transform: 'rotate(-4deg)' }}
        />
        <p className="font-body italic text-sm text-on-surface-variant">
          {gallery.caption}
        </p>
      </div>
    </div>
  );
}
