// Keep in sync with the `pulseBloom` keyframe duration (2200ms) in app/globals.css —
// CSS keyframes can't import this constant, so the two must be updated together.
export const PULSE_CYCLE_MS = 2200;

export function getConnectedNeighbors(
  id: string,
  adj: Map<string, Set<string>>,
  tagAdj: Map<string, Set<string>>,
): string[] {
  const ids = new Set<string>();
  adj.get(id)?.forEach((n) => ids.add(n));
  tagAdj.get(id)?.forEach((n) => ids.add(n));
  return Array.from(ids);
}

export function lightenHexColor(hex: string, amount: number): string {
  const clamped = Math.max(0, Math.min(1, amount));
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * clamped);
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
