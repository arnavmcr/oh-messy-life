'use client';

import { thumbUrl, fullUrl } from '@/lib/gig-photos';

const ROTATIONS = [-3, -2, -1, 0, 1, 2, 3];

interface Props {
  photos: string[];
}

export default function GigPolaroidWall({ photos }: Props) {
  if (photos.length === 0) {
    return <div className="columns-2 md:columns-3 lg:columns-4 gap-6" />;
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-6">
      {photos.map((base, index) => {
        const rotation = ROTATIONS[index % 7];
        const hasTape = index % 4 === 0;
        const hasScanLine = index % 7 === 3;

        return (
          <a
            key={base}
            href={fullUrl(base)}
            target="_blank"
            rel="noopener"
            className={`block break-inside-avoid mb-6 cursor-pointer hover:z-10 transition-all duration-300 hover:scale-105 ${hasTape ? 'tape-effect' : ''}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="bg-white dark:bg-[#f0ece4] shadow-md p-2 pb-8 relative">
              <img
                src={thumbUrl(base)}
                alt=""
                width={600}
                height={600}
                className={`w-full object-cover grayscale hover:grayscale-0 transition-all duration-500 ${hasScanLine ? 'scan-line' : ''}`}
                loading="lazy"
              />
            </div>
          </a>
        );
      })}
    </div>
  );
}
