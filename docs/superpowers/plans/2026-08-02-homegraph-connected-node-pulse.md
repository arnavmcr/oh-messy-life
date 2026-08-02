# HomeGraph Connected-Node Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give hovering a connected node in `components/HomeGraph.tsx` a distinct, dynamic pulse animation — a breathing bloom on the origin node plus a small colored dot that travels along each connecting edge and arrives at every neighbor simultaneously — replacing the current generic hover treatment, which today looks identical whether or not the two nodes share an edge.

**Architecture:** Two small pure helper functions (`lib/graph-pulse.ts`) drive a new `pulseNeighborIds` memo in `HomeGraph.tsx`. Rendering stays entirely declarative SVG: edges get a stable `id` + a conditionally-rendered `<animateMotion>`/`<mpath>` dot, nodes get a CSS class (`.node-pulse-bloom`, new in `app/globals.css`) toggled in place of the existing pulsing-ring hover state. Nothing is added to the physics/settle `requestAnimationFrame` loop.

**Tech Stack:** Next.js App Router (TypeScript), React client component, native SVG animation (`<animate>`, `<animateMotion>`, `<mpath>`), CSS `@keyframes`, Vitest for the pure-function unit tests.

## Global Constraints

- No new dependencies — everything is native SVG/CSS, consistent with `AGENTS.md`'s "no new dependencies without discussion."
- Desktop-only trigger: mobile tap behavior (`tappedId`, `isTouchRef`) is untouched (spec R1, R11). This falls out naturally — `setHoverId` is only ever called when `!isTouchRef.current` — so no extra guard is needed beyond what already exists.
- Fixed **duration**, not fixed **speed**, for every edge's `<animateMotion dur=...>` — do not scale `dur` by edge length. This is what makes every neighbor's dot arrive simultaneously regardless of edge length (spec R6).
- Nodes with no edges must render exactly as before — same `isHover` scale-up + thin expanding ring (spec R2).
- This environment has known issues running `tsc` / `next build` / plain `git commit` directly (they can hang at 0% CPU). Do **not** run `tsc --noEmit` or `next build` as a verification step. Use `vitest run` for automated tests, and verify the visual behavior with `next dev` + a real browser. For commit steps, use git plumbing (`git write-tree` + `git commit-tree` + `git update-ref`) instead of `git commit`, which bypasses any hook that might hang.

---

### Task 1: Pulse helper utilities

**Files:**
- Create: `lib/graph-pulse.ts`
- Test: `lib/__tests__/graph-pulse.test.ts`

**Interfaces:**
- Produces: `PULSE_CYCLE_MS: number`, `getConnectedNeighbors(id: string, adj: Map<string, Set<string>>, tagAdj: Map<string, Set<string>>): string[]`, `lightenHexColor(hex: string, amount: number): string` — all consumed by `components/HomeGraph.tsx` in Tasks 3 and 4, and by `app/globals.css` (duration value only, as a comment reference — CSS can't import JS).

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/graph-pulse.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getConnectedNeighbors, lightenHexColor, PULSE_CYCLE_MS } from '../graph-pulse';

describe('getConnectedNeighbors', () => {
  it('unions adj and tagAdj neighbors for a node', () => {
    const adj = new Map([['a', new Set(['b'])]]);
    const tagAdj = new Map([['a', new Set(['c'])]]);
    expect(getConnectedNeighbors('a', adj, tagAdj).sort()).toEqual(['b', 'c']);
  });

  it('dedupes a neighbor present in both maps', () => {
    const adj = new Map([['a', new Set(['b'])]]);
    const tagAdj = new Map([['a', new Set(['b'])]]);
    expect(getConnectedNeighbors('a', adj, tagAdj)).toEqual(['b']);
  });

  it('returns an empty array for a node with no edges', () => {
    const adj = new Map<string, Set<string>>();
    const tagAdj = new Map<string, Set<string>>();
    expect(getConnectedNeighbors('a', adj, tagAdj)).toEqual([]);
  });
});

