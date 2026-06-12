'use client';

import { useState } from 'react';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="oh messy life" className="nav-logo" />
        </Link>
        <div className="nav-links">
          <Link href="/writing" className="nav-link coral">writing</Link>
          <Link href="/record"  className="nav-link violet">record</Link>
          <Link href="/music"   className="nav-link kelp">music</Link>
          <Link href="/projects" className="nav-link wine">labs</Link>
        </div>
      </div>

      {/* Right side: theme toggle + mobile hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DarkModeToggle />
        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="toggle menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono-stack)',
            fontSize: '12px',
            letterSpacing: '0.08em',
          }}
        >
          {menuOpen ? 'close' : 'menu'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--paper)',
            borderBottom: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 50,
            padding: '16px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {[
            { href: '/writing',  label: 'writing', cls: 'coral' },
            { href: '/record',   label: 'record',  cls: 'violet' },
            { href: '/music',    label: 'music',   cls: 'kelp' },
            { href: '/projects', label: 'labs',    cls: 'wine' },
          ].map(({ href, label, cls }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${cls}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: '16px' }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
