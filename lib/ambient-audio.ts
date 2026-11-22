// Client-only ambient audio manager for record entries.
// Sound is ON by default; the visitor can mute via <SoundToggle/>, and the
// choice is remembered for the session (sessionStorage).

const KEY = 'ambient-sound';
const EVENT = 'ambient-sound-change';

let current: HTMLAudioElement | null = null;

export function getEnabled(): boolean {
  try {
    return sessionStorage.getItem(KEY) !== 'off';
  } catch {
    return true; // storage blocked: fall back to the default (on)
  }
}

export function setEnabled(on: boolean): void {
  try {
    sessionStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // ignore: preference just won't persist
  }
  if (!on) stopAll();
  window.dispatchEvent(new Event(EVENT));
}

export function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function stopAll(): void {
  if (current) {
    current.pause();
    current = null;
  }
}

// Plays a clip (replacing any clip already playing). Resolves false if sound is
// muted or the browser blocked playback (autoplay policy before a user gesture).
export async function playClip(src: string, volume = 0.6): Promise<boolean> {
  if (!getEnabled()) return false;
  stopAll();
  const audio = new Audio(src);
  audio.volume = volume;
  current = audio;
  try {
    await audio.play();
    return true;
  } catch {
    if (current === audio) current = null;
    return false;
  }
}
