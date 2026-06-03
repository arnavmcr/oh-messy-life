---
title: "Dark Mode with Tailwind v4 + next-themes: CSS Token Override Pattern"
date: 2026-06-03
category: docs/solutions/design-patterns/
module: "Writing — THE MANUSCRIPT / Global Theme"
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - Adding dark/light mode toggle to a Next.js App Router project using Tailwind v4 with @theme {} CSS config
  - Overriding Tailwind color tokens for dark mode driven by a .dark class on html (next-themes default)
  - A client component calls useTheme and must avoid hydration mismatch — requires mounted guard pattern
  - Texture overlays via ::before/::after use mix-blend-mode that inverts on dark backgrounds and need per-theme overrides
  - "Replacing scattered dark: utility variants with a single-block semantic token override in globals.css"
tags:
  - dark-mode
  - tailwind-v4
  - next-themes
  - css-custom-properties
  - semantic-tokens
  - hydration
  - blend-mode
  - typography
---

# Dark Mode with Tailwind v4 + next-themes: CSS Token Override Pattern

## Context

The Oh Messy Life portfolio already had all the dark mode infrastructure installed — `next-themes` v0.4.6, `ThemeProvider` with `attribute="class"` in `components/Providers.tsx`, `@custom-variant dark (&:is(.dark *))` in `app/globals.css`, and `suppressHydrationWarning` on `<html>`. Despite this, dark mode was effectively non-functional because:

1. No `.dark` CSS variable overrides existed — `body` background stayed hardcoded to `var(--paper)` regardless of theme
2. Article text used explicit Tailwind stone utilities (`text-stone-800 dark:text-stone-200`) requiring a separate `dark:` override on every element, and metadata text (`text-stone-400`) had no dark variant at all
3. The contrast toggle in the floating ReadingPill was `aria-hidden="true"` and `tabIndex={-1}` — visible but doing nothing
4. Canvas overlay effects (`body::after` fog gradient, `body::before` grain) used `mix-blend-mode: multiply`, which actively darkens dark backgrounds further instead of adding texture

The failure mode: having `next-themes` wired up is necessary but not sufficient. The CSS layer must explicitly define what changes in dark mode via `.dark` custom property overrides.

## Guidance

### 1. Wire the theme toggle before anything else

A decorative-but-visible button is worse than no button — it trains users to ignore UI affordances. Make the contrast icon functional with `useTheme`, guarded by a `mounted` state to prevent hydration mismatch:

