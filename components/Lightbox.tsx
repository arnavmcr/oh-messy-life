'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const SWIPE_THRESHOLD = 40;

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
}

export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    }
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose, onNavigate]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    onNavigate(delta > 0 ? -1 : 1);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(-1);
          }}
          className="absolute left-1 sm:left-6 text-white hover:text-primary transition-colors p-2"
        >
          <span className="material-symbols-outlined text-4xl">chevron_left</span>
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(1);
          }}
          className="absolute right-1 sm:right-6 text-white hover:text-primary transition-colors p-2"
        >
          <span className="material-symbols-outlined text-4xl">chevron_right</span>
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest text-white/70">
          {index + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
}
