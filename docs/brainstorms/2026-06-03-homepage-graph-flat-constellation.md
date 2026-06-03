---
date: 2026-06-03
topic: homepage-graph-flat-constellation
supersedes: 2026-05-27-homepage-graph-expansion.md
---

# Homepage Graph — Flat Constellation Redesign

## Summary

Remove the 4 parent hub nodes (WRITING, RECORD, SIGNAL, LABS) from the hero graph and replace the hub-spoke topology with a flat constellation of all leaf nodes. Each node must link to a page that actually exists. Tag-based cross-links (writing ↔ record nodes sharing a tag) are the only edges. Labels are hidden at default zoom and revealed past a zoom threshold. Mobile and desktop rendering should both be visually smooth.

---

## Problem Frame

The current graph is hub-spoke: four large category circles anchor clusters of smaller leaf nodes. This structure imposes a taxonomic hierarchy that competes with the "everything is connected" feeling the graph should convey. The hub nodes also consume visual weight without linking to useful destinations — clicking them toggles the category rather than navigating anywhere.

Additionally, the graph is choppy on mobile: the SVG displacement filters and per-frame React state updates are expensive, and the initial settle phase is visually jarring on small screens.

---

## Requirements

### Node set

- R1. The 4 hub nodes (WRITING, RECORD, SIGNAL, LABS) are removed entirely.
- R2. Writing leaf nodes: all published posts from `getAllPosts()`, each linking to `/writing/[slug]`.
- R3. Record leaf nodes: all entries from `getAllJournalEntries()`, each linking to `/record/[slug]`.
- R4. Signal leaf nodes: exactly 2 hardcoded nodes —
  - "The Library" → `/music/index.html`
  - "Gig Archive" → `/music/gig-archive`
- R5. Labs leaf nodes: 0 — no `/projects` route exists. Labs category is removed from the graph until a real page exists.
- R6. No node may link to a path that is not a real, served route. The three formerly-hardcoded Signal nodes (T-shirt archive, Boiler Room Bengaluru, Awestrung @ Bluefrog) are removed from `SIGNAL_LEAVES`; the Boiler Room and Awestrung articles appear naturally as writing nodes via R2.

### Edges

- R7. Tag-based cross-links between writing and record leaf nodes that share at least one tag are the only rendered edges. The existing `buildTagEdges()` logic in `app/page.tsx` is unchanged.
- R8. No branch edges (hub → leaf). No category-internal edges.
- R9. Signal and Labs nodes are isolated (no edges) — they sit as standalone dots in the graph.

### Layout and physics

- R10. Without hub anchor positions, the `k_anchor` force (which pinned category nodes to fixed coordinates) is removed. Leaf node initial positions are distributed across the canvas.
- R11. Tag-edge spring forces and inter-node repulsion remain as the layout engine. Writing/record nodes with shared tags will drift toward each other naturally.
- R12. Category color coding is preserved: coral = writing, violet = record, kelp = signal. Labs (wine) is removed from the legend since no nodes exist.

### Labels

- R13. At default zoom (≤ ~1.4×), no labels are rendered on the graph — the constellation is visual only.
- R14. Past the zoom threshold (~1.5×), a truncated label appears below each node. Labels are short (≤ 24 characters, ellipsis after), rendered in `font-mono` at ~9–10px, low opacity (~0.65).
- R15. The status banner (hover → shows full title) continues to work unchanged for all zoom levels.

### Mobile and performance

- R16. SVG displacement filters (`drip`, `drip-strong`, `wave-edge`) are disabled on viewports narrower than 640px. Nodes render as plain circles on mobile.
- R17. The animation frame rate is capped to ~30fps on mobile (skip every other frame when `window.innerWidth < 640`).
- R18. The settle phase duration is reduced on mobile to avoid the choppy initial layout period feeling slow.
- R19. The legend is updated to show only the 2 active categories (writing, record) plus signal if both Signal nodes are present. Labs chip is removed.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** On homepage load, no large labeled hub circles appear. The graph shows small colored dots — coral for writing, violet for record, kelp for signal. Hovering a coral dot shows its article title in the status banner; clicking navigates to `/writing/[slug]`.

- AE2. **Covers R4, R6.** The graph contains exactly 2 kelp (signal) nodes. Clicking "The Library" navigates to `/music/index.html`; clicking "Gig Archive" navigates to `/music/gig-archive`. No wine (labs) nodes appear.

- AE3. **Covers R7, R8.** Lines connect writing and record nodes that share tags. Hovering a connected node highlights its subgraph; unconnected nodes dim. Isolated signal nodes have no lines.

- AE4. **Covers R13, R14.** At 1.0× zoom the graph shows only dots. After zooming to 1.5× or beyond, small truncated labels appear below each dot. Zooming back out hides them.

- AE5. **Covers R16.** On a 375px wide mobile viewport, nodes render as plain filled circles with no SVG filter effects. Motion remains but is smoother than the current filtered version.

---

## Success Criteria

- The homepage hero reads as a flat, organic constellation — no hierarchy implied by node size or position.
- Every node navigates to a real page.
- Labels emerge on zoom-in without cluttering the default view.
- On mobile, the graph is smooth enough that scrolling past it does not feel janky.

---

## Scope Boundaries

- No new routes created. `/projects` stays absent; Labs returns to the graph when a real page ships.
- No changes outside `components/HomeGraph.tsx`, `app/page.tsx` (if `buildTagEdges` needs adjustment), and `app/globals.css` (legend styles).
- T-shirt archive node is deferred until the page exists.
- No changes to the status banner, Nav, or any other component.
- The existing pan/zoom/pinch interaction model is unchanged.
- Tag edge generation (`buildTagEdges`) is unchanged — no new cross-link strategies.

---

## Key Decisions

- **Flat topology over hierarchy:** Removing hubs makes the graph feel like a web of ideas rather than a filing cabinet. The tradeoff is weaker spatial orientation for first-time visitors — offset by color coding and labels-on-zoom.
- **Tag edges only:** Keeps lines meaningful. An edge means two pieces share a real tag, not that they happen to be near each other. Sparse edges on a dense node field look better than a hairball.
- **Labels at zoom threshold:** Default view stays clean and atmospheric; zoom-in rewards exploration. This matches how network maps like the ones in Obsidian or Are.na handle label density.
- **Filters off on mobile:** The `drip`/`wave-edge` SVG filters are the main mobile perf cost. Plain circles lose the inky texture but gain a frame rate that doesn't jank.

---

## Dependencies / Assumptions

- `getAllPosts()` returns `{ slug, title, tags }` — verified against codebase.
- `getAllJournalEntries()` returns `{ slug, title, tags }` — assumed compatible; planner should verify tags field exists or falls back to `[]`.
- `/music/index.html` is a static file served by Next.js as a public asset — currently linked from `app/music/page.tsx` and confirmed active.
- The tag edge cap of 6 per node in `buildTagEdges` stays in place to prevent dense webs.
