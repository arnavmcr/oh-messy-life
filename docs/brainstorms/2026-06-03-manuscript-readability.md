---
date: 2026-06-03
topic: manuscript-readability
---

# THE MANUSCRIPT — Readability Pass

## Summary

A four-part readability improvement for THE MANUSCRIPT page (writing article view): a functional dark mode toggle in the floating reading pill, a warm dark-paper palette, improved light-mode contrast for metadata and excerpt text, and tighter line-length + spacing for the article body.

---

## Problem Frame

THE MANUSCRIPT page renders writing articles on a warm paper background with ink-coloured text. Several issues reduce reading comfort: metadata labels (`text-stone-400`) and excerpt text (`text-stone-500`) have low contrast against the paper (#d9d4cb), the article body column has no line-length constraint beyond `max-w-3xl`, and there is no dark mode — despite `next-themes` being installed and the dark CSS variant already configured. The decorative contrast button in the floating reading pill is present but non-functional.

---

## Requirements

**Theme toggle**

- R1. The contrast button in `ReadingPill` is functional: clicking it toggles between light and dark theme via `next-themes`.
- R2. The contrast icon indicates the current state — filled when dark mode is active, outlined when light.
- R3. Theme preference persists across sessions (via `next-themes` localStorage default).
- R4. The toggle is guarded against hydration mismatch: icon and behaviour are only applied after mount.

**Dark palette**

- R5. Dark mode uses a warm near-black background (~#1a1612), warm off-white body text (~#e8e0d5), and unchanged coral/violet accents.
- R6. The fog overlay's blend mode is corrected for dark backgrounds (from `multiply` to `screen`), with reduced opacity.
- R7. The film grain overlay is corrected for dark mode (reduced opacity, adjusted blend mode).
- R8. Tailwind semantic tokens (`text-on-surface`, `text-on-surface-variant`, `border-outline-variant`, etc.) resolve to dark-appropriate values in dark mode.

**Article readability**

- R9. Body paragraph text uses the semantic `text-on-surface` token (resolves correctly in both light and dark mode) rather than hardcoded stone utilities with explicit `dark:` overrides.
- R10. Metadata labels and tag text use `text-on-surface-variant` — sufficient contrast against the paper background.
- R11. Excerpt text uses `text-on-surface-variant` instead of `text-stone-500`.
- R12. Title uses `text-on-surface` instead of `text-stone-900 dark:text-stone-100`.
- R13. Article body is constrained to `max-w-prose` (65ch) within the existing `max-w-3xl` container, centered with `mx-auto`.
- R14. Paragraph line-height increases slightly (1.85), paragraph bottom margin increases to `mb-7`, and list item spacing increases to `space-y-3`.
- R15. Section heading (`h2`) adds `mt-14` for more breathing room above.
- R16. Separator borders use `border-outline-variant` throughout (semantic, dark-mode-aware).

---

## Success Criteria

- Dark mode toggle is functional and visually communicates active state.
- Article body reads comfortably in both light and dark mode without per-element `dark:` overrides on every text element.
- Metadata, tags, and excerpt text meet WCAG AA contrast against both the light paper and dark paper backgrounds.
- Article body line length is capped at 65ch regardless of viewport width.

---

## Scope Boundaries

- No nav-level theme toggle — toggle is scoped to the reading pill on article pages.
- Record section (THE ENTRY) is not touched.
- Typography/spacing changes are scoped to THE MANUSCRIPT only — listing pages, homepage, and other routes are unchanged.
- Font family is unchanged.
- Dark mode toggling applies site-wide (html.dark class) — that's a platform constraint, not a feature.

---

## Key Decisions

- **Warm dark-paper over OLED black**: preserves the zine/print aesthetic in dark mode; true black would feel out of character.
- **Reading pill toggle (not nav)**: dark mode is a reading preference on this site; scoping to article pages reduces nav complexity.
- **Semantic token refactor for text colors**: replacing stone utilities with `text-on-surface`/`text-on-surface-variant` eliminates per-element `dark:` overrides and makes the dark palette propagate automatically via CSS variable inheritance.
