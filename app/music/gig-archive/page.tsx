import type { Metadata } from 'next';
import * as fs from 'fs';
import * as path from 'path';
import type { GigPhoto } from '@/lib/types';
import GigArchive from '@/components/GigArchive';

export const metadata: Metadata = {
  title: 'Gig Archive — THE SIGNAL',
  description: 'Photos from gigs, festivals, and shows.',
};

const MANIFEST_PATH = path.join(process.cwd(), 'content', 'gig-archive.json');

function loadManifest(): GigPhoto[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as GigPhoto[];
  } catch {
    return [];
  }
}

export default function GigArchivePage() {
  const photos = loadManifest();

  const nonNullYears = photos.map((p) => p.year).filter((y): y is number => y !== null);
  const yearRange = nonNullYears.length > 0
    ? `${Math.min(...nonNullYears)}–${Math.max(...nonNullYears)}`
    : '—';

  const stats = {
    totalPhotos: photos.length,
    yearRange,
    uniqueArtists: new Set(photos.map((p) => p.band).filter(Boolean)).size,
    uniqueEvents: new Set(photos.map((p) => p.event).filter(Boolean)).size,
    uniqueCities: new Set(photos.map((p) => p.city).filter(Boolean)).size,
  };

  const filterOptions = {
    years: [...new Set(nonNullYears)].sort((a, b) => b - a),
    bands: [...new Set(photos.map((p) => p.band).filter((b): b is string => b !== null))].sort(),
    events: [...new Set(photos.map((p) => p.event).filter((e): e is string => e !== null))].sort(),
    cities: [...new Set(photos.map((p) => p.city).filter((c): c is string => c !== null))].sort(),
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <GigArchive photos={photos} stats={stats} filterOptions={filterOptions} />
    </main>
  );
}
