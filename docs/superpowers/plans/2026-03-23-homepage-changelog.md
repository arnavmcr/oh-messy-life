# Homepage Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a terminal-feed changelog section to the homepage, below the hero, showing the 10 most recent site events auto-derived from content files plus manually authored site-update entries.

**Architecture:** A pure build-time data function (`lib/changelog.ts`) merges writing posts, journal entries, and a manual JSON file, sorts by date descending, and slices to a limit. A Server Component (`components/Changelog.tsx`) renders the feed with no client JS. The homepage wires it in between hero and content grid.

**Tech Stack:** Next.js 16 App Router, TypeScript 5.9, Tailwind v4, no new dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `content/changelog.json` | Manual SITE-type entries (seed data) |
| Create | `lib/changelog.ts` | Merge + sort + slice changelog data |
| Create | `components/Changelog.tsx` | Terminal-feed Server Component |
| Modify | `app/page.tsx` | Import and render `<Changelog />` below hero |

---

## Notes for implementer

- **No test framework** is installed. Use `node_modules/.bin/tsc --noEmit` as the type-check step (replaces "run tests"). Final verification is `node_modules/.bin/next build`.
- **`getAllJournalEntries()`** sorts by `issue` number ascending — the changelog merges all three sources and re-sorts by ISO date descending.
- **Token check:** `text-secondary` = `#3800c2` (dark purple, too dark on zinc-900). Use the hardcoded `text-[#7b5cf0]` for RECORD and `text-[#00c48c]` for SITE — these are intentional on-dark-bg terminal colors with no matching token.
- **`group` class** must be on the `<Link>` wrapper for `group-hover:text-primary` to work on the arrow.
- All content is at `/Users/scaler/Desktop/CC Projects/Portfolio: Oh Messy life/`.

---

## Task 1: Seed the manual changelog file

**Files:**
- Create: `content/changelog.json`

- [ ] **Step 1.1: Create the file**

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

Save to `content/changelog.json`.

- [ ] **Step 1.2: Commit**

```bash
git add content/changelog.json
git commit -m "content: seed changelog.json with initial SITE entry"
```

---

## Task 2: Data layer — `lib/changelog.ts`

**Files:**
- Create: `lib/changelog.ts`

- [ ] **Step 2.1: Write the type and function stub**

Create `lib/changelog.ts` with this content:

```ts
import { getAllPosts } from './content';
import { getAllJournalEntries } from './journal';
import changelogJson from '../content/changelog.json';

export type ChangelogEntry = {
  date: string;
  type: 'WRITING' | 'RECORD' | 'SITE';
  description: string;
  href: string;
};

export function getChangelogEntries(limit = 10): ChangelogEntry[] {
  const writing: ChangelogEntry[] = getAllPosts().map((post) => ({
    date: post.date,
    type: 'WRITING',
    description: post.title,
    href: `/writing/${post.slug}`,
  }));

  const record: ChangelogEntry[] = getAllJournalEntries().map((entry) => ({
    date: entry.date,
    type: 'RECORD',
    description: entry.title,
    href: `/record/${entry.slug}`,
  }));

  const site: ChangelogEntry[] = (changelogJson as ChangelogEntry[]).map((e) => ({
    date: e.date,
    type: 'SITE',
    description: e.description,
    href: e.href,
  }));

  return [...writing, ...record, ...site]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
```

- [ ] **Step 2.2: Run type check**

```bash
node_modules/.bin/tsc --noEmit
```

Expected: no errors. If you see `cannot find module '../content/changelog.json'`, verify `resolveJsonModule: true` is in `tsconfig.json` (it is).

- [ ] **Step 2.3: Commit**

```bash
git add lib/changelog.ts
git commit -m "feat(changelog): add getChangelogEntries data function"
```

---

## Task 3: Component — `components/Changelog.tsx`

**Files:**
- Create: `components/Changelog.tsx`

- [ ] **Step 3.1: Create the component**

```tsx
import Link from 'next/link';
import { getChangelogEntries } from '@/lib/changelog';
import type { ChangelogEntry } from '@/lib/changelog';

function typeLabel(type: ChangelogEntry['type']) {
  if (type === 'WRITING') return <span className="font-mono text-[9px] font-bold w-[52px] flex-shrink-0 text-primary">{type}</span>;
  if (type === 'RECORD')  return <span className="font-mono text-[9px] font-bold w-[52px] flex-shrink-0 text-[#7b5cf0]">{type}</span>;
  return                          <span className="font-mono text-[9px] font-bold w-[52px] flex-shrink-0 text-[#00c48c]">{type}</span>;
}

export default function Changelog() {
  const entries = getChangelogEntries(10);

  return (
    <section className="bg-zinc-900 dark:bg-black border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-8 md:px-16 py-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-white font-bold">
            CHANGELOG // SITE_LOG
          </span>
          <span className="font-mono text-[9px] text-primary animate-pulse" aria-hidden>
            ● LIVE
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-0">
          {entries.map((entry, i) => (
            <Link
              key={entry.href + entry.date}
              href={entry.href}
              className="group flex items-center gap-3 py-2.5 px-1 border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <span className="font-mono text-[9px] text-white/20 flex-shrink-0">&gt;</span>
              <span className="font-mono text-[9px] text-zinc-500 w-[72px] flex-shrink-0">{entry.date}</span>
              {typeLabel(entry.type)}
              <span className="font-mono text-[10px] text-zinc-300 flex-grow truncate">{entry.description}</span>
              <span className="font-mono text-zinc-600 group-hover:text-primary transition-colors flex-shrink-0">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3.2: Run type check**

```bash
node_modules/.bin/tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add components/Changelog.tsx
git commit -m "feat(changelog): add Changelog terminal-feed component"
```

---

## Task 4: Wire into homepage

**Files:**
- Modify: `app/page.tsx` — add import + render between hero close tag and content grid div

- [ ] **Step 4.1: Add import**

At the top of `app/page.tsx`, add after the existing imports:

```tsx
import Changelog from '@/components/Changelog';
```

- [ ] **Step 4.2: Insert component**

In `app/page.tsx`, find the comment `{/* ── Content Sections ─────` and the `<div className="max-w-[1600px] mx-auto border-x ...">` that follows it. Insert `<Changelog />` between the closing `</section>` of the hero and that div:

```tsx
      </section>

      {/* ── Changelog ──────────────────────────────────────────────── */}
      <Changelog />

      {/* ── Content Sections ────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto border-x border-black/5 dark:border-white/5 bg-white dark:bg-black">
```

- [ ] **Step 4.3: Run type check**

```bash
node_modules/.bin/tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(changelog): wire Changelog into homepage below hero"
```

---

## Task 5: Final verification

- [ ] **Step 5.1: Run production build**

```bash
node_modules/.bin/next build
```

Expected: `✓ Generating static pages (N/N)` — all pages pass, no type errors. TypeScript should report `Finished TypeScript` without errors.

- [ ] **Step 5.2: Spot check the output**

Confirm `.next/server/app/page.html` (or similar) contains the string `CHANGELOG // SITE_LOG`.

```bash
grep -r "CHANGELOG" .next/server/app/ 2>/dev/null | head -3
```

Expected: at least one match showing the string was rendered into the static HTML.

- [ ] **Step 5.3: Commit if anything was adjusted**

If you made any fixes during build verification, commit them:

```bash
git add -p
git commit -m "fix(changelog): address build issues"
```
