'use client';

import { thumbUrl, fullUrl } from '@/lib/gig-photos';

const ROTATIONS = [-3, -2, -1, 0, 1, 2, 3];

interface Props {
  photos: string[];
}

export default function GigPolaroidWall({ photos }: Props) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-6">
      {photos.map((base, index) => {
        const rotation = ROTATIONS[index % ROTATIONS.length];
        const hasTape = index % 4 === 0;
        const hasScanLine = index % 7 === 3;

        return (
          <a
            key={base}
            href={fullUrl(base)}
            target="_blank"
            rel="noopener noreferrer"
            className="group block break-inside-avoid mb-6 hover:z-10 hover:scale-105 transition-all duration-300"
          >
            <div
              className={`relative ${hasTape ? 'tape-effect' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="bg-white dark:bg-paper shadow-md p-2 pb-8">
                <img
                  src={thumbUrl(base)}
                  alt=""
                  width={600}
                  height={600}
                  className={`w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ${hasScanLine ? 'scan-line' : ''}`}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
