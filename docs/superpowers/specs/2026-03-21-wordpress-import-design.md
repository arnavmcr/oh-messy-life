# WordPress Import + Category Navigation — Design Spec

**Date:** 2026-03-21
**Project:** Oh Messy Life portfolio
**Status:** Approved

---

## Overview

Import ~60 WordPress posts (already exported as `.md` files in `wp archive/posts/`) into the site's MDX content system. Add a two-level category hierarchy driven by a single config file. Update the Nav with a hover/tap dropdown. Add category archive pages with per-category personality (accent color, tagline, post-it annotations).

All WordPress content is from the author's undergraduate years and is nested under a single top-level `college` category.

---

## 1. Content Layer

### MDX Frontmatter Schema (extended)

The existing `PostMeta` interface in `lib/content.ts` gains three optional fields:

```ts
export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];           // leaf-level labels (album-reviews, gig-reviews, etc.)
  category?: string;         // top-level route segment (e.g. "college")
  subcategory?: string;      // second-level route segment (e.g. "music")
  coverImage?: string;       // absolute public path e.g. /images/[slug]/cover.jpg
  status?: 'draft' | 'published';
}
```

The existing `getAllPosts()` and `getPost()` functions in `lib/content.ts` must be updated to read and pass through `category`, `subcategory`, and `coverImage` from frontmatter. These are currently hardcoded to read only `title`, `date`, `excerpt`, `tags`, and `status`.

Example output frontmatter:

```yaml
title: "A Head Full of Dreams - Album Review"
date: 2016-05-18
category: college
subcategory: music
tags: [album-reviews]
excerpt: "A review of Coldplay's 2015 album..."
coverImage: /images/a-head-full-of-dreams-album-review/ahfod.gif
status: published
```

### File Organization

All posts remain flat in `content/writing/*.mdx`. No folder nesting. Category hierarchy lives in frontmatter and `lib/categories.ts`, not in the filesystem.

### Non-ASCII Slugs

Two WP posts have non-ASCII directory names (`दोस्रो`, `གཅིག`). The migration script must transliterate these to ASCII slugs (`dastro`, `gcig`) for use as filenames and URL segments. The original title is preserved in the frontmatter `title` field.

### Migration Script

**Location:** `scripts/import-wp.ts`
**Run:** `npx tsx scripts/import-wp.ts` (one-time; requires `tsx` which handles path aliases)

The script:

1. Reads posts from two glob patterns separately:
   - `wp archive/posts/*/index.md` — regular posts
   - `wp archive/posts/_drafts/*/index.md` — drafts (tagged `status: draft`)
2. Skips posts with no `categories` field or whose title matches the WP placeholder pattern (case-insensitive match against `"blog post title"`) — logs skipped slugs to console
3. Maps WP `categories[]` array → `{category, subcategory, tags}` using the mapping rules in Section 2
   - The WP `college` category is treated identically to `writing` — stripped as a catch-all, carries no routing signal
   - If no mapping is found after stripping catch-alls, logs a warning and sets `subcategory: undefined` (post appears on `/writing` and `/writing/college` but no subcategory archive)
4. Strips the WP `writing` and `college` catch-all categories
5. Generates `excerpt` from the first non-empty paragraph if not present
6. Cleans content:
   - Strips `<!--more-->` tags
   - `[youtube url]` → `[Watch on YouTube](url)`
   - `[vimeo id]` → `[Watch on Vimeo](https://vimeo.com/id)`
   - `[gallery ids="..."]` → `_Gallery — images available below._`
7. Copies `wp archive/posts/[slug]/images/*` → `public/images/[slug]/`
8. Rewrites image references from `images/filename` → `/images/[slug]/filename`
9. Writes output to `content/writing/[slug].mdx`
10. Posts in `_drafts/` are imported with `status: draft` so they can be revisited; they will not appear in any public archive since `getAllPosts()` filters drafts

---

## 2. Category Config

**Location:** `lib/categories.ts`
**Single source of truth** for routes, nav, static params, and page personality.

