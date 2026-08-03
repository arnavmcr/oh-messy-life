# Backlog

> Unscheduled feedback and ideas, captured as they come in. Promote an item to `ROADMAP.md` (with a brainstorm/plan doc under `docs/`) once it's picked up for real.

---

## 2026-08-02 — Feedback from Sachin (homepage graph)

1. **Dot blurriness on load** — the graph node dots (blobs) read as blurry/soft on first render, close enough to a "still loading" look that it undermines the reveal. Investigate whether this is the entry-fade (`entryOpacity` ramp in `components/HomeGraph.tsx`), the radial-gradient blob rendering, or an SVG rasterization/antialiasing artifact. Open.
2. **Connected-node hover/drag animation** — dragging the cursor from one connected node to another currently plays the same hover transition as moving between two *unconnected* nodes. Wants a distinct, more dynamic interaction for connected-node-to-connected-node hover: bigger colour spread, more prominent/heavier line animation, a pulse sent from the origin node out along the edges to the nodes it connects to. Design approved, spec at `docs/brainstorms/2026-08-02-homegraph-connected-node-pulse.md`. `[ SHIPPED — see docs/superpowers/plans/2026-08-02-homegraph-connected-node-pulse.md ]`
