# Medium Archive Import — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Overview

Import 4 Medium export markdown files from `Medium archive/` into `content/writing/` as MDX, downloading all content images to `public/images/` for self-hosting. Add three new categories (`projects`, `mba`, `essays`) to `lib/categories.ts`.

---

## Input

**Source directory:** `Medium archive/`
**Files:**
- `Building jhoola.world.md`
- `Building koi.md`
- `Roads, Escapism & GeoGuessr.md`
- `my ISB YLP interview.md`

**Format characteristics:**
- No YAML frontmatter — metadata is embedded as Markdown content
- Title on line 1, underlined with `===` (setext heading)
- Medium boilerplate block follows title: author avatar image link, author name link, read time, `·`, date line, `nameless link` clap/bookmark anchors, `Listen`, `Share`
- All images are remote `miro.medium.com` CDN URLs
- Some posts have multiple images concatenated on a single line

---

## Parsing

### Slug derivation
Derived from filename: lowercase, spaces → hyphens, strip non-alphanumeric/hyphen chars.

| Filename | Slug |
|---|---|
| `Building jhoola.world.md` | `building-jhoola-world` |
| `Building koi.md` | `building-koi` |
| `Roads, Escapism & GeoGuessr.md` | `roads-escapism-geoguessr` |
| `my ISB YLP interview.md` | `my-isb-ylp-interview` |

### Title extraction
First line of file (before `===` underline).

### Date extraction
Standalone date line in the boilerplate block (e.g., `Jun 26, 2020`). Parsed with `new Date()` and formatted as `YYYY-MM-DD`.

### Boilerplate stripping
Remove from body:
- Author avatar image link (`[![...](miro.medium.com/...resize:fill:64:64...)](medium.com/...)`)
- Author name link (`[Arnav Sheth](medium.com/...)`)
- Read time lines and `·` separator
- Date line
- `nameless link` anchor lines (clap/bookmark)
- `Listen` and `Share` lines

---

## Image handling

**Strategy:** Download at import time, self-host in `public/images/<slug>/`.

**Process per image:**
1. Find all `miro.medium.com` URLs in content via regex
2. Skip author avatar images (URL contains `resize:fill:64:64`)
3. Derive local filename from the URL path segment (e.g., `1*JKxIDVuZowg2ilLHGLSLRw.png`)
4. Download to `public/images/<slug>/<filename>`
5. Rewrite URL in content to `/images/<slug>/<filename>`
6. On failure: log `[WARN] could not download <url>` and keep remote URL (non-fatal)

---

## Category mapping

Hardcoded lookup by slug. No subcategory for any of these files initially.

| Slug | category |
|---|---|
| `building-jhoola-world` | `projects` |
| `building-koi` | `projects` |
| `roads-escapism-geoguessr` | `essays` |
| `my-isb-ylp-interview` | `mba` |

---

## Output frontmatter

```yaml
---
title: "..."
date: "YYYY-MM-DD"
category: "projects" # or mba / essays
tags: []
excerpt: "..."
status: "published"
---
```

Excerpt auto-extracted from the first real paragraph (same logic as `import-wp.ts`: skip blockquotes, headings, images, blank lines; strip bold/italic/link markup; truncate to 200 chars).

**Output path:** `content/writing/<slug>.mdx`

---

## `lib/categories.ts` changes

Add three new top-level entries (minimal config, taxonomy will evolve):

```ts
projects: {
  label: 'Projects',
  accentColor: 'primary',
  tagline: '',
  postIts: [],
  subcategories: {},
},
mba: {
  label: 'MBA',
  accentColor: 'secondary',
  tagline: '',
  postIts: [],
  subcategories: {},
},
essays: {
  label: 'Essays',
  accentColor: 'tertiary',
  tagline: '',
  postIts: [],
  subcategories: {},
},
```

---

## Script

**File:** `scripts/import-medium.ts`
**Run:** `npx tsx scripts/import-medium.ts`
**Pattern:** Follows `scripts/import-wp.ts` conventions — log `[OK]`, `[SKIP]`, `[WARN]` per file/image.

---

## Out of scope

- No subcategory assignment (taxonomy evolving)
- No `coverImage` frontmatter (Medium posts don't have a designated cover)
- No handling of embedded tweets, YouTube, or other embeds (none present in these 4 files)
