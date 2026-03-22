# The Record — Journal Archive Section

## Context

The user has 21 monthly journal entries (newsletter-style, Dec 2023–Feb 2026) exported from Notion that need to be published as a new flagship section of the portfolio. The section is a premium, standalone mini-publication ("The Record") with an animated editorial archive index and a long-form reading experience per entry. Name is a placeholder — will change later.

Design decisions locked in:
- Archive index: numbered issue list, year-grouped, staggered fade-in, section titles visible, brightness dims on older entries
- Individual entry: editorial/magazine long-read, linear scroll, named sections as chapters
- "What is this and why am I doing this?" section: collapsed by default per entry
- Architecture: Approach B — markdown files with frontmatter + structure-aware parser (no MDX migration needed, frontmatter as escape hatch for per-entry overrides)

---

## Critical Files

- `lib/content.ts` — pattern to follow for journal library
- `lib/categories.ts` — pattern reference
- `components/Nav.tsx` — needs new nav item added
- `app/writing/page.tsx` — reference for page structure
- `app/writing/[slug]/page.tsx` — reference for individual entry rendering
- `scripts/import-wp.ts` — reference for migration script pattern
- `Notion archive/*.md` — 21 source files (input to migration script)

---

## Step 1: Migration script — `scripts/migrate-journal.ts`

Run once to convert the 21 Notion exports → `content/record/*.md`.

**Filename → metadata mapping:**

| Source filename pattern | slug | date | issue |
|---|---|---|---|
| `notion-December-23-*` | `december-23` | `2023-12-01` | 1 |
| `notion-January-24-*` | `january-24` | `2024-01-01` | 2 |
| `notion-February-24-*` | `february-24` | `2024-02-01` | 3 |
| `notion-March-24-*` | `march-24` | `2024-03-01` | 4 |
| `notion-April-24-*` | `april-24` | `2024-04-01` | 5 |
| `notion-May-24-*` | `may-24` | `2024-05-01` | 6 |
| `notion-June-July-24-*` | `june-july-24` | `2024-06-01` | 7 |
| `notion-August-24-*` | `august-24` | `2024-08-01` | 8 |
| `notion-September-24-*` | `september-24` | `2024-09-01` | 9 |
| `notion-October-24-*` | `october-24` | `2024-10-01` | 10 |
| `notion-November-24-*` | `november-24` | `2024-11-01` | 11 |
| `notion-December-24-*` | `december-24` | `2024-12-01` | 12 |
| `notion-January-25-*` | `january-25` | `2025-01-01` | 13 |
| `notion-February-25-*` | `february-25` | `2025-02-01` | 14 |
| `notion-March-25-*` | `march-25` | `2025-03-01` | 15 |
| `notion-April-25-*` | `april-25` | `2025-04-01` | 16 |
| `notion-May-June-25-*` | `may-june-25` | `2025-05-01` | 17 |
| `notion-July-August-25-*` | `july-august-25` | `2025-07-01` | 18 |
| `notion-September-25-*` | `september-25` | `2025-09-01` | 19 |
| `notion-October-and-November-25-*` | `october-november-25` | `2025-10-01` | 20 |
| `notion-December-25-January-and-February-26-*` | `december-25-january-february-26` | `2025-12-01` | 21 |

**Transformations per file:**
1. Extract slug/date/issue from filename via lookup table
2. Extract display title from the `# ` heading (first line)
3. Strip the "Links to previous months" `###` section entirely
4. Strip any base64 image data or Notion-specific HTML artifacts
5. Strip the Notion UUID suffix from any inline links
6. Write frontmatter + cleaned body to `content/record/[slug].md`

**Output frontmatter schema:**
```yaml
---
title: "March '25"
date: "2025-03-01"
slug: "march-25"
issue: 15
status: published
# optional per-entry overrides (add manually if needed):
# featured: true
# note: "string shown in archive index"
---
```

**Run with:** `npx tsx scripts/migrate-journal.ts`

