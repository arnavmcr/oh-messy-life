# Homepage Changelog — Design Spec

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

A terminal-feed changelog component on the homepage, positioned immediately below the hero section and above the writing/labs grid. Shows the 10 most recent site events (new articles, new record entries, manual site updates) in a dark console aesthetic that extends the existing CONSOLE_LOG visual language.

---

## Data Layer

**File:** `lib/changelog.ts`

Exports a single function:

```ts
getChangelogEntries(limit?: number): ChangelogEntry[]
```

**`ChangelogEntry` type:**

```ts
type ChangelogEntry = {
  date: string       // ISO date string, e.g. "2026-03-23"
  type: 'WRITING' | 'RECORD' | 'SITE'
  description: string
  href: string
}
```

**Sources (merged at build time, sorted descending by date, sliced to `limit` which defaults to 10):**

1. `getAllPosts()` from `lib/content.ts` — each published post maps to `type: 'WRITING'`, `description: post.title`, `href: /writing/${post.slug}`
2. `getAllJournalEntries()` from `lib/journal.ts` — each entry maps to `type: 'RECORD'`, `description: entry.title`, `href: /record/${entry.slug}`
3. `content/changelog.json` — manually authored entries for site-level changes, `type: 'SITE'`

No client-side fetching. Pure build-time static function.

---

## Manual Changelog File

**File:** `content/changelog.json`

```json
[
  {
    "date": "2026-03-23",
    "type": "SITE",
    "description": "Redesigned article reading page (THE MANUSCRIPT)",
    "href": "/writing"
  }
]
```

New site-level changes are added here manually. Article and record entries are auto-derived and never need manual entries.

---

## Component

**File:** `components/Changelog.tsx`

Server Component — no `'use client'`. Calls `getChangelogEntries(10)` at build time.

**Structure:**

```
<section> — dark bg (bg-zinc-900 dark:bg-black), border-b
  <div> — max-w-[1600px] mx-auto px-8 md:px-16 py-12
    [header row]
      left: "CHANGELOG // SITE_LOG" — font-mono text-[9px] uppercase tracking-widest text-white font-bold
      right: "● LIVE" — font-mono text-[9px] text-primary animate-pulse (decorative)
    [divider] — border-b border-white/10 mb-4
    [rows — 10 entries]
      each row is a <Link href={entry.href}>
        ">" prompt — text-white/20
        date — font-mono text-[9px] text-zinc-500 w-[72px]
        type label — font-mono text-[9px] font-bold w-[52px]
          WRITING → text-primary (red)
          RECORD  → text-[#7b5cf0] (purple)
          SITE    → text-[#00c48c] (green)
        description — font-mono text-[10px] text-zinc-300 flex-grow
        "↗" — text-zinc-600 group-hover:text-primary transition-colors
      row hover: bg-white/5
```

No "view all" link.

---

## Homepage Integration

**File:** `app/page.tsx`

Import `Changelog` and insert as a new `<section>` between the closing `</section>` of the hero and the opening `<div>` of the content grid:

```tsx
{/* ── Hero ─── */}
<section>...</section>

{/* ── Changelog ─── */}
<Changelog />

{/* ── Content Sections ─── */}
<div className="max-w-[1600px] mx-auto ...">
```

---

## Constraints

- No new dependencies
- No client-side JS
- No "view all" link (deferred to future `/changelog` route)
- All styling uses existing Tailwind tokens from `globals.css`
- No `console.log` in production components
- No `any` types
