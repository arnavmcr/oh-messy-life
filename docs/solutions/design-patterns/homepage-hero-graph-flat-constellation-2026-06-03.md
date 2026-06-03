---
title: "Homepage Hero Graph: Flat Constellation Pattern"
date: 2026-06-03
category: design-patterns
module: frontend
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - Building or refactoring a force-directed graph where hub nodes exist primarily to orient viewers rather than provide meaningful navigation
  - Node click interactions need to split across two meanings (toggle vs navigate) — a signal the abstraction should be dissolved
  - SVG filters are applied unconditionally and mobile performance degrades on small viewports
  - "A rAF physics loop runs setState on every frame and ~30fps physics is needed without degrading gesture responsiveness"
  - Leaf nodes bunch at centre after hub removal — the fix is wider angle variance and distance range, not re-adding repulsion anchors
symptoms:
  - Hub nodes consume disproportionate visual weight and confuse click semantics (toggle vs navigate)
  - Anchor forces pull leaf nodes into spoke clusters instead of an organic spread
  - SVG feDisplacementMap filters and unbounded rAF loops drop frames on mobile viewports
related_components:
  - components/HomepageHero.tsx
tags:
  - force-directed-graph
  - constellation-layout
  - react-animation
  - mobile-performance
  - svg-filters
  - navigation-ux
  - visual-design
---

# Homepage Hero Graph: Flat Constellation Pattern

## Context

The homepage hero of Oh Messy Life is an interactive force-directed graph of site content. In its original hub-spoke form, four large category hub nodes (WRITING, RECORD, SIGNAL, LABS) anchored clusters of leaf nodes. Each hub had a toggle-click behaviour to show/hide its category, a spinning dashed ring animation on hover, and a dedicated href. This created several compounding problems: the hubs consumed disproportionate visual weight, their click behaviour was non-obvious (click to toggle category vs click to navigate — two different interactions on the same element), and the LABS cluster linked to `/projects` which did not exist.

More subtly, the hub-spoke topology worked against the stated aesthetic goal of a constellation feel. It looked like an org chart with decorative nodes rather than a field of stars. The `GraphNode.kind` discriminant (`'cat' | 'leaf'`) propagated through the data model, the physics simulation (`k_anchor` force branch, two-speed entry animation), and the render layer (separate `if (n.kind === 'cat')` render path). Removing the hubs required eliminating all three simultaneously.

On mobile, performance degraded further. Per-frame React state updates via `setTick` ran at the full rAF rate, and expensive SVG filter primitives (`feDisplacementMap` for drip and wave-edge effects) were applied to every node on every frame. The two-speed entry animation — hubs fading in first at 0–400ms, then leaves 300–1800ms — existed only to orient viewers through the hub abstraction. Removing the hubs collapsed that scheduling layer too.

The full implementation plan is at `docs/plans/2026-06-03-001-feat-hero-graph-flat-constellation-plan.md`. The origin brainstorm is at `docs/brainstorms/2026-06-03-homepage-graph-flat-constellation.md`.

## Guidance

### Remove hub nodes entirely — make every node a leaf

The `GraphNode.kind` discriminant had exactly three consumers: `buildGraph` (hub creation + branch edges), the physics `k_anchor` branch, and the render split. Deleting `kind` deletes all three simultaneously. The data model becomes a flat array of typed leaf nodes with no conditional paths in the hot loop.

The `CATS` constant retains per-category display data but sheds placement geometry. Angle hints move to a separate `CAT_ANGLES` lookup consumed only by `makeLeafNode` — kept as a clustering hint, not as anchor coordinates.

```typescript
// Before — CATS carries placement geometry; buildGraph emits hub nodes + branch edges
const CATS = [
  { id: 'writing', label: 'WRITING', cssColor: '#ff5573', orbit: 230, angle: -Math.PI / 2 },
  { id: 'labs',    label: 'LABS',    cssColor: '#e87a3a', orbit: 230, angle: Math.PI },
] as const;

interface GraphNode {
  id: string; kind: 'cat' | 'leaf'; label: string;
  ax?: number; ay?: number; // anchor coords for hub nodes
  // ...
}

// buildGraph created hub nodes with anchor coords:
CATS.forEach((c) => {
  const ax = Math.cos(c.angle) * c.orbit;
  const ay = Math.sin(c.angle) * c.orbit;
  nodes.push({ id: c.id, kind: 'cat', ax, ay, href: CAT_HREFS[c.id], ... });
});
// ...and branch edges hub → leaf:
writingLeaves.forEach((_, i) => edges.push({ a: 'writing', b: `w${i}`, kind: 'branch', len: 150 }));

// After — CATS is display-only; CAT_ANGLES is a lookup; buildGraph emits only leaves
const CATS = [
  { id: 'writing', label: 'WRITING', cssColor: '#ff5573' },
  { id: 'record',  label: 'RECORD',  cssColor: '#9b7fff' },
  { id: 'signal',  label: 'SIGNAL',  cssColor: '#5fc1a2' },
] as const;

const CAT_ANGLES: Record<string, number> = {
  writing: -Math.PI / 2,
  record: 0,
  signal: Math.PI / 2,
};

interface GraphNode {
  id: string; label: string; cat: string; r: number; color: string; href: string;
  x: number; y: number; vx: number; vy: number;
  // no kind, no ax/ay
}

// buildGraph: no hub loop, no branch edges — only leaf nodes
```