```ts
export type AccentColor = 'primary' | 'secondary' | 'tertiary';

export interface PostItNote {
  text: string;
  rotation: string; // CSS degrees e.g. "-2deg"
}

export interface SubcategoryConfig {
  label: string;
  accentColor?: AccentColor;
  tagline?: string;
  postIts?: PostItNote[];
  tags?: string[];           // leaf-level tags that belong to this subcategory
}

export interface CategoryConfig {
  label: string;
  accentColor?: AccentColor;
  tagline?: string;
  postIts?: PostItNote[];
  subcategories: Record<string, SubcategoryConfig>;
}

export const CATEGORY_MAP: Record<string, CategoryConfig> = {
  college: {
    label: 'College',
    accentColor: 'secondary',
    tagline: 'Writing from undergrad. Unpolished. Kept anyway.',
    postIts: [
      { text: '2014–2019', rotation: '-2deg' },
      { text: 'Bombay → everywhere', rotation: '1.5deg' },
    ],
    subcategories: {
      music: {
        label: 'Music',
        accentColor: 'primary',
        tagline: 'Gig reviews, album essays, scene writing.',
        postIts: [{ text: 'Chordsunited era', rotation: '2deg' }],
        tags: ['album-reviews', 'gig-reviews', 'editorials'],
      },
      travel: {
        label: 'Travel',
        accentColor: 'tertiary',
        tagline: 'Places I went. Notes I kept.',
        postIts: [{ text: 'iPod camera quality', rotation: '-1.5deg' }],
        tags: ['italy', 'meghalaya', 'sikkim', 'india', 'usa'],
      },
      politics: {
        label: 'Politics',
        accentColor: 'primary',
        tagline: 'Undergraduate opinions. Handle with care.',
        postIts: [],
        tags: [],
      },
      economics: {
        label: 'Economics',
        accentColor: 'secondary',
        tagline: 'Papers and analysis from my economics degree.',
        postIts: [{ text: "St. Xavier's College", rotation: '1deg' }],
        tags: ['papers'],
      },
      sports: {
        label: 'Sports',
        accentColor: 'tertiary',
        tagline: '',
        postIts: [],
        tags: [],
      },
      society: {
        label: 'Society',
        accentColor: 'primary',
        tagline: '',
        postIts: [],
        tags: [],
      },
      film: {
        label: 'Film',
        accentColor: 'tertiary',
        tagline: '',
        postIts: [],
        tags: [],
      },
      events: {
        label: 'Events',
        accentColor: 'secondary',
        tagline: '',
        postIts: [],
        tags: [],
      },
    },
  },
};
```

**WP category → frontmatter mapping rules:**

| WP categories include | → category | → subcategory | → tags |
|---|---|---|---|
| `music` + `album-reviews` | college | music | [album-reviews] |
| `music` + `gig-reviews` | college | music | [gig-reviews] |
| `gig-reviews` only | college | music | [gig-reviews] |
| `music` + `editorials` | college | music | [editorials] |
| `music` only | college | music | [] |
| `travel` + location | college | travel | [location] |
| `travel` only | college | travel | [] |
| `politics` | college | politics | [] |
| `economics` + `papers` | college | economics | [papers] |
| `economics` only | college | economics | [] |
| `papers` only | college | economics | [papers] |
| `papers` + `sociology` | college | economics | [papers] |
| `sports` | college | sports | [] |
| `society` | college | society | [] |
| `film` | college | film | [] |
| `events` | college | events | [] |
| `experiences` | college | events | [] |
| `writing` only | college | (none) | [] |
| unmapped | college | (none) | [] — log warning |

---

## 3. Routing

### Route Collision Resolution

`app/writing/[slug]/page.tsx` and a dynamic `[category]` at the same level would create an unresolvable routing conflict in Next.js App Router. **Resolution:** `college` is the only top-level category for now, so it is implemented as a **static route segment** rather than a dynamic one. This eliminates the collision entirely — Next.js always prioritizes static segments over dynamic ones.

```
app/writing/
  page.tsx                        # /writing — all posts
  [slug]/
    page.tsx                      # /writing/some-post (dynamic)
  college/
    page.tsx                      # /writing/college (static — no collision)
    [subcategory]/
      page.tsx                    # /writing/college/music (dynamic, safe)
```

If a second top-level category is added in the future, it gets its own static directory (e.g. `app/writing/personal/`). A `[category]` dynamic segment is introduced only if the number of top-level categories makes static directories impractical.

### Content Utility Updates

`lib/content.ts` gets two new filter functions:

```ts
export function getPostsByCategory(category: string): PostMeta[]
export function getPostsBySubcategory(category: string, subcategory: string): PostMeta[]
```

Both return published posts sorted by date descending, consistent with `getAllPosts()`.

