---
title: Site Polish — Record Readability, Writing Graph, Footer Cleanup
date: 2026-06-17
status: approved
---

## Summary

Four targeted improvements to existing pages: larger Record entries for readability, a graph-based Writing index replacing the category tile grid, and a footer cleanup that removes Signal remnants, drops letterboxd, adds Instagram + email, and corrects the copyright year.

---

## 1. Record Page — Entry Readability

**Problem:** Entry rows feel cramped; title text (`text-sm`) and section-name labels (`text-[10px]`) are too small for comfortable scanning.

**Changes:**
- Entry title: `text-sm` → `text-base` (or `text-lg`)
- Section names: `text-[10px]` → `text-xs` (12px)
- Row padding may increase slightly to match the larger type

**File:** `app/record/page.tsx`

---

## 2. Writing Page — Graph View

**Problem:** The category tile grid (`app/writing/page.tsx`) is functional but generic. The homepage already has a living graph of all content; the Writing index should offer the same experience filtered to writing only.

**Behaviour:**
- Replace the tile grid with an instance of `HomeGraph` that renders only writing nodes
- Initial zoom set to ~1.8× so nodes are legible without user interaction
- Labels visible at default zoom (lower `LABEL_THRESHOLD` to ~0.8 or always-on for this mode)
- Legend hidden (only one category; nothing to toggle)
- Pan/zoom controls retained (user can still explore)
- No record, signal, or labs nodes appear

**Implementation approach:** Add a `writingOnly?: boolean` prop to `components/HomeGraph.tsx` that:
1. Excludes record / signal / labs node creation in `buildGraph`
2. Sets `initialScale` to `1.8`
3. Sets `LABEL_THRESHOLD` to `0.8`
4. Suppresses the legend UI

Page header copy and masthead above the graph can stay; the graph replaces only the `<div className="grid …">` tile block.

**Files:** `components/HomeGraph.tsx`, `app/writing/page.tsx`

---

## 3. Footer Cleanup

**File:** `components/Footer.tsx`

### 3a. Archive column
- Remove `<li><Link href="/music">signal</Link></li>`
- Remaining: writing, record, labs

### 3b. Signal column
- Remove the entire "signal" footer column (h4 + library / gig archive / t-shirt archive links)
- Footer goes from 4 columns to 3

### 3c. Elsewhere column
- Remove letterboxd (no account)
- Add `<li><a href="https://instagram.com/arnavmcr">instagram</a></li>`
- Add `<li><a href="mailto:arnavmcr@gmail.com">email</a></li>`
- GitHub and Substack stay

### 3d. Copyright
- Change `© 2023 — 2026` → `© 2014 — 2026`

---

## Success Criteria

- Record titles and section names are visually larger and easier to scan
- `/writing` loads with a live, pannable writing graph at comfortable zoom (labels readable without zooming in)
- Footer has no remaining "signal" references in the archive nav
- Footer "elsewhere" has: substack, github, instagram, email (no letterboxd)
- Footer copyright reads 2014 — 2026