### Widen makeLeafNode spread to compensate for absent hub repulsion

Hub nodes previously acted as repulsion anchors keeping each category's leaves bunched in their quadrant. Without them, tight angle variance collapses leaves toward the canvas centre. The fix is wider variance on both angle jitter and distance.

```typescript
// Before — tight spread relative to hub orbit (~310–490px from origin)
function makeLeafNode(id, cat, label, href, rMin, rMax) {
  const a    = cat.angle + rand(-1.0, 1.0);
  const dist = cat.orbit + rand(80, 260);   // orbit=230, so 310–490px
  // ...
}

// After — wide spread filling the canvas (40–300px from origin, full angle range)
function makeLeafNode(id, cat, label, href, rMin, rMax) {
  const a    = CAT_ANGLES[cat.id] + rand(-1.6, 1.6);
  const dist = rand(40, 300);
  // ...
}
```

### Replace k_anchor physics with uniform center pull

The `k_anchor` force pulled each hub node toward its fixed anchor coordinates, which in turn dragged leaf nodes via branch-edge spring forces. With hub nodes gone, replace the entire `if (n.kind === 'cat') / else` branch with a single weak center pull on all nodes.

```typescript
// Before — hub gets anchor pull; leaf gets weak center pull
for (let i = 0; i < nodes.length; i++) {
  const n = nodes[i];
  if (n.kind === 'cat') {
    n.fx! += (n.ax! - n.x) * k_anchor;   // k_anchor = 0.04
    n.fy! += (n.ay! - n.y) * k_anchor;
  } else {
    n.fx! += -n.x * k_center;             // k_center = 0.0010
    n.fy! += -n.y * k_center;
  }
}

// After — all nodes get the same weak center pull
for (let i = 0; i < nodes.length; i++) {
  const n = nodes[i];
  n.fx! += -n.x * k_center;
  n.fy! += -n.y * k_center;
}
```

### Gate expensive SVG filters on mobile

SVG `feDisplacementMap` paint calls exceed the 16ms frame budget on mid-range phones. The filter `<defs>` block remains unconditional (avoids JSX restructuring); only the filter application is gated.

```typescript
// In render — derive isMobile from size state (kept in sync by ResizeObserver)
const isMobile   = size.w < 640;
const filterDrip = isMobile ? undefined : 'url(#drip)';
const filterWave = isMobile ? undefined : 'url(#wave-edge)';

// SVG defs block stays unconditional — unused filters are harmless
// Filter application in node/edge render:
<circle r={r + 3} fill={n.color} opacity="0.28" filter={filterDrip} />
<g transform={groupTransform} fill="none" filter={filterWave}>
```

### Frame-skip pattern for mobile physics

The rAF loop stays at native frequency so pinch/pan gesture handling remains responsive. Physics and React state updates are skipped on odd frames when `isMobile`. The settle timer advances every frame regardless so the animation doesn't stretch to double duration.

```typescript
const frameSkipRef = useRef(0);
const sizeRef      = useRef(size); // updated every render via sizeRef.current = size

// Inside the rAF step function:
const step = (now: number) => {
  const isMobile  = sizeRef.current.w < 640;
  const SETTLE_MS = isMobile ? 1400 : 2800;

  frameSkipRef.current++;
  const shouldUpdate = !isMobile || frameSkipRef.current % 2 === 0;

  const frameDelta = now - last;
  const dt = Math.min(40, frameDelta) / 16.6;
  entryMsRef.current  = Math.min(entryMsRef.current + frameDelta, 2000);
  settleRef.current  += dt * 16.6; // always advance — not gated by shouldUpdate
  last = now;

  if (shouldUpdate) {
    tRef.current += dt;
    // ... physics, drift, setTick
  }

  rafRef.current = requestAnimationFrame(step);
};
```