`app/writing/college/[subcategory]/page.tsx` uses `generateStaticParams()` returning the subcategory keys from `CATEGORY_MAP.college.subcategories`.

---

## 4. Archive Pages

Category and subcategory archive pages share the same layout structure as the existing `/writing` page with these additions:

**Breadcrumb:** `WRITING / COLLEGE / MUSIC` — `font-mono`, small, above the page title. Each segment is a link. Breadcrumbs on single post pages (`[slug]`) are out of scope for this feature.

**Personality zone** (below header, above grid):
- `tagline` rendered in italic headline font if present
- `postIts` rendered as sticky note elements using the existing `scribble-circle` motif, with their configured rotation
- `accentColor` controls: left border color on the header, heading highlight color, pill/badge accent
- Fallback: pages with no `tagline` or `postIts` render the standard header with default `primary` accent

**Subcategory pills** (on `/writing/college` only): horizontal row of pills linking to each subcategory. Styled with the category's `accentColor`.

**Post count badge** — same "N ENTRIES" treatment as existing `/writing` page.

---

## 5. Nav Dropdown

`Nav.tsx` replaces the static `navLinks` array with a dropdown driven by `CATEGORY_MAP`.

**Desktop:** Hover group on the WRITING link reveals a dropdown panel. WRITING link itself still navigates to `/writing`. The panel shows top-level categories (College), and each category shows its subcategories inline.

**Mobile:** Tap WRITING to toggle the dropdown open/closed via `useState`.

**Structure:**
```
WRITING ──────────────────────────────────┐
                                          │  COLLEGE → Music · Travel · Politics
                                          │            Economics · Sports · Society
                                          │            Film · Events
                                          └──────────────────────────────────────
```

Clicking **WRITING** → `/writing`
Clicking **College** → `/writing/college`
Clicking a subcategory (e.g. Music) → `/writing/college/music`

Styled consistently with existing nav: `font-mono`, uppercase, sharp borders, no rounded corners, hover accent uses the category's configured `accentColor`.

---

## 6. Image Handling

| Source | Destination |
|---|---|
| `wp archive/posts/[slug]/images/foo.jpg` | `public/images/[slug]/foo.jpg` |
| MDX ref `images/foo.jpg` | `/images/[slug]/foo.jpg` |
| Frontmatter `coverImage: foo.jpg` | `/images/[slug]/foo.jpg` (rewritten to absolute public path) |

The `ArticleCard` component gets an optional `coverImage` prop. The `featured` variant only renders a cover image when the prop is present, using Next.js `<Image>` with `fill` inside a fixed-aspect-ratio container. The `compact` and `default` variants are unaffected.

---

## 7. What's Out of Scope

- The `/music` route (THE SIGNAL, Phase 2) — music writing lives under `/writing/college/music` for now
- The `/projects` and `/about` routes (Phase 2)
- WordPress pages (`about`, `contact`, `writing`, `travel`, `film`) — all empty, skipped
- Tag-based routes (e.g. `/writing/college/music/album-reviews`) — tags are metadata only for now
- Breadcrumbs on single post pages (`[slug]`)
- Comments, author data, WordPress metadata beyond title/date/categories/coverImage

---

## Acceptance Criteria

- [ ] `tsx` is added to `devDependencies` in `package.json`
- [ ] `npx tsx scripts/import-wp.ts` runs without errors and produces ~59 `.mdx` files in `content/writing/` (56 published/uncategorized + 3 drafts)
- [ ] Placeholder posts (`blog-post-title`, `blog-post-title-2`) are skipped with a console log (case-insensitive match)
- [ ] Draft posts from `_drafts/` are imported with `status: draft` and do not appear in any archive
- [ ] Non-ASCII slugs (`दोस्रो`, `གཅིག`) are imported with transliterated ASCII filenames
- [ ] All imported posts appear on `/writing`
- [ ] `/writing/college` shows all college posts with personality zone (tagline, post-its, subcategory pills)
- [ ] `/writing/college/music` shows only music posts
- [ ] Nav WRITING link shows dropdown with College → subcategory list on hover (desktop) and tap (mobile)
- [ ] Images from WP archive load correctly on imported posts
- [ ] `getAllPosts()` and `getPost()` correctly return `category`, `subcategory`, and `coverImage` fields
- [ ] `npx next build` completes clean with no TypeScript errors
