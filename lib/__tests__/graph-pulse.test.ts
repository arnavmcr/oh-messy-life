import { describe, it, expect } from 'vitest';
import { getConnectedNeighbors, lightenHexColor, PULSE_CYCLE_MS } from '../graph-pulse';

describe('getConnectedNeighbors', () => {
  it('unions adj and tagAdj neighbors for a node', () => {
    const adj = new Map([['a', new Set(['b'])]]);
    const tagAdj = new Map([['a', new Set(['c'])]]);
    expect(getConnectedNeighbors('a', adj, tagAdj).sort()).toEqual(['b', 'c']);
  });

  it('dedupes a neighbor present in both maps', () => {
    const adj = new Map([['a', new Set(['b'])]]);
    const tagAdj = new Map([['a', new Set(['b'])]]);
    expect(getConnectedNeighbors('a', adj, tagAdj)).toEqual(['b']);
  });

  it('returns an empty array for a node with no edges', () => {
    const adj = new Map<string, Set<string>>();
    const tagAdj = new Map<string, Set<string>>();
    expect(getConnectedNeighbors('a', adj, tagAdj)).toEqual([]);
  });
});

describe('lightenHexColor', () => {
  it('returns the original color at amount 0', () => {
    expect(lightenHexColor('#ff5573', 0)).toBe('#ff5573');
  });

  it('returns white at amount 1', () => {
    expect(lightenHexColor('#ff5573', 1)).toBe('#ffffff');
  });

  it('mixes partway toward white at amount 0.5', () => {
    expect(lightenHexColor('#000000', 0.5)).toBe('#808080');
  });
});

describe('PULSE_CYCLE_MS', () => {
  it('is a positive duration in milliseconds', () => {
    expect(PULSE_CYCLE_MS).toBeGreaterThan(0);
  });
});
