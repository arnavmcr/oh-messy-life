'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getEnabled, playClip, setEnabled, stopAll, subscribe } from '@/lib/ambient-audio';

// Plays the entry's stinger on arrival (sound is on by default) and renders the
// persistent sound toggle. If the browser blocks autoplay (e.g. a direct page
// load), the stinger starts on the visitor's first tap or keypress instead.
export default function EntryAudio({ src }: { src: string }) {
  const enabled = useSyncExternalStore(subscribe, getEnabled, () => true);
  // True when the browser blocked autoplay and we're waiting for a first tap/keypress.
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const gestures = ['pointerdown', 'keydown', 'touchend'] as const;

    const removeListeners = () => gestures.forEach((g) => window.removeEventListener(g, onGesture));
    async function onGesture() {
      removeListeners();
      if (cancelled) return;
      await playClip(src);
      setBlocked(false);
    }

    (async () => {
      const started = await playClip(src);
      if (!started && getEnabled() && !cancelled) {
        setBlocked(true);
        gestures.forEach((g) => window.addEventListener(g, onGesture, { once: true }));
      }
    })();

    return () => {
      cancelled = true;
      removeListeners();
      stopAll();
    };
  }, [src]);

  const needsTap = enabled && blocked;

  return (
    <button
      type="button"
      onClick={() => {
        if (needsTap) {
          setBlocked(false);
          void playClip(src);
          return;
        }
        const next = !enabled;
        setEnabled(next);
        if (next) void playClip(src);
      }}
      aria-pressed={enabled}
      aria-label={needsTap ? 'Tap to start ambient sound' : enabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 font-mono text-[10px] tracking-[3px] uppercase border bg-surface px-3 py-2 transition-colors ${
        needsTap
          ? 'border-primary text-primary animate-pulse'
          : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
      }`}
    >
      {needsTap ? (
        <>
          <span aria-hidden>▶</span> Tap anywhere for sound
        </>
      ) : (
        <>Sound {enabled ? 'on' : 'off'}</>
      )}
    </button>
  );
}