```tsx
// components/ReadingPill.tsx
const [mounted, setMounted] = useState(false);
const { resolvedTheme, setTheme } = useTheme();

useEffect(() => {
  setMounted(true);
  // existing localStorage restore logic stays here
}, [slug]);

function toggleTheme() {
  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
}

const isDark = mounted && resolvedTheme === 'dark';

// Remove aria-hidden and tabIndex={-1} from the contrast button:
<button
  onClick={toggleTheme}
  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  className={`transition-colors ${isDark ? 'text-primary' : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
>
  <span
    className="material-symbols-outlined text-[20px]"
    style={{ fontVariationSettings: isDark ? "'FILL' 1" : "'FILL' 0" }}
  >
    contrast
  </span>
</button>
```

The `mounted` guard is critical: `resolvedTheme` is `undefined` during SSR, so reading it before mount would produce a permanent `isDark = false` that never updates.

### 2. Override CSS custom properties in `.dark`, not on elements

In Tailwind v4, `@theme {}` generates `--color-*` custom properties on `:root`. Because CSS custom properties inherit through the cascade, overriding them once inside `.dark {}` propagates to every Tailwind token utility that references them — no per-element `dark:` prefixes needed.

Add a `.dark` block immediately after the `:root` block in `app/globals.css`:

```css
.dark {
  /* Direct CSS vars used by body, nav, etc. */
  --paper:      #1a1612;
  --paper-warm: #221d18;
  --ink:        #e8e0d5;
  --ink-soft:   #cfc7bc;
  --bone:       #2a2420;

  /* Tailwind token layer — overrides @theme :root values */
  --color-paper:                   #1a1612;
  --color-on-surface:              #e8e0d5;
  --color-on-surface-variant:      #b0a89e;
  --color-surface:                 #221d18;
  --color-surface-container:       #2a2420;
  --color-outline:                 #6a6258;
  --color-outline-variant:         #3a3530;
  /* ... all other semantic tokens ... */
}
```

Also fix blend modes that break on dark backgrounds:

```css
.dark body::after {
  mix-blend-mode: screen;   /* was multiply — multiplying on dark makes it darker still */
  opacity: 0.5;
}

.dark body::before {
  mix-blend-mode: overlay;
  opacity: 0.18;
}
```

### 3. Use semantic token utilities in markup, not stone utilities

Once the `.dark` block is in place, replace stone/gray utility classes with semantic Tailwind tokens. These pick up the dark override automatically:

| Stone utility (before) | Semantic token (after) |
|---|---|
| `text-stone-800 dark:text-stone-200` | `text-on-surface` |
| `text-stone-500 dark:text-stone-400` | `text-on-surface-variant` |
| `text-stone-400` (no dark variant) | `text-on-surface-variant` |
| `border-stone-200 dark:border-stone-800` | `border-outline-variant` |

## Why This Matters

**Maintainability**: The stone-utility approach requires a `dark:` override on every text, border, and background class. One new component means new dark variants everywhere. The CSS variable approach centralises the entire palette shift in one block — add a component using semantic tokens and dark mode works for free.

**Correctness of blend modes**: `mix-blend-mode: multiply` composites by multiplying pixel values — on a light background this produces a paper texture effect. On a dark background it darkens further, making fog overlays actively destructive. `screen` (the inverse operation) is the correct mode for texture overlays on dark surfaces.

**Hydration safety**: `useTheme` returns `undefined` on the server. Reading `resolvedTheme` directly without a `mounted` guard produces a server/client mismatch that React flags and causes the toggle to appear stuck on first load.

**Accessibility**: A contrast toggle that is `aria-hidden` and `tabIndex={-1}` is actively misleading to sighted users (it looks interactive) while being invisible to assistive technology. Make it functional or remove it — never leave it decorative-but-visible.

## When to Apply

- Any `next-themes` integration in a Tailwind v4 project where `attribute="class"` (not `data-theme`)
- Whenever `dark:text-*` or `dark:border-*` Tailwind overrides appear in more than two or three files — that is the signal to centralise into `.dark` CSS variable overrides instead
- When adding texture/grain overlays using `::before`/`::after` pseudo-elements with `mix-blend-mode` — always specify a `.dark` variant with `screen` or `overlay`
- When any interactive element has both `aria-hidden="true"` and visible styling that implies interactivity

## Examples

**Before — stone utilities, scattered dark overrides, broken toggle:**

```tsx
// app/writing/[slug]/page.tsx — every element needs its own dark variant
<h1 className="font-headline text-5xl text-stone-900 dark:text-stone-100 uppercase">
<p className="font-body text-stone-800 dark:text-stone-200 leading-[1.8] mb-6">
<p className="font-body italic text-xl text-stone-500 dark:text-stone-400 leading-relaxed">
<div className="border-t border-b border-stone-200 dark:border-stone-800">
<div className="article-body text-lg space-y-0 mb-32">

// ReadingPill — decorative, does nothing
<button aria-hidden="true" tabIndex={-1}>
  <span className="material-symbols-outlined text-[20px]">contrast</span>
</button>

// globals.css — no .dark block; body stays --paper regardless of theme
body { background: var(--paper); }
body::after { mix-blend-mode: multiply; }  /* actively darkens dark bg */
```

**After — semantic tokens, single `.dark` block, wired toggle:**

```tsx
// app/writing/[slug]/page.tsx — markup is theme-agnostic
<h1 className="font-headline text-5xl text-on-surface uppercase">
<p className="font-body text-on-surface leading-[1.85] mb-7">
<p className="font-body italic text-xl text-on-surface-variant leading-relaxed">
<div className="border-t border-b border-outline-variant">
<div className="article-body text-lg space-y-0 mb-32 max-w-prose mx-auto">

// ReadingPill — functional, hydration-safe
<button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
  <span style={{ fontVariationSettings: isDark ? "'FILL' 1" : "'FILL' 0" }}>contrast</span>
</button>

// globals.css — one block handles the entire palette shift
.dark {
  --color-on-surface: #e8e0d5;
  --color-on-surface-variant: #b0a89e;
  /* ... */
}
.dark body::after { mix-blend-mode: screen; opacity: 0.5; }
```

Any new component using `text-on-surface`, `bg-surface`, or `border-outline-variant` gets dark mode automatically with zero additional CSS.

## Related

- Implementation: `components/ReadingPill.tsx`, `app/globals.css`, `app/writing/[slug]/page.tsx`
- Origin spec: `docs/brainstorms/2026-06-03-manuscript-readability.md`
- Peer pattern: `docs/solutions/design-patterns/homepage-hero-graph-flat-constellation-2026-06-03.md`
