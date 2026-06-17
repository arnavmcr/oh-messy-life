'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';

const NAV_LINKS = [
  { href: '/writing',  label: 'writing', cls: 'coral' },
  { href: '/record',   label: 'record',  cls: 'violet' },
  { href: '/music',    label: 'music',   cls: 'kelp' },
  { href: '/projects', label: 'labs',    cls: 'wine' },
] as const;

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="oh messy life" className="nav-logo" />
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(({ href, label, cls }) => (
            <Link key={href} href={href} className={`nav-link ${cls}`}>{label}</Link>
          ))}
        </div>
      </div>

      {/* Right side: theme toggle + mobile hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DarkModeToggle />
        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="toggle menu"
          aria-expanded={menuOpen}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono-stack)',
            fontSize: '12px',
            letterSpacing: '0.08em',
          }}
        >
          menu
        </button>
      </div>

      {/* Backdrop — tapping closes the drawer */}
      <div
        className={`nav-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out drawer — always rendered so CSS transition plays on close */}
      <div className={`nav-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="nav-drawer-head">
          <span style={{ fontFamily: 'var(--font-mono-stack)', fontSize: '11px', opacity: 0.5, letterSpacing: '0.1em' }}>
            oh messy life
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="close menu"
            className="nav-drawer-close"
          >
            ✕
          </button>
        </div>

        <nav className="nav-drawer-links">
          {NAV_LINKS.map(({ href, label, cls }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${cls}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </nav>
  );
}