---

## Step 2: Journal library — `lib/journal.ts`

Pattern mirrors `lib/content.ts` exactly.

**Types:**
```typescript
interface JournalSection {
  title: string
  body: string          // raw markdown
  collapsible: boolean  // true if heading matches "What is this"
  bulletList: boolean   // true if heading matches "Other random things" / "Other fun things"
}

interface JournalEntryMeta {
  slug: string
  title: string
  date: string
  issue: number
  status: 'draft' | 'published'
  sections: JournalSection[]  // titles only, for archive index display
}

interface JournalEntry extends JournalEntryMeta {
  sections: JournalSection[]  // full body included
  prev: { slug: string; title: string; issue: number } | null
  next: { slug: string; title: string; issue: number } | null
}
```

**Section detection rules:**
- Heading containing `"What is this"` (case-insensitive) → `collapsible: true`
- Heading matching `"Other random things"` or `"Other fun things"` (case-insensitive) → `bulletList: true`
- Everything else → standard content section

**Exports:**
- `getAllJournalEntries(): JournalEntryMeta[]` — sorted by issue number ascending (for index display, newest-first via reverse)
- `getJournalEntry(slug: string): JournalEntry | null` — includes prev/next neighbors

**Section body rendering:** Each section body string is rendered in the page using `compileMDX` from `next-mdx-remote/rsc` (already installed). No new dependencies needed.

---

## Step 3: Archive index — `app/record/page.tsx`

Server component. Implements the animated editorial index exactly as designed (see `.superpowers/brainstorm/*/archive-index-v3.html` for the visual reference).

**Structure:**
- Masthead: "THE RECORD" large wordmark + issue count + date range
- Year-grouped rows: each entry shows `issue number | title | section titles (muted)`
- Staggered CSS animation via `animation-delay` on each row (as in the mockup)
- Brightness dims on older entries via CSS class based on year
- Hover: title turns primary red, arrow appears
- Each row links to `/record/[slug]`

**Tailwind classes:** Use the site's existing tokens (`font-headline`, `font-mono`, `text-primary`, `text-secondary`, etc.) — do not write custom CSS.

---

## Step 4: Entry page — `app/record/[slug]/page.tsx`

Server component. Generates static params from `getAllJournalEntries()`.

**Layout per entry:**
1. **Header:** Issue number (monospace, muted), date, large entry title
2. **Sections loop:** For each section:
   - If `collapsible`: render a `<CollapsibleSection>` client component — shows heading, body hidden by default, toggle reveals it
   - If `bulletList`: render with distinct visual style (lighter type, more spacing)
   - Otherwise: heading as chapter title (ruled top border), body as prose
3. **Prev/Next nav:** bottom of page, links to adjacent issues

**Components needed:**
- `components/CollapsibleSection.tsx` — client component (`'use client'`), uses `useState` to toggle body visibility. Receives `title` and `children` (the rendered MDX).

**Static generation:** `generateStaticParams()` returns all slugs.

---

## Step 5: Nav — `components/Nav.tsx`

Add "RECORD" as a new top-level nav link alongside WRITING. Simple `<Link href="/record">` — no dropdown needed (single section). Place it after WRITING. Also add to mobile nav.

---

## Step 6: Add `.superpowers/` to `.gitignore`

The visual companion wrote files to `.superpowers/brainstorm/`. Add this to `.gitignore`.

---

## Verification

1. Run `npx tsx scripts/migrate-journal.ts` — confirm 21 files written to `content/record/`
2. Run `npm run dev` — visit `/record` and verify:
   - All 21 entries appear, grouped by year, with section titles
   - Stagger animation plays on load
   - Hover state works
3. Click into any entry — verify:
   - Sections render as named chapters
   - "What is this" section is collapsed by default, expands on click
   - "Other random things" section has distinct bullet styling
   - Prev/Next nav links correctly
4. Check Nav — "RECORD" appears in desktop and mobile nav
