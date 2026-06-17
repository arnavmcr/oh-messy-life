export const GENRE_MAP: Record<string, string> = {
  // Pop / International
  'Coldplay': 'Pop',
  'Ed Sheeran': 'Pop',
  'Dua Lipa': 'Pop',
  'Maroon 5': 'Pop',
  'Bryan Adams': 'Pop',
  'Enrique Iglesias': 'Pop',
  'John Mayer': 'Pop',
  'Akon': 'Pop',
  'Cigarettes After Sex': 'Pop',
  'Travis Scott': 'Pop',

  // Festival
  'Lollapalooza 2024': 'Festival',
  'Lollapalooza 2025': 'Festival',
  'Lollapalooza 2026': 'Festival',
  'BMW Joytown': 'Festival',
  'Joytown': 'Festival',
  'Sunburn': 'Festival',
  'Circus Festival': 'Festival',
  'Rolling Loud': 'Festival',

  // Electronic
  'Keinemusik': 'Electronic',
  'Ben Bohmer': 'Electronic',
  'Fisher': 'Electronic',
  'DGTL 2025': 'Electronic',
  'Chainsmokers': 'Electronic',
  'Zamna': 'Electronic',

  // Desi / Bollywood
  'Diljit Dosanjh': 'Desi',
  'Arijit Singh': 'Desi',
  'Karan Aujla': 'Desi',
  'AP Dhillon': 'Desi',
  'Rishab Rikhiram Sharma': 'Desi',
  'Anoushka Shankar': 'Desi',

  // Everything else falls through to 'Other' at runtime
};

export const GENRE_COLORS: Record<string, { fill: string; stroke: string }> = {
  Pop:        { fill: 'var(--coral)',  stroke: 'var(--coral)' },
  Festival:   { fill: 'var(--violet)', stroke: 'var(--violet)' },
  Electronic: { fill: 'var(--kelp)',   stroke: 'var(--kelp)' },
  Desi:       { fill: 'var(--wine)',   stroke: 'var(--wine)' },
  Other:      { fill: 'var(--ink)',    stroke: 'var(--ink)' },
};

export function getGenre(event: string): string {
  return GENRE_MAP[event] ?? 'Other';
}

export function getGenreColor(genre: string): { fill: string; stroke: string } {
  return GENRE_COLORS[genre] ?? GENRE_COLORS.Other;
}
