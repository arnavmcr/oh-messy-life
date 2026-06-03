---
title: "feat: Hero graph — flat constellation redesign"
date: 2026-06-03
status: completed
origin: docs/brainstorms/2026-06-03-homepage-graph-flat-constellation.md
---

# feat: Hero graph — flat constellation redesign

## Problem Frame

The homepage hero graph uses a hub-spoke topology: four large category circles (WRITING, RECORD, SIGNAL, LABS) anchor clusters of smaller leaf nodes. This hierarchy undercuts the intended feel of an interconnected constellation. Hub nodes consume visual weight, their click behaviour (toggle category) is non-obvious, and several hardcoded Signal/Labs nodes link to routes that don't exist.

Additionally, the graph is choppy on mobile: per-frame React state updates combined with expensive SVG displacement filters degrade scroll smoothness on small viewports.

---

## Scope

**In:** Remove hub nodes; flatten to leaf-only constellation; prune dead hrefs; add labels at zoom threshold; improve mobile performance.

**Out:** New routes (`/projects`), changes to Nav/writing/record/music pages, new cross-link strategies, tag edge generation changes in `app/page.tsx`.

---

## Key Technical Decisions

1. **CATS constant is kept but slimmed.** It still provides per-category colour and rough initial-position hints (`angle`, `orbit`) for `makeLeafNode`. Hub node objects are no longer created from it. Removing the angle/orbit fields would require a parallel rewrite of `makeLeafNode`; leaving them in lets the initial layout stay clustered by category without hub nodes.

2. **`GraphNode.kind` field is removed.** The only consumers are the physics `k_anchor` branch (gone with hub nodes) and the render split (`n.kind === 'cat'`). With both removed, the field carries no meaning.

3. **`makeLeafNode` initial position spread is widened.** Without hub nodes to push against, the current tight angle variance (`rand(-1.0, 1.0)`) keeps leaves too close to their category's arc. Widening to `rand(-1.6, 1.6)` and expanding the distance range (`rand(40, 300)`) fills the canvas more evenly from the start.

4. **Entry animation collapses to a single opacity schedule.** The current two-speed entry (hubs first at 0–400 ms, leaves 300–1800 ms) only exists to give viewers orientation via hubs before leaves appear. Without hubs, a single fade over ~1.2 s from mount is cleaner.

5. **Mobile detection via `size.w < 640`** — already tracked by the ResizeObserver. No new state needed; compute `isMobile` inline from existing state.

6. **Labels rendered as SVG `<text>` inside each leaf node's `<g>`.** Gated on `view.scale >= 1.5`. Labels ≤ 24 chars show in full; labels longer than 24 chars show as first 22 chars + '…'. `pointerEvents: 'none'` so they don't interfere with hover/click targets.

7. **30 fps cap on mobile via a frame-skip counter.** A `frameSkipRef` increments each rAF tick; the physics update and `setTick` are skipped on odd frames when `isMobile`. The animation loop itself keeps running at native fps so pinch/pan feel stays responsive.

---

## Implementation Units

### U1. Data model — remove hub nodes, prune dead routes

**Goal:** Strip hub-node data from the graph's static constants and `buildGraph`, leave only leaf data with valid hrefs.

**Requirements:** R1, R2, R3, R4, R5, R6 (see origin doc)

**Dependencies:** none

**Files:**
- `components/HomeGraph.tsx`

**Approach:**
- Remove `CATS` `orbit` and `angle` fields — replace with a flat `{ id, label, cssColor }` shape. Keep a separate `CAT_ANGLES` lookup (`writing: -π/2`, `record: 0`, `signal: π/2`) used only inside `makeLeafNode` for initial position hints.
- Update `SIGNAL_LEAVES` to exactly two entries: `{ id: 's1', label: 'The Library', href: '/music/index.html' }` and `{ id: 's2', label: 'Gig Archive', href: '/music/gig-archive' }`.
- Delete `LABS_LEAVES` constant entirely.
- Remove `GraphNode.kind` field and `GraphNode.ax`/`GraphNode.ay` anchor fields.
- In `buildGraph`: delete the `CATS.forEach(...)` hub-node creation block. Delete the hub-to-leaf branch edge creation (`edges.push({ a: 'writing', ... })`). Keep signal leaf creation; remove labs leaf creation.
- Widen `makeLeafNode` initial position spread: angle variance `rand(-1.6, 1.6)`, distance range `rand(40, 300)`.
- Delete `CAT_HREFS` (only used for hub node hrefs).

**Patterns to follow:** Existing `makeLeafNode` helper shape; existing `GraphNode` interface in `components/HomeGraph.tsx`.

**Test scenarios:**
- `buildGraph` returns zero nodes with `kind === 'cat'`
- `buildGraph` with empty writing and record arrays returns exactly 2 Signal nodes
- Both Signal nodes have hrefs `/music/index.html` and `/music/gig-archive` respectively
- No node in the returned map has an href of `/projects` or `/music/index.html` from an old Labs entry
- `buildGraph` returns no branch edges (edges where `a` matches a category id)

