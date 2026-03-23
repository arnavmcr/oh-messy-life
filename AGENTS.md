<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project Conventions

## Architecture

- **App Router only.** All pages are in `app/`. No `pages/` directory.
- **Server Components by default.** Only add `'use client'` when you need browser APIs, `useState`, or `useEffect`.
- **Static generation.** All content pages use `generateStaticParams()` — no `getStaticPaths`.
- **No new dependencies without discussion.** `gray-matter`, `next-mdx-remote`, `next-themes` are already installed. Use these before reaching for something new.

## Styling

- **Tailwind v4 only.** Config lives in `app/globals.css` via `@theme {}` — not `tailwind.config.js`.
- **Use existing tokens.** Never hardcode colors — use `text-primary`, `bg-secondary`, `border-tertiary`, etc.
- **Effect classes.** Use `.distressed-text`, `.tape-effect`, `.drip-mask`, `.scan-line`, `.stamp-red/blue/green`, `.ink-bleed`, `.scribble-circle` from `globals.css` for the aesthetic.
- **No border radius** except `rounded-full` (`9999px`). Sharp corners everywhere else.
- **Font classes:** `font-headline` (Space Grotesk), `font-body` (Inter), `font-mono` / `font-label` (JetBrains Mono).

## Content — Writing (`content/writing/*.mdx`)

- Files are MDX with YAML frontmatter parsed by `gray-matter`.
- Use `lib/content.ts` functions: `getAllPosts()`, `getPost(slug)`, `getAllSlugs()`.
- Frontmatter fields: `title`, `date`, `category`, `subcategory`, `tags[]`, `excerpt`, `coverImage`, `status`.
- `status: draft` hides from all listings. `status: published` is default.
- Category/subcategory config lives in `lib/categories.ts` — add new categories there.
- Current top-level categories: `college`, `projects`, `mba`, `essays`, `music`. Taxonomy is evolving — check `lib/categories.ts` before assuming a category exists.

## Content — Record (`content/record/*.md`)

- Files are plain Markdown (not MDX) with YAML frontmatter.
- Use `lib/journal.ts` functions: `getAllJournalEntries()`, `getJournalEntry(slug)`.
- Frontmatter fields: `title`, `date`, `slug`, `issue` (integer, 1-based), `status`.
- Optional overrides: `featured: true`, `note: "string"`.
- **Section parsing is automatic** — the parser reads headings and classifies them:
  - Contains "What is this" → `collapsible: true` (hidden by default, user toggles)
  - Matches "Other random things" or "Other fun things" → `bulletList: true` (distinct bullet style)
  - "Links to previous months" → stripped entirely
- **Heading level is adaptive.** If an entry has no named `###` sections (only `### What is this` and `####` everything else), the parser automatically promotes `####` headings to top-level sections. Entries with named `###` sections (Highlights, Lowlights, etc.) keep `####` as subsections within those sections.
- Do NOT add `### Links to previous months` sections to new entries — they are stripped anyway.
- To override section behaviour for one entry, add frontmatter fields rather than editing the parser.

## Components

- `ArticleCard.tsx` — 3 variants: `featured`, `compact`, `default`. Use for writing content.
- `CollapsibleSection.tsx` — client component for the collapsible "What is this" section in journal entries.
- `Nav.tsx` — fixed header. Sections: WRITING (with dropdown), RECORD (link), coming-soon stubs.
- Keep components focused. One clear purpose per file.

## THE MANUSCRIPT layout (`app/writing/[slug]/page.tsx`)

- **Single centered column** — `max-w-3xl mx-auto px-8`. No sidebar.
- **Metadata block** (top, centered): STATUS badge → border-y row with CATALOG_ID (slug), TIMESTAMP (date), KEYWORDS (tags).
- **Header** (centered): large uppercase title → `h-1 w-24 bg-primary` red divider → italic excerpt (if present).
- **Cover image**: `next/image` with `fill` inside `relative aspect-video` container. `grayscale hover:grayscale-0 transition-all duration-700`. Only rendered if `post.coverImage` exists.
- **Article body**: wrapped in `<div className="article-body ...">` — scopes the `.article-body p:first-of-type::first-letter` drop cap rule in `globals.css`.
- **Floating pill**: fixed `bottom-8 left-1/2 -translate-x-1/2 rounded-full`, contains format_size + contrast (decorative, `aria-hidden`) + ARCHIVE link + share + bookmark (decorative, `aria-hidden`).
- **Drop cap**: defined in `globals.css` as `.article-body p:first-of-type::first-letter`. Fires on the first `<p>` — ensure articles open with a paragraph, not a heading.
- **MDX `h2` override**: accepts and renders the `id` prop so in-page anchor links work.

## Naming conventions (section codenames)

| Route | Codename |
|---|---|
| `/` | THE NEXUS |
| `/writing` | THE VOID |
| `/writing/[slug]` | THE MANUSCRIPT |
| `/record` | THE RECORD *(placeholder — will change)* |
| `/record/[slug]` | THE ENTRY |
| `/projects` | THE LABS |
| `/music` | THE SIGNAL |
| `/about` | THE CODEX |

## Scripts

- Run with `node_modules/.bin/tsx scripts/<name>.ts` (global `tsx` may not be available)
- Follow the pattern in `scripts/import-wp.ts`: read source, transform, write output, log `[OK]` / `[SKIP]` per file.

## Key files

| File | Purpose |
|---|---|
| `app/globals.css` | Design tokens + Tailwind v4 theme + all effect classes |
| `lib/content.ts` | MDX content loader for writing section |
| `lib/journal.ts` | MD content loader + section parser for record section |
| `lib/categories.ts` | Category/subcategory config |
| `components/Nav.tsx` | Site navigation (update when adding new routes) |
| `scripts/import-wp.ts` | Reference implementation for migration scripts |
| `ROADMAP.md` | Canonical product roadmap — update when milestones complete |

## Do not

- Do not add `console.log` to production page components.
- Do not use `any` types without a comment explaining why.
- Do not add client-side data fetching — all content is statically loaded at build time.
- Do not create new layout files unless adding a genuinely new shell.
- Do not use inline styles when a Tailwind class exists.
