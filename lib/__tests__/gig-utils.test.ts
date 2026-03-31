import { describe, it, expect } from 'vitest';
import { parseGigTitle } from '../gig-utils';

describe('parseGigTitle', () => {
  it('parses a well-formed title', () => {
    const result = parseGigTitle('OX7GEN, Nh7 Weekender, Pune, November 2024');
    expect(result).toEqual({
      band: 'OX7GEN',
      event: 'Nh7 Weekender',
      city: 'Pune',
      month: 'November',
      year: 2024,
    });
  });

  it('returns all null fields for an unparseable title', () => {
    const result = parseGigTitle('some random photo');
    expect(result).toEqual({
      band: null,
      event: null,
      city: null,
      month: null,
      year: null,
    });
  });

  it('returns null fields when monthYear segment has no space', () => {
    const result = parseGigTitle('Band, Event, City, November2024');
    expect(result).toEqual({
      band: null,
      event: null,
      city: null,
      month: null,
      year: null,
    });
  });

  it('returns null fields when year is not a number', () => {
    const result = parseGigTitle('Band, Event, City, November XXXX');
    expect(result).toEqual({
      band: null,
      event: null,
      city: null,
      month: null,
      year: null,
    });
  });
});
