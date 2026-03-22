# Hero Section Redesign

**Date:** 2026-03-22
**Status:** Approved
**Scope:** `app/page.tsx` — hero section only (lines 19–126)

---

## Context

The landing page hero was too tech/hacker-coded: system IDs, encryption strings, "Active_Breach" status, floating data cards. The desired aesthetic is **raw/personal + soft punk** — honest, direct, a little irreverent, but not performatively technical.

---

## What Changes

### Layout
- **Before:** Two-column grid (4-col brand panel left, 8-col workbench right)
- **After:** Single wide column. Content column is centered within the existing `max-w-[1600px]` container (which is kept). The section background (`bg-[#ebebeb] dark:bg-zinc-900`) continues to span full width.

### Removed entirely
| Element | Value |
|---|---|
| System ID badge | `System_ID: OML_001` |
| Brand panel title | `Technical Vandalism Bureau` |
| Status indicator | `Status: Active_Breach` + colored dots |
| Hero heading | `THE NEXUS` (distressed) |
| Subtitle | "A centralized repository for technical vandalism..." |
| Data card | VANDAL_01, ENCRYPTION: AES_256_V2, ORIGIN: 0x3800c2-FF1721 |
| Protocol card | CORE_PROTOCOL |
| System log card | SYSTEM_LOG_01, UPLINK_STABLE: 99.9% |
| Workbench container | dot-grid background, floating card layout |

### New hero structure
```
[public archive]           ← font-mono, text-[10px], uppercase, tracking-widest
                             text-zinc-400 (both modes — readable on ebebeb and zinc-900)
oh messy
life.                      ← font-headline, font-black, tracking-tighter
                             text-[80px] md:text-[160px], leading-[0.85]
                             text-black dark:text-white
[writing ↗] [record ↗] [projects ↗] [music ↗]
                           ← four border-link tags, colored per section (see table below)
```

### Section nav link colors

Each link is an `<a>` / `<Link>` with a `1.5px` solid border, uppercase text at `text-[10px]`, `font-bold`, `tracking-widest`, `px-4 py-2`. No `.border-link` utility class exists — use raw Tailwind utilities directly on each element.

| Section | Border | Text | Hover bg | Hover text |
|---|---|---|---|---|
| writing | `border-black dark:border-white` | `text-black dark:text-white` | `hover:bg-black dark:hover:bg-white` | `hover:text-white dark:hover:text-black` |
| record | `border-secondary dark:border-[#9f7bff]` | `text-secondary dark:text-[#9f7bff]` | `hover:bg-secondary dark:hover:bg-[#9f7bff]` | `hover:text-white dark:hover:text-black` |
| projects | `border-primary` | `text-primary` | `hover:bg-primary` | `hover:text-white` (both modes) |
| music | `border-tertiary dark:border-tertiary-fixed` | `text-tertiary dark:text-tertiary-fixed` | `hover:bg-tertiary dark:hover:bg-tertiary-fixed` | `hover:text-white dark:hover:text-black` |

Notes:
- `#9f7bff` (lighter indigo) is used for record in dark mode — `#3800c2` is invisible on `zinc-900`
- `text-tertiary` (`#006a3c`, dark forest green) on `#ebebeb` light background: contrast ratio ~4.5:1, acceptable at `font-bold` — no change needed for light mode
- `tertiary-fixed` is `#9df5bb` (light green) — visible on dark backgrounds
- All hover transitions: `transition-colors`

---

## What Does NOT Change

- Sections below the hero: Writing/Scriptorium, Labs sidebar, Vault — untouched in this pass
- The ink filter SVG (kept, harmless)
- The scan-line background overlay (kept, subtle)
- The section background color (`bg-[#ebebeb] dark:bg-zinc-900`)
- The `max-w-[1600px]` wrapper and `border-b border-black/5 dark:border-white/5` on the section

---

## File to Modify

- `app/page.tsx` — replace the hero `<section>` (lines 19–126) only

---

## Verification

1. `npm run dev` — visit `/` in browser
2. **Light mode:** label is muted zinc, heading is large black, all four nav links clearly colored and legible
3. **Dark mode:** toggle dark — heading becomes white, writing border/text becomes white, record uses light indigo `#9f7bff`, music text uses `#9df5bb`
4. **Hover:** each link fills with its border color on hover, text flips to white (or black for writing on dark)
5. **Mobile (`< md`):** heading renders at `80px`, no overflow on 375px viewport
6. **Absent from DOM:** THE NEXUS, VANDAL_01, CORE_PROTOCOL, SYSTEM_LOG_01, Active_Breach, System_ID