### Collapse multi-speed entry animation to a single fade

The two-speed entry (hubs 0–400ms, leaves 300–1800ms) existed solely to orient viewers through the hub hierarchy before leaves appeared. With hubs gone, a single 1.2s fade is cleaner.

```typescript
// Before
const catEntryOpacity  = Math.min(1, entryMsRef.current / 400);
const leafEntryOpacity = Math.max(0, Math.min(1, (entryMsRef.current - 300) / 1500));
// ...
const entryOp = n.kind === 'cat' ? catEntryOpacity : leafEntryOpacity;

// After
const entryOpacity = Math.min(1, entryMsRef.current / 1200);
// ...
const op = baseOp * entryOpacity; // same for all nodes
```

### Labels at zoom threshold with scale-normalised font

Leaf node labels are hidden at default zoom (they would overlap) and appear only when the user zooms in enough for the canvas to breathe. `fontSize={10 / view.scale}` keeps the physical label size consistent at any zoom level.

```tsx
const LABEL_THRESHOLD = 1.5;

// Inside each leaf node's <g>:
{view.scale >= LABEL_THRESHOLD && (
  <text
    y={n.r + 14}
    textAnchor="middle"
    fontFamily="var(--font-mono-stack)"
    fontSize={10 / view.scale}   // normalised: always ~10px physical size
    opacity="0.65"
    fill="currentColor"
    style={{ pointerEvents: 'none' }}  // labels don't steal clicks
  >
    {n.label.length > 24 ? n.label.slice(0, 22) + '…' : n.label}
  </text>
)}
```

## Why This Matters

**Aesthetic coherence.** The constellation metaphor requires nodes of roughly equal visual weight distributed across the canvas. Hub nodes at radius ~30px against leaf nodes at 4–11px created a strict hierarchy that read as an org chart. Removing them makes the graph feel like a field of stars — variable density, no anchor points, emergent clusters.

**Interaction clarity.** The hub toggle-then-navigate pattern required two different actions on the same element. Every node now does one thing on click: navigate. Category filtering moves to the legend chips. Splitting these responsibilities eliminates ambiguity and makes the graph predictable.

**Dead link elimination.** LABS hub and all its leaves linked to `/projects` which did not exist. Removing the category from the graph (rather than patching hrefs) is the right call when the destination route itself is not ready — it avoids exposing 404s and removes the legend chip automatically.

**Mobile frame budget.** `feDisplacementMap` on every SVG node every rAF frame consistently exceeds 16ms on mid-range phones. The frame-skip + filter-gate combination brings physics to ~30fps while keeping gesture handling at native fps. This avoids a full canvas rewrite.

**Maintenance surface.** The `kind` discriminant had three consumers in the hot path. Deleting `kind` deleted all three simultaneously. The data model, physics loop, and render path are each simpler with no conditional branches.

## When to Apply

- A force-directed graph has category containers (hub nodes, group nodes) that exist primarily to orient viewers — not as meaningful navigation destinations.
- Node click interactions split across two meanings on the same element — this is a signal to dissolve the abstraction and reassign responsibilities to separate UI elements (e.g., legend for filtering, click for navigation).
- A hover/legend filter mechanism already exists or can be added — at that point hub toggle-click is redundant.
- Leaf spread collapses to the canvas centre after hub node removal — widen angle variance and distance range, do not re-add anchor forces.
- SVG filters are applied unconditionally — gate via a computed variable, keep `<defs>` unconditional to avoid JSX restructuring.
- A rAF physics loop runs `setState` every frame and 30fps physics is sufficient — use a frame-skip counter, not `setTimeout` throttling, so the loop stays at native fps for gestures.
- A graph's entry animation has a multi-speed schedule tied to a node hierarchy that is being removed — collapse to a single opacity curve.
- Graph nodes reference routes that do not yet exist — remove the nodes rather than leaving dead hrefs.

## Examples

See the [Guidance](#guidance) section above — each pattern includes a before/after code example. For the full six-unit implementation, see `docs/plans/2026-06-03-001-feat-hero-graph-flat-constellation-plan.md`.

## Related

- Origin brainstorm: `docs/brainstorms/2026-06-03-homepage-graph-flat-constellation.md`
- Implementation plan: `docs/plans/2026-06-03-001-feat-hero-graph-flat-constellation-plan.md`
- Prior perf foundation (nodeMap, RAF pause, touch): `docs/plans/2026-06-01-001-feat-site-polish-sprint-plan.md`
