---
title: "position: fixed Trapped by a Transformed Ancestor — Use a Portal"
date: 2026-09-26
category: docs/solutions/design-patterns/
module: "Record — RecordGallery / Lightbox"
problem_type: bug_pattern
component: frontend_stimulus
severity: high
applies_when:
  - Adding any `position: fixed` full-screen overlay (lightbox, modal, drawer) to a component that can render anywhere in the tree
  - The overlay renders inside content wrapped by an animation helper that applies `transform` (e.g. `ScrollReveal`'s fade-up-on-scroll)
  - A "full screen" overlay instead renders as a huge box confined to one section, offset above/below the visible viewport
tags:
  - position-fixed
  - containing-block
  - css-transform
  - react-portal
  - lightbox
  - scroll-reveal
---

# position: fixed Trapped by a Transformed Ancestor — Use a Portal

## Context

Building a `Lightbox` for `RecordGallery` (click a photo, see it full-screen, arrow through the rest of the gallery). The overlay was a plain `<div className="fixed inset-0 ...">` rendered as a child of `RecordGallery`, which itself renders inside a record entry section.

In the browser, clicking a photo dimmed the page (confirming the overlay mounted) but the enlarged image, close button, and arrows were never visible — as if the overlay had zero size or was positioned off-screen. `getBoundingClientRect()` on the overlay in the console showed the real bug:

```json
{ "top": -488.5, "height": 5127.5, ... }
```

Not a viewport-sized box at `(0,0)` — a box over 5000px tall, offset far above the fold.

## Root Cause

Every section on the record entry page is wrapped in `ScrollReveal`, which drives its fade-up-on-scroll animation with a CSS class:

```css
/* app/globals.css */
.entry-section-reveal {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.entry-section-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

Per the CSS spec, **any element with a `transform` value other than `none` becomes a new containing block for its `position: fixed` (and `position: absolute`) descendants** — even a no-op `translateY(0)`. Once `ScrollReveal`'s wrapper picks up `.is-visible`, it permanently carries a `transform`, so every `position: fixed` element nested anywhere inside it is no longer positioned relative to the viewport. Instead it is positioned and sized relative to that transformed ancestor's own box — which, for a wrapper holding an entire multi-gallery section, is a many-thousand-pixel-tall block starting wherever that section happens to sit in the document.

This is a general trap, not specific to this component: **any component that assumes `position: fixed` means "relative to the viewport" will silently break the moment it's rendered inside anything using `transform` for animation** (fade-ins, parallax, `scale` hover effects, etc.) — with no console error, since the CSS is behaving exactly per spec.

## Guidance

Render the fixed overlay through a React portal directly into `document.body`, escaping the DOM subtree (and therefore any transformed ancestor) entirely:

```tsx
// components/Lightbox.tsx
'use client';
import { createPortal } from 'react-dom';

export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  // ...hooks (keydown listener, body scroll lock, touch handlers)...

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* ...overlay content... */}
    </div>,
    document.body
  );
}
```

`document.body` is never inside a transformed element, so `position: fixed` behaves normally regardless of where in the React tree the component that renders the portal actually lives.

## Why This Matters

The failure mode gives almost no signal: no console error, no failed network request, no React warning. The component renders, the backdrop dims (confirming JS ran and the element mounted), and the only symptom is "the overlay content just isn't visible" — which looks like a z-index or display bug, not a positioning-context bug. Reaching for `getBoundingClientRect()` on the overlay itself (not just eyeballing the screenshot) was what actually surfaced the real numbers (`height: 5127px`, `top: -488px`) that pointed at a containing-block problem rather than a stacking or visibility problem.

## When to Apply

- Any new `position: fixed` overlay (modal, lightbox, toast, drawer, command palette) added to a page that uses `ScrollReveal` or any other `transform`-driven animation wrapper
- More generally: whenever a `position: fixed` element might be rendered as a descendant of a component whose className or inline style could include `transform`, `filter`, `perspective`, `will-change: transform`, or `contain: layout|paint` (all of these create a new containing block for fixed descendants per spec)
- Diagnostic signal to watch for: a "full-screen" overlay that dims the page but shows no visible content — check `getBoundingClientRect()` on the overlay root before assuming it's a z-index/display issue

## Examples

**Before — trapped by the ancestor's transform:**

```tsx
export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* never visible when rendered inside a ScrollReveal-wrapped section */}
    </div>
  );
}
```

**After — portal escapes the transformed ancestor:**

```tsx
import { createPortal } from 'react-dom';

export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={onClose}>
      {/* renders correctly, viewport-relative, regardless of ancestor transforms */}
    </div>,
    document.body
  );
}
```

## Related

- Implementation: `components/Lightbox.tsx`, `components/RecordGallery.tsx`
- The animation wrapper that triggers the containing-block change: `components/ScrollReveal.tsx`, `.entry-section-reveal` in `app/globals.css`
- MDN: [Containing block — Identifying the containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block)
