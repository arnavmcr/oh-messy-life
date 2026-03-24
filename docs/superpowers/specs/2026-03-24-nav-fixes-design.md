# Nav Fixes Design Spec

**Date:** 2026-03-24
**Scope:** Two navigation bugs — broken category pages + hover UX

---

## Problem 1: Category pages 404 or render nothing

### Root cause

`app/writing/[slug]/page.tsx` is the only dynamic route under `/writing/`. When a user clicks "Projects" (→ `/writing/projects`) in the dropdown, Next.js routes to the `[slug]` handler. `getPost('projects')` returns `undefined`, so `notFound()` fires. Same for `mba`, `essays`, `music`.

`/writing/college` has its own static page (`app/writing/college/page.tsx`) so it works. No equivalent pages exist for the other four categories.

### Solution: Dual-purpose [slug] route

Make `app/writing/[slug]/page.tsx` detect whether the incoming slug is a category key and branch accordingly.

**Logic:**
```
const isCategory = slug in CATEGORY_MAP && slug !== 'college'
```
(`college` has its own static page; Next.js static routes always win over dynamic ones so it won't reach [slug] anyway — but the guard keeps the intent explicit.)

**`generateStaticParams`:** Return all article slugs **plus** all non-college category keys so Next.js pre-renders them at build time. Explicitly:
```ts
const categorySlugs = Object.keys(CATEGORY_MAP).filter(k => k !== 'college');
const articleSlugs = getAllSlugs();
// Deduplicate in case any article slug collides with a category key
return [...new Set([...categorySlugs, ...articleSlugs])].map(slug => ({ slug }));
```
Note: content authors must not use a category key (e.g. `projects`) as an article slug — if they do, the category page takes precedence at build time.

**`generateMetadata`:** If it's a category, return the category label as the page title.

**Category listing view:** Matches the college page structure. The college page has hardcoded strings (`CATEGORY: COLLEGE // ERA: 2014–2019`, two-line title `THE COLLEGE_ ARCHIVE`) — these must be generalized from `CATEGORY_MAP[slug]`:
- Sub-header line: `CATEGORY: <SLUG UPPERCASED>` (no era annotation for non-college categories)
- Title: `THE <LABEL UPPERCASED>_ ARCHIVE` on one or two lines (match the college page typographic pattern)
- Accent color: from `CATEGORY_MAP[slug].accentColor`

Full structure:
- Breadcrumb: `WRITING / <CATEGORY>`
- Header with accent border, category name as large italic heading, post count badge
- Tagline + post-it notes if present in `CATEGORY_MAP` config
- **No subcategory pills** — omit the subcategory pill block entirely (do not copy it from the college page; these categories have no subcategories and the block should not appear even conditionally)
- Article grid using `getPostsByCategory(slug)` with the same `variants` + `rotations` cycling
- Empty state: render a `<div>` with `font-mono text-[10px] text-on-surface-variant` containing the literal text `NO_ENTRIES_FOUND // CHECK CONTENT DIRECTORY` — same pattern already used in the college page

The category view is rendered inline in the same file as a separate block (not a new component file), keeping the dual-purpose pattern self-contained.

---

## Problem 2: Hover dropdown disappears when crossing the gap

### Root cause

The Writing dropdown uses CSS `group-hover:block`. The `mt-2` gap (8px) between the trigger link and the dropdown panel means any cursor movement across that gap dismisses the dropdown. Users must hover with precision, which is frustrating.

### Solution: JS hover state with close delay

Replace the CSS `group-hover` mechanism with `useState` + `onMouseEnter`/`onMouseLeave` on the wrapper `div`.

**Behaviour:**
- `onMouseEnter` on the wrapper: clear any pending close timer, set `desktopDropdownOpen = true` immediately
- `onMouseLeave` on the wrapper: start a 150ms timer; if the cursor hasn't re-entered by then, set `desktopDropdownOpen = false`

The 150ms delay is enough to let the cursor cross the `mt-2` gap without triggering a close. It's imperceptible to the user as intentional latency.

**State shape:**
```ts
const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

`useRef` must be added to the React import (currently only `useState` is imported).

**Timer cleanup on unmount:** Add a `useEffect` to clear any pending timer when the component unmounts (prevents a state-update-on-unmounted-component warning during route transitions):
```ts
useEffect(() => {
  return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
}, []);
```

**Dropdown rendering:** Replace `hidden group-hover:block` with `{desktopDropdownOpen && <div>...</div>}`. Remove `group` class from the wrapper.

The existing mobile `writingOpen` state is unaffected — it's a separate toggle, not a hover.

---

## Files changed

| File | Change |
|---|---|
| `app/writing/[slug]/page.tsx` | Add category detection + category listing view |
| `components/Nav.tsx` | Replace CSS group-hover with JS hover state + close delay |

No new files. No new dependencies.
