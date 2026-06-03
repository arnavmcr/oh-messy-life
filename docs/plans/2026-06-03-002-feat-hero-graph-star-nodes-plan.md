---
title: "feat: Hero graph star node treatment"
type: feat
status: completed
date: 2026-06-03
origin: docs/brainstorms/2026-06-03-hero-graph-star-nodes.md
---

# feat: Hero Graph — Star Node Treatment

## Summary

Restyle `HomeGraph` nodes from solid colored blobs to luminous star points: `--paper` (#d9d4cb) fill at the core with brand color expressed as a wider, softer outer glow. Simultaneously remove the SVG displacement filters from idle nodes and edges, and strip the micro-wobble animation layer. All changes land in `components/HomeGraph.tsx` only.

## Requirements

- R1. Inner node circle fill → `var(--paper)` instead of `n.color`
- R2. Outer ambient halo → larger radius, lower opacity, still in brand color
- R3. Small bright highlight dot added at node center (~35% of node `r`, white/near-white at ~70%)
- R4. `filterDrip` set to `undefined` unconditionally (currently conditional on mobile/highZoom)
- R5. `filterWave` set to `undefined` unconditionally for edge group
- R6. Micro-wobble layer (`wobbAmpX/Y`, `wobbFreq`, `wobbPhase`) removed from per-frame display offset
- R7. Primary drift amplitude ceiling reduced: `driftAmpX` max 4.0 → 2.0, `driftAmpY` max 5.0 → 2.5
- R8. Hover effects (glow halo, pulsing ring, scale-up) unchanged
- R9. Click spring, entry fade, pan/zoom/pinch unchanged

**Origin acceptance examples:** AE1 (covers R1, R2, R4), AE2 (covers R4), AE3 (covers R6, R7)

## Scope Boundaries

- No changes to `WaveBackdrop.tsx`, `HomepageHero.tsx`, `app/globals.css`, or any route component
- No changes to node size (`r` ranges), topology, edge logic, or label threshold
- SVG `<defs>` block with filter definitions stays intact — filters remain defined but unapplied at idle
- Hover-state visual behavior frozen at current behavior (this change targets idle legibility only)
- No new animation systems (CSS keyframes, spring physics libraries) introduced

## Context & Research

### Relevant Code and Patterns

- `components/HomeGraph.tsx` — sole target file; all changes are internal to this component
- `filterDrip` / `filterWave` derivation at lines ~471–473 — currently: `(isMobile || highZoom) ? undefined : 'url(#drip)'`; change to always `undefined`
- `makeLeafNode` at lines ~81–104 — source of `driftAmpX/Y` and wobble fields; reduce amp ranges and remove wobble fields
- `GraphNode` interface at lines ~28–47 — remove `wobbAmpX`, `wobbAmpY`, `wobbFreq`, `wobbPhase` fields
- Animation loop at lines ~399–413 — remove the `// Secondary micro-wobble` block inside `motion !== 'off'`
- Node render at lines ~582–616 — `<circle r={r + 3} fill={n.color} opacity="0.28" filter={filterDrip} />` and `<circle r={r} fill={n.color} filter={filterDrip} />` become the star treatment

### Institutional Learnings

- From `docs/solutions/design-patterns/homepage-hero-graph-flat-constellation-2026-06-03.md`: keep `<defs>` block unconditional — unused filter definitions are harmless and avoiding JSX restructuring keeps the diff minimal. Only the filter *application* (the variable passed to `filter={}`) changes.

## Key Technical Decisions

- **`filterDrip` stays as a variable (just always `undefined`)**: avoids restructuring the JSX; the `<defs>` block is harmless when filters go unapplied. Consistent with the pattern established for mobile gating.
- **Remove wobble fields from `GraphNode` interface rather than zeroing them**: deletes three dead fields, simplifies the hot loop, and removes the `wobbAmpX/Y/Freq/Phase` assignments from `makeLeafNode`. Cleaner than leaving them at 0.
- **Paper fill on inner circle, color on halo**: `--paper` (#d9d4cb) reads against violet, coral, and kelp waves equally — a brightness contrast guarantee that a lighter tint of the brand color cannot provide.
- **SVG `fill="white"` for highlight dot**: a pure white pinpoint at ~70% opacity gives the hot-point effect without adding a CSS variable dependency to the SVG layer.

## Implementation Units

### U1. Strip filters and lean down animation

**Goal:** Remove SVG displacement filters from idle node and edge rendering; remove micro-wobble from the per-frame update; reduce drift amplitude ranges.

**Requirements:** R4, R5, R6, R7

**Dependencies:** None

**Files:**
- Modify: `components/HomeGraph.tsx`

**Approach:**
- Change `filterDrip` derivation from `(isMobile || highZoom) ? undefined : 'url(#drip)'` to simply `undefined`. The `isMobile` and `highZoom` variables and the `filterWave` derivation line can be removed or kept as dead variables — removing them is cleaner.
- Remove `wobbAmpX`, `wobbAmpY`, `wobbFreq`, `wobbPhase` from the `GraphNode` interface.
- Remove those four fields from `makeLeafNode`'s returned object.
- In `makeLeafNode`, change `driftAmpX: rand(0.2, 4.0)` → `rand(0.2, 2.0)` and `driftAmpY: rand(0.3, 5.0)` → `rand(0.3, 2.5)`.
- In the animation loop's `motion !== 'off'` block, remove the `// Secondary micro-wobble` block (the 4 lines computing `wx`/`wy` and adding them to `n.displayDX/DY`). `displayDX/DY` should be set from the primary drift only.

**Patterns to follow:**
- The mobile filter-gating pattern in the existing `filterDrip` derivation — change the variable, not the JSX structure

**Test scenarios:**
- Happy path: After 3 seconds of idle animation, no node appears to jitter or stutter at the default zoom level. Motion is slow and wavelike, not rapid or micro-vibrating.
- Edge case: With `motion="off"` prop, all `displayDX/DY` remain 0 — no drift, no wobble. Existing path for this case unchanged.
- Visual: At 1× zoom, nodes drift slowly by at most ~2px from their settled positions per second — not visibly wandering.

**Verification:**
- `npm run dev` → homepage loads, constellation is visible, no node jitters visibly at default view
- Node motion feels slow and atmospheric (not restless or twitchy)
- Browser devtools SVG inspector shows no `filter` attribute on node `<circle>` elements or the edge `<g>` at idle

### U2. Star visual rendering

**Goal:** Restyle each node as a luminous star: bright `--paper` core, soft brand-color outer glow, small white highlight pinpoint. Verify hover state renders correctly against the new base treatment.

**Requirements:** R1, R2, R3, R8

**Dependencies:** U1

**Files:**
- Modify: `components/HomeGraph.tsx`

**Approach:**
- The inner solid circle `<circle r={r} fill={n.color} filter={filterDrip} />` becomes `<circle r={r} fill="var(--paper)" opacity="0.92" />`.
- The outer halo `<circle r={r + 3} fill={n.color} opacity="0.28" filter={filterDrip} />` becomes a wider, softer glow: `<circle r={r * 4} fill={n.color} opacity="0.18" />`. Radius and opacity are tunable — aim for the halo to be clearly subordinate to the bright core.
- Add a highlight dot inside the inner group: `<circle r={r * 0.35} fill="white" opacity="0.7" />`. This sits after the inner circle in JSX so it renders on top.
- The hover `<circle r={r * 3.5} fill={n.color} opacity="0.14" />` halo is unchanged — it sits behind both circles and provides the on-hover color bloom. With the new wider idle halo at `r * 4` and `0.18` opacity, consider whether the hover halo needs a slight opacity bump (e.g., to 0.22) to remain perceptibly different from idle. This is a judgment call during implementation.
- The pulsing ring `<animate>` and scale-up on hover are unchanged.

**Patterns to follow:**
- Existing node render block at `components/HomeGraph.tsx` lines ~582–616 — the inner group, outer halo, and hover group structure stays the same; only `fill` values and `r` on the halo change

**Test scenarios:**
- Happy path (covers AE1): At default zoom, each node renders as a bright cream circle with a faint colored halo. No node blends into the wave backdrop — all are visually distinct points.
- Happy path: Coral, violet, and kelp nodes all maintain readable color identity through their halo ring despite having a uniform cream core.
- Edge case: At 1.5× zoom, labels appear below nodes in their brand color (fill `currentColor` via `color: var(--ink)` CSS); the paper-fill node body and the ink label together remain readable.
- Happy path (covers AE2): On hover, the node grows (r × 1.6), the color glow deepens, and the pulsing ring animates. The hover state is visually stronger than idle — the transition from idle to hover is perceptible.
- Integration: Hovering a paper-fill node still fires the `onHover` callback correctly, and the status banner shows the correct category tag and title.
- Edge case: Clicking a node navigates to its `href` after the 180ms spring animation — paper fill does not affect click/navigation behavior.

**Verification:**
- Homepage loads and the constellation is immediately visually distinct from the WaveBackdrop — individual nodes are legible without hovering
- Color identity (coral/violet/kelp) is readable from the halo alone
- Hovering any node shows a clear state change (glow, pulsing ring)
- Status banner updates correctly on hover
- No console errors

## Sources & References

- **Origin document:** [docs/brainstorms/2026-06-03-hero-graph-star-nodes.md](docs/brainstorms/2026-06-03-hero-graph-star-nodes.md)
- Prior pattern: `docs/solutions/design-patterns/homepage-hero-graph-flat-constellation-2026-06-03.md`
- Prior plan: `docs/plans/2026-06-03-001-feat-hero-graph-flat-constellation-plan.md`
