'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getEnabled, playClip, setEnabled, stopAll, subscribe } from '@/lib/ambient-audio';

// Plays the entry's stinger on arrival (sound is on by default) and renders the
// persistent sound toggle. If the browser blocks autoplay (e.g. a direct page
// load), the stinger starts on the visitor's first tap or keypress instead.
export default function EntryAudio({ src }: { src: string }) {
  const enabled = useSyncExternalStore(subscribe, getEnabled, () => true);

  useEffect(() => {
    let cancelled = false;
    const gestures = ['pointerdown', 'keydown', 'touchend'] as const;

    const removeListeners = () => gestures.forEach((g) => window.removeEventListener(g, onGesture));
    async function onGesture() {
      removeListeners();
      if (!cancelled) await playClip(src);
    }

    (async () => {
      const started = await playClip(src);
      if (!started && getEnabled() && !cancelled) {
        gestures.forEach((g) => window.addEventListener(g, onGesture, { once: true }));
      }
    })();

    return () => {
      cancelled = true;
      removeListeners();
      stopAll();
    };
  }, [src]);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        if (next) void playClip(src);
      }}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
      className="fixed bottom-6 right-6 z-40 font-mono text-[10px] tracking-[3px] uppercase border border-outline-variant bg-surface text-on-surface-variant px-3 py-2 hover:text-primary hover:border-primary transition-colors"
    >
      Sound {enabled ? 'on' : 'off'}
    </button>
  );
}
