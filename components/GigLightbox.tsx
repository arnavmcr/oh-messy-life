'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import type { GigPhoto } from '@/lib/types';

interface Props {
  photos: GigPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function GigLightbox({ photos, index, onClose, onNavigate }: Props) {
  const photo = photos[index];

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, photos.length, onClose, onNavigate]);

  const dateDisplay = photo.month && photo.year ? `${photo.month} ${photo.year}` : null;

  const metaFields = [
    { label: 'ARTIST', value: photo.band },
    { label: 'EVENT', value: photo.event },
    { label: 'CITY', value: photo.city },
    { label: 'DATE', value: dateDisplay },
  ].filter((f) => f.value !== null);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex"
      onClick={onClose}
    >
      {/* Photo area — flex col so aspect-video image is vertically centred */}
      <div
        className="relative flex-1 flex flex-col justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev arrow */}
        {index > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition-opacity font-mono text-2xl"
            onClick={() => onNavigate(index - 1)}
            aria-label="Previous photo"
          >
            ←
          </button>
        )}

        {/* Image — aspect-video container gives next/image a height to fill */}
        <div className="relative w-full aspect-video">
          <Image
            src={photo.fullUrl}
            alt={photo.title}
            fill
            className="object-contain"
            sizes="75vw"
          />
        </div>

        {/* Next arrow */}
        {index < photos.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white opacity-70 hover:opacity-100 transition-opacity font-mono text-2xl"
            onClick={() => onNavigate(index + 1)}
            aria-label="Next photo"
          >
            →
          </button>
        )}
      </div>

      {/* Metadata panel — 1/4 width */}
      <div
        className="w-64 flex-shrink-0 border-l border-white/10 p-6 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="self-end font-mono text-[10px] uppercase tracking-widest text-white opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close lightbox"
        >
          ✕ CLOSE
        </button>

        {/* Meta fields */}
        <div className="flex flex-col gap-4">
          {metaFields.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-widest text-white opacity-40">{label}</span>
              <span className="font-mono text-sm text-white">{value}</span>
            </div>
          ))}
          {metaFields.length === 0 && (
            <p className="font-mono text-sm text-white opacity-50">{photo.title}</p>
          )}
        </div>

        {/* Index */}
        <div className="mt-auto font-mono text-[9px] uppercase tracking-widest text-white opacity-30">
          {index + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}
