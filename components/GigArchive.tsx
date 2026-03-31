'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { GigPhoto } from '@/lib/types';
import GigLightbox from './GigLightbox';

interface Props {
  photos: GigPhoto[];
  stats: {
    totalPhotos: number;
    yearRange: string;
    uniqueArtists: number;
    uniqueEvents: number;
    uniqueCities: number;
  };
  filterOptions: {
    years: number[];
    bands: string[];
    events: string[];
    cities: string[];
  };
}

interface ActiveFilters {
  years: number[];
  bands: string[];
  events: string[];
  cities: string[];
}

export default function GigArchive({ photos, stats, filterOptions }: Props) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    years: [], bands: [], events: [], cities: [],
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredPhotos = photos.filter((p) => {
    if (activeFilters.years.length > 0 && (p.year === null || !activeFilters.years.includes(p.year))) return false;
    if (activeFilters.bands.length > 0 && (p.band === null || !activeFilters.bands.includes(p.band))) return false;
    if (activeFilters.events.length > 0 && (p.event === null || !activeFilters.events.includes(p.event))) return false;
    if (activeFilters.cities.length > 0 && (p.city === null || !activeFilters.cities.includes(p.city))) return false;
    return true;
  });

  function toggleFilter<T>(key: keyof ActiveFilters, value: T) {
    setActiveFilters((prev) => {
      const current = prev[key] as T[];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  }

  function clearAllFilters() {
    setActiveFilters({ years: [], bands: [], events: [], cities: [] });
  }

  const hasActiveFilters = Object.values(activeFilters).some((arr) => arr.length > 0);

  // Stats row
  const statItems = [
    { label: 'PHOTOS', value: stats.totalPhotos },
    { label: 'YEARS', value: stats.yearRange },
    { label: 'ARTISTS', value: stats.uniqueArtists },
    { label: 'EVENTS', value: stats.uniqueEvents },
    { label: 'CITIES', value: stats.uniqueCities },
  ];

  // Filter sections config
  const filterSections = [
    { key: 'years' as const, label: 'YEAR', options: filterOptions.years },
    { key: 'bands' as const, label: 'ARTIST', options: filterOptions.bands },
    { key: 'events' as const, label: 'EVENT', options: filterOptions.events },
    { key: 'cities' as const, label: 'CITY', options: filterOptions.cities },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">
          THE SIGNAL › GIG ARCHIVE
        </div>
        <h1 className="font-headline text-5xl font-black uppercase">GIG ARCHIVE</h1>
        <div className="h-1 w-24 bg-primary my-4" />
        <p className="font-body italic opacity-70">Live shows, documented.</p>
      </div>

      {/* Stats row */}
      {stats.totalPhotos > 0 && (
        <div className="border-y border-black/10 dark:border-white/10 py-4 flex gap-8 mb-8">
          {statItems.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="font-mono font-bold text-sm">{value}</span>
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {filterOptions.years.length > 0 && (
        <div className="flex flex-wrap gap-6 mb-6">
          {filterSections.map(({ key, label, options }) => (
            <div key={key} className="flex flex-col gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">{label}</span>
              <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                  const isActive = (activeFilters[key] as typeof opt[]).includes(opt);
                  return (
                    <button
                      key={String(opt)}
                      onClick={() => toggleFilter(key, opt)}
                      className={`border font-mono text-[9px] uppercase tracking-widest px-2 py-1 transition-colors ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-black/20 dark:border-white/20 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {String(opt)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {filterSections.flatMap(({ key, options }) =>
            (activeFilters[key] as typeof options[number][]).map((val) => (
              <button
                key={`${key}-${val}`}
                onClick={() => toggleFilter(key, val)}
                className="border border-primary text-primary font-mono text-[9px] uppercase tracking-widest px-2 py-1 flex items-center gap-1 hover:bg-primary/5 transition-colors"
              >
                {String(val)} <span aria-hidden>×</span>
              </button>
            ))
          )}
          <button
            onClick={clearAllFilters}
            className="font-mono text-[9px] uppercase tracking-widest opacity-50 hover:opacity-100 underline transition-opacity"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Photo count */}
      <div className="font-mono text-[9px] uppercase tracking-widest opacity-50 mb-3">
        {filteredPhotos.length} photos
      </div>

      {/* Empty state — no photos synced yet */}
      {photos.length === 0 && (
        <div className="border border-black/10 dark:border-white/10 p-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">No photos yet.</p>
        </div>
      )}

      {/* Empty filter state */}
      {photos.length > 0 && filteredPhotos.length === 0 && (
        <div className="border border-black/10 dark:border-white/10 p-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-3">
            No photos match the selected filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="font-mono text-[9px] uppercase tracking-widest text-primary underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredPhotos.length > 0 && (
        <div className="grid grid-cols-4 gap-[3px]">
          {filteredPhotos.map((photo, idx) => {
            const overlay = [photo.band, photo.event, photo.city, photo.month && photo.year ? `${photo.month} ${photo.year}` : null]
              .filter(Boolean)
              .join(' · ');
            const displayOverlay = overlay || photo.title;

            return (
              <button
                key={photo.id}
                className="relative overflow-hidden"
                style={{ aspectRatio: '1' }}
                onClick={() => setLightboxIndex(idx)}
                aria-label={photo.title}
              >
                <Image
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  fill
                  sizes="25vw"
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="w-full bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="font-mono text-[8px] text-white uppercase tracking-widest line-clamp-2">
                      {displayOverlay}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GigLightbox
          photos={filteredPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