**Verification:** Inspecting the graph in browser shows no large hub circles; node count in the network matches `writingLeaves.length + recordLeaves.length + 2`.

---

### U2. Physics — remove hub anchoring, simplify entry animation

**Goal:** Eliminate the `k_anchor` force and hub-specific physics branches; collapse the two-speed entry opacity schedule into one.

**Requirements:** R10, R11 (origin doc)

**Dependencies:** U1 (kind field and anchor fields removed)

**Files:**
- `components/HomeGraph.tsx`

**Approach:**
- In the rAF settle loop: delete the `if (n.kind === 'cat')` block that applied `k_anchor` and the `else` leaf center-pull block. Replace with a single weak center pull (`k_center` magnitude unchanged) applied to all nodes.
- Delete `catEntryOpacity` / `leafEntryOpacity` split. Replace with a single `entryOpacity = Math.min(1, entryMsRef.current / 1200)` applied uniformly.
- Delete `activeCats.labs` from the initial state and from `activeCats` type annotation.
- Update `isVisible` predicate to reference the trimmed `activeCats` shape.
- Remove the `n.kind === 'cat'` dimOpacity branch in the render loop — use the leaf value (`0.07`) for all nodes, or a flat `0.08`.

**Patterns to follow:** Existing settle-loop structure in `components/HomeGraph.tsx:370–435`.

**Test scenarios:**
- After settle phase, no node drifts more than ~50px beyond the canvas bounds at default zoom
- Hovering one node dims all unconnected nodes uniformly (no category-based dimming inconsistency)
- Entry fade: on fresh load all nodes are invisible at t=0 and fully opaque by ~1.2 s
- Toggling "WRITING" via the legend hides writing nodes and their connected edges

**Verification:** Load the homepage; observe a single-wave entry fade with no nodes popping in. Settle completes without nodes bunching in the center.

---

### U3. Render — remove hub render branch, update interaction model

**Goal:** Delete the `if (n.kind === 'cat')` render block and its associated interactions (spinning dashed ring, toggle-category click, hub-specific hover ring).

**Requirements:** R1, R11 (origin doc)

**Dependencies:** U1, U2

**Files:**
- `components/HomeGraph.tsx`

**Approach:**
- Delete the entire `if (n.kind === 'cat') { return (...) }` render branch in the nodes `<g>` map.
- The remaining leaf render path becomes the only path — remove the `if (n.kind === 'cat')` guard on the click handler that called `toggleCat`. Category toggling is now legend-only.
- Remove `clickedId` state and the spring-scale inner `<g>` if desired for simplicity — or keep it since it's a nice interaction. Decision: keep it, it's low overhead.
- Remove the `animateTransform` spinning dashed ring (was hub-hover only).

**Patterns to follow:** Existing leaf node render group (`components/HomeGraph.tsx:641–672`).

**Test scenarios:**
- Clicking a node navigates to the correct href (no toggle behaviour)
- Clicking a node shows the spring scale animation before navigation
- No hub circles visible at any zoom level
- Hovering a node still shows pulsing ring and glow

**Verification:** Visual check — only small dots visible. Clicking any node navigates.

---

### U4. Labels at zoom threshold

**Goal:** Show a truncated title below each leaf node when `view.scale >= 1.5`.

**Requirements:** R13, R14 (origin doc)

**Dependencies:** U3 (leaf render path finalised)

**Files:**
- `components/HomeGraph.tsx`

**Approach:**
- Define `LABEL_THRESHOLD = 1.5` at module level.
- Inside the leaf render `<g>`, after the existing circle elements, conditionally render a `<text>` when `view.scale >= LABEL_THRESHOLD`.
- Text content: JS `label.length > 24 ? label.slice(0, 22) + '…' : label`.
- Attributes: `y={n.r + 14}`, `textAnchor="middle"`, `fontFamily="var(--font-mono-stack)"`, `fontSize={10 / view.scale}` (scale-normalised so text stays a consistent physical size as the user zooms), `opacity="0.65"`, `fill="currentColor"`, `style={{ pointerEvents: 'none' }}`.
- Scale-normalising font size (`10 / view.scale`) prevents labels from becoming enormous at high zoom. This is the key detail.
- No CSS changes needed — the `<text>` uses inline SVG attributes matching the existing label style on hub nodes (currently `fontSize="13"`, letter-spacing, etc.).

**Patterns to follow:** Existing hub label `<text>` at `components/HomeGraph.tsx:623–633` (inline attributes pattern).

**Test scenarios:**
- At zoom 1.0×: no label text rendered in the SVG
- At zoom 1.5×: every visible node has a `<text>` child below it
- Label for a 30-character title is truncated to 22 chars + "…"
- Label for a 24-character title is shown in full
- Labels do not intercept click/hover events (pointerEvents: none)
- At zoom 3.0×: label font renders at a consistent physical size (not 30px)

**Verification:** Zoom in via `+` button past 1.5× — labels appear. Zoom out — labels disappear.

---

### U5. Mobile performance

**Goal:** Eliminate SVG displacement filters on small viewports and cap the animation to ~30 fps on mobile.