describe('lightenHexColor', () => {
  it('returns the original color at amount 0', () => {
    expect(lightenHexColor('#ff5573', 0)).toBe('#ff5573');
  });

  it('returns white at amount 1', () => {
    expect(lightenHexColor('#ff5573', 1)).toBe('#ffffff');
  });

  it('mixes partway toward white at amount 0.5', () => {
    expect(lightenHexColor('#000000', 0.5)).toBe('#808080');
  });
});

describe('PULSE_CYCLE_MS', () => {
  it('is a positive duration in milliseconds', () => {
    expect(PULSE_CYCLE_MS).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node_modules/.bin/vitest run lib/__tests__/graph-pulse.test.ts`
Expected: FAIL — `lib/graph-pulse.ts` doesn't exist yet (`Cannot find module '../graph-pulse'`).

- [ ] **Step 3: Write the implementation**

Create `lib/graph-pulse.ts`:

```ts
// Keep in sync with the `pulseBloom` keyframe duration (2200ms) in app/globals.css —
// CSS keyframes can't import this constant, so the two must be updated together.
export const PULSE_CYCLE_MS = 2200;

export function getConnectedNeighbors(
  id: string,
  adj: Map<string, Set<string>>,
  tagAdj: Map<string, Set<string>>,
): string[] {
  const ids = new Set<string>();
  adj.get(id)?.forEach((n) => ids.add(n));
  tagAdj.get(id)?.forEach((n) => ids.add(n));
  return Array.from(ids);
}

export function lightenHexColor(hex: string, amount: number): string {
  const clamped = Math.max(0, Math.min(1, amount));
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * clamped);
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node_modules/.bin/vitest run lib/__tests__/graph-pulse.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/graph-pulse.ts lib/__tests__/graph-pulse.test.ts
TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "feat(graph): add connected-node pulse helper utilities")
git update-ref HEAD "$COMMIT"
```

---

### Task 2: Pulse bloom CSS keyframe

**Files:**
- Modify: `app/globals.css:421-429`

**Interfaces:**
- Consumes: nothing.
- Produces: `.node-pulse-bloom` class + `pulseBloom` keyframe, consumed by `components/HomeGraph.tsx` in Task 4.

- [ ] **Step 1: Add the keyframe and class**

In `app/globals.css`, the graph stage section currently reads (around line 421):

```css
.graph-stage.panning { cursor: grabbing; touch-action: none; }
.graph-stage svg.graph {
  width: 100%; height: 100%;
  display: block;
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

/* Zoom controls */
```

Insert a new block between the `svg.graph` rule and the `/* Zoom controls */` comment:

```css
.graph-stage.panning { cursor: grabbing; touch-action: none; }
.graph-stage svg.graph {
  width: 100%; height: 100%;
  display: block;
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

/* Connected-node hover pulse — keyframe duration must stay in sync with
   PULSE_CYCLE_MS in lib/graph-pulse.ts */
@keyframes pulseBloom {
  0%   { transform: scale(1);    opacity: 0.75; }
  50%  { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1);    opacity: 0.75; }
}
.node-pulse-bloom {
  transform-box: fill-box;
  transform-origin: center;
  animation: pulseBloom 2200ms ease-in-out infinite;
}

/* Zoom controls */
```

- [ ] **Step 2: Verify the file still parses**

Run: `node_modules/.bin/next dev` (leave running), then open the homepage in a browser and confirm the page renders with no console errors about `globals.css`. Stop the dev server after confirming (`Ctrl+C`) — the visual effect itself isn't checkable yet since nothing references `.node-pulse-bloom` until Task 4.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "feat(graph): add pulseBloom keyframe for connected-node hover")
git update-ref HEAD "$COMMIT"
```

---

### Task 3: Edge pulse wiring — stable IDs, boosted highlight, traveling dot

**Files:**
- Modify: `components/HomeGraph.tsx:1-3` (imports), `:453-459` (add `pulseNeighborIds` memo after `highlightSet`), `:515-546` (edges render block)

**Interfaces:**
- Consumes: `getConnectedNeighbors`, `lightenHexColor`, `PULSE_CYCLE_MS` from `lib/graph-pulse.ts` (Task 1).
- Produces: `pulseNeighborIds: Set<string> | null` (component-scoped `useMemo` result), consumed by `components/HomeGraph.tsx` node rendering in Task 4. Also produces the `edge-${i}` DOM `id` convention on edge `<path>` elements, referenced only within this same render block.

- [ ] **Step 1: Add the import**

In `components/HomeGraph.tsx`, current lines 1-3:

```tsx
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
```

Add the new import as line 4:

```tsx
'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getConnectedNeighbors, lightenHexColor, PULSE_CYCLE_MS } from '@/lib/graph-pulse';
```

- [ ] **Step 2: Add the `pulseNeighborIds` memo**

Find the existing `highlightSet` memo (around line 453):

```tsx
  const highlightSet = useMemo(() => {
    if (!hoverId) return null;
    const s = new Set<string>([hoverId]);
    adj.get(hoverId)?.forEach((id) => s.add(id));
    tagAdj.get(hoverId)?.forEach((id) => s.add(id));
    return s;
  }, [hoverId, adj, tagAdj]);
```

Add a new memo immediately after it:

```tsx
  const highlightSet = useMemo(() => {
    if (!hoverId) return null;
    const s = new Set<string>([hoverId]);
    adj.get(hoverId)?.forEach((id) => s.add(id));
    tagAdj.get(hoverId)?.forEach((id) => s.add(id));
    return s;
  }, [hoverId, adj, tagAdj]);

  // Non-null only when the hovered node has at least one edge — this is what
  // distinguishes "connected hover" (pulse system) from a plain hover on an
  // isolated node (unchanged ring behavior).
  const pulseNeighborIds = useMemo(() => {
    if (!hoverId) return null;
    const ids = getConnectedNeighbors(hoverId, adj, tagAdj);
    return ids.length > 0 ? new Set(ids) : null;
  }, [hoverId, adj, tagAdj]);
```

- [ ] **Step 3: Rewrite the edges render block**

Find the current edges block (around line 515):

```tsx
        {/* edges */}
        <g transform={groupTransform} fill="none">
          {edges.map((e, i) => {
            const a = nodeMap.get(e.a);
            const b = nodeMap.get(e.b);
            if (!a || !b) return null;
            const visible = isVisible(a) && isVisible(b);
            const hl = highlightSet ? (highlightSet.has(a.id) && highlightSet.has(b.id)) : false;
            const dim = highlightSet ? !hl : !visible;
            const isTag = e.kind === 'tag';
            const opacity = !visible ? (isTag ? 0.02 : 0.03) : dim ? (isTag ? 0.03 : 0.05) : hl ? (isTag ? 0.50 : 0.60) : (isTag ? 0.14 : 0.18);
            const stroke = isTag ? '#9b7fff' : '#0e1822';
            const sw = (isTag ? (hl ? 0.6 : 0.35) : (hl ? 0.75 : 0.4)) / Math.max(0.6, view.scale);
            const dash = isTag ? '3 6' : 'none';
            const amp = isTag ? 10 : 11;
            const ax = a.x + (a.displayDX ?? 0);
            const ay = a.y + (a.displayDY ?? 0);
            const bx = b.x + (b.displayDX ?? 0);
            const by = b.y + (b.displayDY ?? 0);
            return (
              <path
                key={i}
                d={wavyEdgePath(ax, ay, bx, by, tRef.current, amp, i * 0.6)}
                stroke={stroke}
                strokeWidth={sw}
                strokeDasharray={dash}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}
        </g>
```

Replace it with:

```tsx
        {/* edges */}
        <g transform={groupTransform} fill="none">
          {edges.map((e, i) => {
            const a = nodeMap.get(e.a);
            const b = nodeMap.get(e.b);
            if (!a || !b) return null;
            const visible = isVisible(a) && isVisible(b);
            const hl = highlightSet ? (highlightSet.has(a.id) && highlightSet.has(b.id)) : false;
            const dim = highlightSet ? !hl : !visible;
            const isTag = e.kind === 'tag';
            const isPulseEdge = !!pulseNeighborIds && hoverId !== null && (e.a === hoverId || e.b === hoverId);
            const opacity = !visible
              ? (isTag ? 0.02 : 0.03)
              : dim
              ? (isTag ? 0.03 : 0.05)
              : isPulseEdge
              ? (isTag ? 0.70 : 0.85)
              : hl
              ? (isTag ? 0.50 : 0.60)
              : (isTag ? 0.14 : 0.18);
            const stroke = isTag ? '#9b7fff' : '#0e1822';
            const sw =
              (isPulseEdge ? (isTag ? 0.9 : 1.1) : isTag ? (hl ? 0.6 : 0.35) : (hl ? 0.75 : 0.4)) /
              Math.max(0.6, view.scale);
            const dash = isTag ? '3 6' : 'none';
            const amp = isTag ? 10 : 11;
            const ax = a.x + (a.displayDX ?? 0);
            const ay = a.y + (a.displayDY ?? 0);
            const bx = b.x + (b.displayDX ?? 0);
            const by = b.y + (b.displayDY ?? 0);
            const edgeId = `edge-${i}`;
            const originNode = isPulseEdge ? nodeMap.get(hoverId!) : undefined;
            const dotColor = originNode ? lightenHexColor(originNode.color, 0.55) : stroke;
            return (
              <g key={i}>
                <path
                  id={edgeId}
                  d={wavyEdgePath(ax, ay, bx, by, tRef.current, amp, i * 0.6)}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeDasharray={dash}
                  strokeLinecap="round"
                  opacity={opacity}
                />
                {isPulseEdge && (
                  <circle r={2.2 / view.scale} fill={dotColor} opacity={0.9}>
                    <animateMotion dur={`${PULSE_CYCLE_MS}ms`} repeatCount="indefinite">
                      <mpath href={`#${edgeId}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}
        </g>
```

- [ ] **Step 4: Verify with the dev server**

Run: `node_modules/.bin/next dev`

Open the homepage. Hover a writing-article node that has a tag connection (check `tagEdges` data via the page that renders `HomeGraph` if unsure which nodes are connected — any two nodes sharing a visible dashed violet edge qualify). Confirm:
- A small dot appears riding along the dashed edge line, looping continuously while hovered.
- The edge itself looks thicker/brighter than it did under plain highlighting before this change.
- Hovering a node with no edges shows no dot and no boosted edge styling (there's nothing to boost).

Stop the dev server (`Ctrl+C`) after confirming. Node bloom/ring behavior isn't wired yet — that's Task 4 — so the old ring will still show on every hovered node at this point, including connected ones. That's expected until Task 4 lands.

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `node_modules/.bin/vitest run`
Expected: PASS — existing `gig-utils` tests and the new `graph-pulse` tests all green.

- [ ] **Step 6: Commit**

```bash
git add components/HomeGraph.tsx
TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "feat(graph): render traveling pulse dot along connected-node edges")
git update-ref HEAD "$COMMIT"
```

---

### Task 4: Node bloom wiring — origin breathing, receiving delay, ring fallback

**Files:**
- Modify: `components/HomeGraph.tsx` (node render block, originally lines 549-642 — will have shifted slightly after Task 3's edit; locate via the quoted snippets below)

**Interfaces:**
- Consumes: `pulseNeighborIds` (Task 3), `.node-pulse-bloom` CSS class + `PULSE_CYCLE_MS`-synced keyframe (Task 2), `PULSE_CYCLE_MS` (Task 1).
- Produces: final user-facing behavior — nothing downstream depends on this task.

- [ ] **Step 1: Add `isPulseOrigin` / `isPulseTarget` to the per-node computed values**

Find this block inside the `nodes.map((n) => { ... })` callback:

```tsx
            const visible   = isVisible(n);
            const isHover   = hoverId   === n.id;
            const isClicked = clickedId === n.id;
            const hl  = highlightSet ? highlightSet.has(n.id) : false;
```

Replace with:

```tsx
            const visible   = isVisible(n);
            const isHover   = hoverId   === n.id;
            const isClicked = clickedId === n.id;
            // Mutually exclusive: a node's own adj/tagAdj entries never include itself,
            // so a node can't be both the pulse origin and one of its own targets.
            const isPulseOrigin = isHover && pulseNeighborIds !== null;
            const isPulseTarget = pulseNeighborIds !== null && pulseNeighborIds.has(n.id);
            const hl  = highlightSet ? highlightSet.has(n.id) : false;
```

- [ ] **Step 2: Swap the blob/ring rendering**

Find:

```tsx
                  {/* Gradient blob — single element, white center → brand color → transparent */}
                  <circle r={blobR} fill={`url(#blob-${n.cat})`} />
                  {/* Pulsing ring on hover */}
                  {isHover && (
                    <circle r={r + 9} fill="none" stroke={n.color} strokeWidth={1.4 / view.scale} opacity="0.6">
                      <animate attributeName="r" from={r + 9} to={r + 26} dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
```

Replace with:

```tsx
                  {/* Gradient blob — single element, white center → brand color → transparent.
                      Breathes via .node-pulse-bloom when this node is the hovered origin of a
                      connected-node pulse, or a delayed echo of it when this node is one of the
                      pulse targets (the delay lines the bloom up with the traveling dot's arrival). */}
                  <circle
                    r={blobR}
                    fill={`url(#blob-${n.cat})`}
                    className={isPulseOrigin || isPulseTarget ? 'node-pulse-bloom' : undefined}
                    style={isPulseTarget ? { animationDelay: `${PULSE_CYCLE_MS}ms` } : undefined}
                  />
                  {/* Pulsing ring on hover — only for nodes with no connections; connected
                      nodes get the blob bloom above instead. */}
                  {isHover && !isPulseOrigin && (
                    <circle r={r + 9} fill="none" stroke={n.color} strokeWidth={1.4 / view.scale} opacity="0.6">
                      <animate attributeName="r" from={r + 9} to={r + 26} dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
```

- [ ] **Step 3: Verify with the dev server — full feature check**

Run: `node_modules/.bin/next dev`

Open the homepage and check each of these against the spec's acceptance examples:
- **AE1:** Hover a node with no edges — plain scale-up + thin expanding ring, exactly as before. No bloom.
- **AE2:** Hover a connected node — its blob visibly breathes (grows/brightens and eases back) on a ~2.2s cycle, and a dot departs along each of its edges, all arriving at their respective neighbors at the same instant regardless of how long each edge is.
- **AE3:** Watch a neighbor node when the pulse reaches it — its own blob should visibly bloom right as the dot arrives, then settle.
- **AE4:** Compare edge thickness/brightness on a hovered connected node's edges against how the same edges looked under the old static highlight (Task 3's before-state, or compare against a *different* non-hovered highlighted edge if one is visible) — the hovered node's edges should read more prominent.
- **AE5:** Confirm pan, zoom, pinch, click-through navigation, and mobile tap-to-preview/tap-to-navigate (test with browser dev tools device emulation or an actual touch device) are unchanged.

Stop the dev server (`Ctrl+C`) after confirming.

- [ ] **Step 4: Run the full test suite**

Run: `node_modules/.bin/vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/HomeGraph.tsx
TREE=$(git write-tree)
PARENT=$(git rev-parse HEAD)
COMMIT=$(git commit-tree "$TREE" -p "$PARENT" -m "feat(graph): breathing bloom for connected-node hover, replacing ring")
git update-ref HEAD "$COMMIT"
```

---

## After This Plan

Update `BACKLOG.md` item 2's status line from `[ SPEC DONE — plan next ]` to done/shipped, and consider adding a line to `ROADMAP.md`'s Decisions Log documenting the "hover-node-has-neighbors is the pulse trigger" and "fixed duration not fixed speed" decisions, matching the existing entries for the 2026-06-03 hero graph work.
