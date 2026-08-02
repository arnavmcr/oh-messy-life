---
date: 2026-08-02
topic: homegraph-connected-node-pulse
---

# Hero Graph — Connected-Node Pulse

## Summary

When hovering a node that has at least one edge, replace the current static hover treatment (scale-up + thin expanding ring, identical for every node) with a distinct "pulse" system: a slow breathing bloom on the origin node, and a small colored dot that travels from the origin along each connecting edge's own path to every neighbor, arriving at all of them simultaneously regardless of edge length. Nodes with no edges keep today's plain hover unchanged.

---

## Problem Frame

Feedback from Sachin (logged in `BACKLOG.md`, 2026-08-02): moving hover between two nodes that share an edge currently looks identical to moving between two unrelated nodes. `hoverId` swaps, `highlightSet` (hovered node + `adj`/`tagAdj` neighbors) recomputes, and everything fades via a flat 0.3s CSS opacity transition — there's no visual signal that a connection exists beyond a static highlight. The ask: a more dynamic, larger-spread-of-colour, more prominent-line interaction specifically for hovering a connected node — described as "a pulse sent from the main node to all the nodes involved."

`components/HomeGraph.tsx` currently has two edge concepts: `adj` (built from `buildGraph`'s `edges`, which is always empty — no `'branch'` edges are ever pushed) and `tagAdj` (built from the `tagEdges` prop, passed in by the page). In practice, every connection rendered today is a `'tag'`-kind edge. The design below treats `adj ∪ tagAdj` generically so it keeps working if `'branch'` edges are reintroduced later.

---

## Requirements

**Trigger**

- R1. On desktop (`!isTouchRef.current`) only, when `hoverId` is set to a node `n` where `(adj.get(n.id)?.size ?? 0) + (tagAdj.get(n.id)?.size ?? 0) > 0`, the node enters "connected hover" state. Mobile tap behavior (`tappedId`) is untouched.
- R2. A node with no neighbors keeps exactly today's hover behavior: `r * 1.6` scale, thin expanding-ring `<animate>` (`isHover` block, `components/HomeGraph.tsx:618-623`).

**Origin bloom**

- R3. For a connected hover, the thin pulsing ring (R2's `<circle>` with `r`/`opacity` `<animate>`) is replaced by a breathing animation on the node's own blob (`blobR` circle): radius and opacity ease up and back down on a repeating cycle, `PULSE_CYCLE_MS = 2200`, in the node's own `n.color`.
- R4. The breathing bloom loops for as long as the node stays hovered and stops the instant hover leaves (conditional render — no manual cleanup).

**Traveling pulse**

- R5. For each neighbor edge of the hovered node, render a small bright dot (origin's `n.color`, lightened — e.g. mixed toward white/`--paper`) that travels along that edge's own rendered path via SVG `<animateMotion>` + `<mpath>` referencing the edge `<path>`'s `id`.
- R6. Every edge's `<animateMotion>` uses the same fixed `dur={PULSE_CYCLE_MS}ms` regardless of the edge's geometric length, so dots on short and long edges arrive at their targets at the same moment. `repeatCount="indefinite"` while the origin stays hovered.
- R7. Edge `<path>` elements need a stable `id` (e.g. `edge-${i}`) so `<mpath>` can reference them; this is new — edges currently have no `id` attribute.

**Receiving bloom**

- R8. Each neighbor node gets its own brief blob bloom, using the same breathing keyframe as R3 but with `animation-delay: {PULSE_CYCLE_MS}ms` so it visibly lights up right as the traveling dot arrives, then settles back with the rest of the cycle.

**Edge line emphasis**

- R9. While the origin is in connected-hover state, its connecting edges get a stronger *static* stroke-width/opacity boost than today's generic `hl` highlight values (`components/HomeGraph.tsx:525,527`) — no separate line-breathing animation; the traveling dot supplies the motion, the boosted stroke supplies the "more prominent line" ask.

**Non-goals**

- R10. No changes to pan/zoom/pinch, click/navigation, entry fade, category legend toggling, or the physics/settle RAF loop (`step()`). This is purely additive rendering scoped to the hover-connected-node case.
- R11. No changes to mobile tap behavior (R1).

---

## Acceptance Examples

- AE1. **Covers R1, R2.** Hovering an isolated node (no edges) looks exactly as it does today — scale-up + thin expanding ring. No bloom, no dots.
- AE2. **Covers R3, R4, R5, R6.** Hovering a connected node shows its own blob breathing in its brand color, and a small colored dot departing along each of its edges. A short edge and a long edge from the same origin both deliver their dot at the same instant, ~2.2s after hover starts (and every 2.2s thereafter while still hovered).
- AE3. **Covers R8.** The instant a dot reaches a neighbor node, that neighbor's own blob visibly blooms once before settling — not before, not noticeably after.
- AE4. **Covers R9.** Edges from a hovered connected node read thicker/brighter than the same edges did under the old static `hl` highlight (e.g. when a *different*, non-hovered node in the same neighborhood was previously highlighted).
- AE5. **Covers R10, R11.** Panning, zooming, clicking through to a node's page, and mobile tap-to-preview/tap-to-navigate all behave identically to before this change.

---

## Success Criteria

- A first-time visitor can tell, purely from the hover animation, whether the node they're on is connected to anything, without reading the legend or clicking through.
- Moving hover from a connected node to one of its neighbors reads as materially more dynamic than moving to an unrelated node — the bar Sachin's feedback set.
- No new work is added to the physics/settle RAF loop (`step()`); the pulse system is fully declarative SVG (`<animate>`/`<animateMotion>`) and CSS keyframes, mounted/unmounted via conditional render.
- No regression to existing hover, click, pan, zoom, or mobile-tap behavior on unconnected nodes.

---

## Scope Boundaries

- No changes to `WaveBackdrop.tsx`, `HomepageHero.tsx`, or any route component.
- No changes to node/edge topology, `buildGraph`, or the `tagEdges` data passed in from the page.
- No new dependencies — everything is native SVG (`<animate>`, `<animateMotion>`, `<mpath>`) and CSS `@keyframes` in `app/globals.css`, consistent with the existing pulsing-ring pattern already in this component.
- Item 1 from the same feedback batch (dot blurriness on load) is tracked separately in `BACKLOG.md` and is explicitly out of scope here.

---

## Key Decisions

- **Trigger is "hovered node has neighbors," not "previous hover was a neighbor":** simpler to reason about and implement, and matches the literal ask ("pulse sent from the main node to all the nodes involved") — the pulse is a property of the node you're on, not of the transition path you took to get there.
- **Fixed duration, not fixed speed, for `<animateMotion>`:** per explicit direction — dots must arrive at every neighbor simultaneously regardless of edge length, which SVG's duration-based (not speed-based) motion animation gives for free.
- **Declarative SVG over JS/RAF-driven pulses:** conditional-render mount/unmount means no manual pulse-array bookkeeping or cleanup, and nothing is added to the performance-sensitive physics loop. Considered and rejected: a JS-driven traveling pulse computed per-frame in `step()` (more "alive," perfectly synced to the wavy edge's own motion, but adds bezier point-at-*t* math to the hot path) and a non-traveling static flash (cheapest, but doesn't deliver the "pulse sent along the lines" feel that was explicitly requested).
- **Bloom replaces the thin ring for connected nodes, rather than layering on top:** the ask was for "a larger spread of the colour," which is a fill/blob effect, not an outline — reusing the same ring alongside a new bloom would compete visually.