**Requirements:** R16, R17, R18 (origin doc)

**Dependencies:** U3 (render path finalised)

**Files:**
- `components/HomeGraph.tsx`

**Approach:**
- Derive `isMobile` inline: `const isMobile = size.w < 640`. `size` is already in state, so this recalculates on resize correctly.
- **Filters off:** In edge and node render, conditionally omit `filter="url(#drip)"` / `filter="url(#drip-strong)"` / `filter="url(#wave-edge)"`. When `isMobile`, pass `undefined` (or omit the prop) instead of the filter url string. The SVG `<defs>` block can remain — unused filters are harmless.
- **30 fps cap:** Add `frameSkipRef = useRef(0)`. In the rAF callback, increment `frameSkipRef.current`. When `isMobile && frameSkipRef.current % 2 !== 0`, skip the physics update and `setTick` call. The `last = now` timestamp update still happens so the next frame's delta is correct.
- **Shorter settle:** Change `SETTLE_MS` from a constant to a computed value: `isMobile ? 1400 : 2800`. Since `isMobile` is derived from `size` state but the settle loop uses a ref (`settleRef`), the simplest approach is to compute `SETTLE_MS` at the top of the rAF effect and capture it via closure.

**Technical design (directional, not specification):**
```
// Directional sketch — not implementation spec
const isMobile = size.w < 640
const SETTLE_MS = isMobile ? 1400 : 2800

// In rAF loop:
frameSkipRef.current++
const shouldUpdate = !isMobile || frameSkipRef.current % 2 === 0
if (shouldUpdate) {
  // physics + setTick
}

// In render:
const filterDrip  = isMobile ? undefined : 'url(#drip)'
const filterWave  = isMobile ? undefined : 'url(#wave-edge)'
```

**Patterns to follow:** Existing `size.w <= 640` check for initial zoom scale (`components/HomeGraph.tsx:258–261`).

**Test scenarios:**
- On a 375px wide viewport: nodes render as plain filled circles (no blur/distortion)
- On a 375px wide viewport: the rAF callback fires at ~30fps (observable via frame counter log in dev)
- On a 1200px wide viewport: filters are applied and fps is uncapped
- Resizing from desktop → mobile mid-session removes filters on the next render
- Settle phase completes noticeably faster on mobile (visual: nodes stop moving sooner)

**Verification:** Open DevTools Performance panel on mobile emulation. Confirm no `feDisplacementMap` paint calls; confirm frame budget is not exceeded at 30fps.

---

### U6. Legend and activeCats cleanup

**Goal:** Remove the Labs entry from the category toggle legend and from the `activeCats` state type.

**Requirements:** R12, R19 (origin doc)

**Dependencies:** U1 (labs nodes removed from graph data)

**Files:**
- `components/HomeGraph.tsx`
- `app/globals.css` (minor: no structural changes; only verify legend renders correctly with 3 items)

**Approach:**
- Remove `labs` from the `activeCats` initial state object: `{ writing: true, record: true, signal: true }`.
- Update the `activeCats` type annotation to exclude `labs`.
- Update the legend render: change `CATS.map(...)` to filter out the labs entry. Simplest: replace the `CATS` reference in the legend with a new `LEGEND_CATS` constant that excludes labs, or filter inline.
- `toggleCat` function signature unchanged — it accepts a string key, just won't be called with `'labs'`.
- No CSS changes needed — legend already handles variable item count via `flex-wrap`.

**Patterns to follow:** Existing legend render at `components/HomeGraph.tsx:685–696`.

**Test scenarios:**
- Legend renders exactly 3 chips: WRITING, RECORD, SIGNAL
- Clicking WRITING chip hides all writing nodes and dims their edges
- Clicking SIGNAL chip hides the 2 signal nodes
- No labs chip visible at any viewport width

**Verification:** Visual check on desktop and mobile — 3 legend chips.

---

## Deferred / Out of Scope

- Labs nodes return when `/projects` route ships — re-add `LABS_LEAVES` at that point
- T-shirt archive node — re-add when page is live
- Subcategory clustering within categories (deferred in prior brainstorm; still deferred)
- Canvas-based renderer — would eliminate per-frame React reconciliation; worthwhile if 30fps cap doesn't sufficiently address jank on low-end Android

---

## Dependencies / Assumptions

- `getAllJournalEntries()` returns `{ tags: string[] }` — verified: `lib/journal.ts:119` defaults to `[]`
- `getAllPosts()` returns `{ tags?: string[] }` — verified: `lib/content.ts:38` defaults to `[]`
- `/music/index.html` is served as a static public asset — confirmed active in `app/music/page.tsx`
- The existing `buildTagEdges` in `app/page.tsx` is unchanged; tag edges still generate correctly for the remaining node set

---

## Test Coverage Notes

`HomeGraph` is a client-side animation component with no existing unit tests. Test scenarios above are described as browser-observable outcomes for manual verification during implementation. A future addition could characterise the physics simulation as a pure function test (given initial node positions + edges, assert settled positions within bounds), but that's out of scope here.
