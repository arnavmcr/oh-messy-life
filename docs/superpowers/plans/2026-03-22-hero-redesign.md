# Hero Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-column tech-jargon hero with a single-column "oh messy life." hero — clean, raw/personal, soft punk aesthetic.

**Architecture:** Single file change — `app/page.tsx` lines 19–126 (the hero `<section>`) are replaced wholesale. The sections below (Writing, Labs, Vault) are untouched. No new files, no new utilities, no new dependencies.

**Tech Stack:** Next.js App Router, Tailwind v4 (utility classes only, no new tokens), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-22-hero-redesign-design.md`

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `app/page.tsx` | Replace hero `<section>` (lines 19–126) with new markup |

---

## Task 1: Replace the hero section

**Files:**
- Modify: `app/page.tsx:19-126`

No test suite exists in this project. Verification is visual (`npm run dev`) and structural (`npm run build`).

- [ ] **Step 1: Open `app/page.tsx` and locate the hero section**

  The hero is the `<section>` starting at line 19 (`{/* ── Hero: Workbench / Manifesto ───... */}`) and ending at line 126 (`</section>`). The ink-filter SVG at lines 10–17 stays. The content sections from line 128 onward stay.

- [ ] **Step 2: Replace the hero `<section>` with the new markup**

  Replace lines 19–126 with:

  ```tsx
  {/* ── Hero ──────────────────────────────────────────────────────────── */}
  <section className="relative w-full overflow-hidden bg-[#ebebeb] dark:bg-zinc-900 border-b border-black/5 dark:border-white/5">
    <div className="absolute inset-0 opacity-[0.02] pointer-events-none scan-line" />
    <div className="max-w-[1600px] mx-auto px-8 md:px-16 py-24 md:py-32">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-8">
        public archive
      </p>
      <h1 className="font-headline font-black text-[80px] md:text-[160px] leading-[0.85] tracking-tighter text-black dark:text-white mb-12">
        oh messy<br />life.
      </h1>
      <nav className="flex flex-wrap gap-3">
        <Link
          href="/writing"
          className="border-[1.5px] border-black dark:border-white text-black dark:text-white font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
        >
          writing ↗
        </Link>
        <Link
          href="/record"
          className="border-[1.5px] border-secondary dark:border-[#9f7bff] text-secondary dark:text-[#9f7bff] font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-secondary dark:hover:bg-[#9f7bff] hover:text-white dark:hover:text-black transition-colors"
        >
          record ↗
        </Link>
        <Link
          href="/projects"
          className="border-[1.5px] border-primary text-primary font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-primary hover:text-white transition-colors"
        >
          projects ↗
        </Link>
        <Link
          href="/music"
          className="border-[1.5px] border-tertiary dark:border-tertiary-fixed text-tertiary dark:text-tertiary-fixed font-label text-[10px] uppercase tracking-widest font-bold px-4 py-2 hover:bg-tertiary dark:hover:bg-tertiary-fixed hover:text-white dark:hover:text-black transition-colors"
        >
          music ↗
        </Link>
      </nav>
    </div>
  </section>
  ```

- [ ] **Step 3: Verify the dev server renders correctly**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000`. Check:
  - "public archive" label is visible (muted, monospace)
  - "oh messy life." is the large heading — no "THE NEXUS" anywhere on the page
  - Four colored nav links are visible and correctly colored
  - None of these strings appear in the rendered HTML: `System_ID`, `Active_Breach`, `VANDAL_01`, `CORE_PROTOCOL`, `SYSTEM_LOG_01`, `Technical Vandalism Bureau`
  - The sections below (Writing list, Labs sidebar, Vault) are unchanged

- [ ] **Step 4: Check dark mode**

  Toggle dark mode in the browser (or use DevTools to add `dark` class to `<html>`). Verify:
  - Heading becomes white
  - "writing" link border and text become white
  - "record" link is light indigo (`#9f7bff`), not invisible
  - "music" link text is light green (`#9df5bb`), not dark green
  - Background is `zinc-900` (dark)

- [ ] **Step 5: Check mobile layout**

  In DevTools, set viewport to 375px wide. Verify:
  - Heading renders at ~80px, no horizontal overflow
  - Nav links wrap naturally — no overflow or clipping

- [ ] **Step 6: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: build completes with no errors. TypeScript errors would surface here.

- [ ] **Step 7: Commit**

  ```bash
  git add app/page.tsx
  git commit -m "feat: replace tech-jargon hero with clean single-column design

  - Remove two-column grid, System_ID, Active_Breach, Technical Vandalism Bureau
  - Remove THE NEXUS heading and floating workbench cards
  - Single-column hero: 'oh messy life.' at 160px, four colored section links
  - Dark mode: white heading, light indigo for record, tertiary-fixed for music"
  ```
