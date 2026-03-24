'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import { CATEGORY_MAP } from '@/lib/categories';

const accentHover: Record<string, string> = {
  primary: 'hover:text-primary',
  secondary: 'hover:text-secondary',
  tertiary: 'hover:text-tertiary',
};

const comingSoon = [
  { href: '/projects', label: 'LABS' },
  { href: '/music', label: 'SIGNAL' },
];

export default function Nav() {
  const [writingOpen, setWritingOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-sm flex justify-between items-center w-full px-4 py-3 border-b border-black/10 dark:border-white/10">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex flex-col">
          <span className="text-sm font-black italic tracking-tighter text-black dark:text-white font-headline leading-none">
            OH MESSY LIFE
          </span>
          <span className="text-[8px] font-mono opacity-40 uppercase">Root_Access_Granted</span>
        </Link>

        <div className="h-8 w-[1px] bg-black/10 dark:bg-white/10 mx-2" />

        {/* Desktop nav */}
        <div className="hidden md:flex gap-6 items-center font-label uppercase tracking-widest text-[10px] font-bold">
          {/* WRITING with dropdown */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (closeTimer.current) clearTimeout(closeTimer.current);
              setDesktopDropdownOpen(true);
            }}
            onMouseLeave={() => {
              closeTimer.current = setTimeout(() => setDesktopDropdownOpen(false), 150);
            }}
          >
            <Link
              href="/writing"
              className="hover:text-primary transition-colors"
            >
              WRITING
            </Link>
            {/* Dropdown panel */}
            {desktopDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 min-w-[200px] z-50 shadow-lg">
              {Object.entries(CATEGORY_MAP).map(([catKey, cat]) => (
                <div key={catKey} className="border-b border-black/5 dark:border-white/5 last:border-0">
                  <Link
                    href={`/writing/${catKey}`}
                    className="block px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:text-secondary hover:bg-secondary/5 transition-colors border-l-2 border-secondary"
                  >
                    {cat.label}
                  </Link>
                  <div className="pl-2">
                    {Object.entries(cat.subcategories).map(([subKey, sub]) => (
                      <Link
                        key={subKey}
                        href={`/writing/${catKey}/${subKey}`}
                        className={`block px-4 py-1.5 font-mono text-[9px] tracking-widest uppercase opacity-70 ${accentHover[sub.accentColor ?? 'primary']} hover:opacity-100 transition-all`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          <Link href="/record" className="hover:text-primary transition-colors">
            RECORD
          </Link>

          {comingSoon.map(({ label }) => (
            <span key={label} className="opacity-30 cursor-not-allowed">{label}</span>
          ))}
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setWritingOpen((v) => !v)}
            className="font-mono text-[10px] tracking-widest uppercase font-bold hover:text-primary transition-colors"
          >
            WRITING {writingOpen ? '▲' : '▼'}
          </button>
          <Link href="/record" className="font-mono text-[10px] tracking-widest uppercase font-bold hover:text-primary transition-colors">
            RECORD
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-label text-[9px] opacity-40 hidden sm:block uppercase font-bold tracking-tighter">
          BUILD: 0.1.0_ALPHA
        </span>
        <DarkModeToggle />
        <span className="material-symbols-outlined text-black dark:text-white p-1 hover:text-primary transition-colors text-lg cursor-pointer">
          terminal
        </span>
      </div>

      {/* Mobile dropdown */}
      {writingOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-black border-b border-black/10 dark:border-white/10 md:hidden z-50">
          <div className="px-4 py-2">
            <Link
              href="/writing"
              className="block py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:text-primary transition-colors"
              onClick={() => setWritingOpen(false)}
            >
              ALL WRITING
            </Link>
            {Object.entries(CATEGORY_MAP).map(([catKey, cat]) => (
              <div key={catKey} className="mb-2">
                <Link
                  href={`/writing/${catKey}`}
                  className="block py-1.5 font-mono text-[10px] tracking-widest uppercase font-bold text-secondary border-l-2 border-secondary pl-3"
                  onClick={() => setWritingOpen(false)}
                >
                  {cat.label}
                </Link>
                <div className="pl-5">
                  {Object.entries(cat.subcategories).map(([subKey, sub]) => (
                    <Link
                      key={subKey}
                      href={`/writing/${catKey}/${subKey}`}
                      className={`block py-1 font-mono text-[9px] tracking-widest uppercase opacity-60 ${accentHover[sub.accentColor ?? 'primary']} hover:opacity-100 transition-all`}
                      onClick={() => setWritingOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
