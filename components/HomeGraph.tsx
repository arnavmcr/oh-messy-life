'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

// ── Static data ───────────────────────────────────────────────────────────────

const CATS = [
  { id: 'writing', label: 'WRITING', cssColor: '#ff5573' },
  { id: 'record',  label: 'RECORD',  cssColor: '#9b7fff' },
  { id: 'signal',  label: 'SIGNAL',  cssColor: '#5fc1a2' },
  { id: 'labs',    label: 'LABS',    cssColor: '#872b54' },
] as const;

const CAT_ANGLES: Record<string, number> = {
  writing: -Math.PI / 2,
  record: 0,
  signal: Math.PI / 2,
  labs: Math.PI,
};

const SIGNAL_LEAVES = [
  { id: 's1', label: 'The Library', href: '/music/index.html' },
  { id: 's2', label: 'Gig Archive', href: '/music/gig-archive' },
];

const LABS_LEAVES = [
  { id: 'l1', label: 'Ticket Ticker', href: '/projects/ticket-ticker' },
];

const LABEL_THRESHOLD = 1.5;

// ── Types ─────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  cat: string;
  r: number;
  color: string;
  href: string;
  x: number; y: number;
  vx: number; vy: number;
  fx?: number; fy?: number;
  phase: number;
  driftAmpX: number;
  driftAmpY: number;
  displayDX?: number;
  displayDY?: number;
}

interface GraphEdge {
  a: string; b: string;
  kind: 'branch' | 'tag';
  len: number;
}

export interface HoverInfo {
  id: string;
  label: string;
  cat: string;
  href: string;
}

export interface LeafItem {
  slug: string;
  title: string;
  tags?: string[];
}

interface Props {
  motion?: 'on' | 'off';
  density?: 'sparse' | 'normal' | 'dense';
  onHover?: (info: HoverInfo | null) => void;
  writingLeaves?: LeafItem[];
  recordLeaves?: LeafItem[];
  tagEdges?: [string, string][];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeLeafNode(
  id: string, cat: typeof CATS[number], label: string, href: string,
  rMin: number, rMax: number,
): GraphNode {
  const a = CAT_ANGLES[cat.id] + rand(-1.6, 1.6);
  const dist = rand(40, 300);
  return {
    id, label, cat: cat.id,
    r: rand(rMin, rMax),
    color: cat.cssColor,
    href,
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist,
    vx: 0, vy: 0,
    phase:     rand(0, Math.PI * 2),
    driftAmpX: rand(0.2, 2.0),
    driftAmpY: rand(0.3, 2.5),
  };
}

function buildGraph(
  writingLeaves: LeafItem[],
  recordLeaves: LeafItem[],
): { nodes: GraphNode[]; edges: GraphEdge[]; nodeMap: Map<string, GraphNode> } {
  const nodes: GraphNode[] = [];

  const writingCat = CATS[0];
  writingLeaves.forEach((item, i) => {
    nodes.push(makeLeafNode(`w${i}`, writingCat, item.title, `/writing/${item.slug}`, 4, 8));
  });

  const recordCat = CATS[1];
  recordLeaves.forEach((item, i) => {
    nodes.push(makeLeafNode(`r${i}`, recordCat, item.title, `/record/${item.slug}`, 4, 8));
  });

  const signalCat = CATS[2];
  SIGNAL_LEAVES.forEach((item) => {
    nodes.push(makeLeafNode(item.id, signalCat, item.label, item.href, 5, 11));
  });

  const labsCat = CATS[3];
  LABS_LEAVES.forEach((item) => {
    nodes.push(makeLeafNode(item.id, labsCat, item.label, item.href, 5, 11));
  });

  const edges: GraphEdge[] = [];

  const nodeMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));
  return { nodes, edges, nodeMap };
}

function buildAdj(edges: GraphEdge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  edges.forEach((e) => {
    if (!adj.has(e.a)) adj.set(e.a, new Set());
    if (!adj.has(e.b)) adj.set(e.b, new Set());
    adj.get(e.a)!.add(e.b);
    adj.get(e.b)!.add(e.a);
  });
  return adj;
}

function wavyEdgePath(
  ax: number, ay: number, bx: number, by: number,
  t: number, amp: number, phaseOffset: number,
): string {
  const dx = bx - ax, dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return `M${ax},${ay} L${bx},${by}`;
  const nx = -dy / len, ny = dx / len;
  const phase = t * 0.18 + phaseOffset;
  const p1x = ax + dx * 0.28 + nx * Math.sin(phase) * amp;
  const p1y = ay + dy * 0.28 + ny * Math.sin(phase) * amp;
  const p2x = ax + dx * 0.72 + nx * Math.sin(phase + Math.PI) * amp;
  const p2y = ay + dy * 0.72 + ny * Math.sin(phase + Math.PI) * amp;
  return `M${ax},${ay} C${p1x},${p1y} ${p2x},${p2y} ${bx},${by}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeGraph({
  motion = 'on',
  density = 'normal',
  onHover,
  writingLeaves,
  recordLeaves,
  tagEdges = [],
}: Props) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const rafRef       = useRef(0);
  const stepRef      = useRef<FrameRequestCallback>(() => {});
  const viewRef      = useRef({ scale: 1, tx: 0, ty: 0 });
  const sizeRef      = useRef({ w: 800, h: 700 });
  const frameSkipRef = useRef(0);

  const [size, setSize]               = useState({ w: 800, h: 700 });
  const [, setTick]                   = useState(0);
  const [hoverId, setHoverId]         = useState<string | null>(null);
  const [clickedId, setClickedId]     = useState<string | null>(null);
  const [activeCats, setActiveCats]   = useState({ writing: true, record: true, signal: true, labs: true });
  const [view, setView]               = useState({ scale: 1, tx: 0, ty: 0 });
  viewRef.current  = view;
  sizeRef.current  = size;

  const dragRef  = useRef({ down: false, moved: false, x: 0, y: 0, tx: 0, ty: 0 });
  const pinchRef = useRef({ active: false, dist: 0, scale: 1 });
  const [panning, setPanning] = useState(false);

  // Stable refs so useMemo deps don't change on every hover re-render
  const writingRef  = useRef(writingLeaves ?? []);
  const recordRef   = useRef(recordLeaves ?? []);
  const tagEdgesRef = useRef(tagEdges);

  const { nodes, edges, adj, tagAdj, nodeMap } = useMemo(() => {
    const g = buildGraph(writingRef.current, recordRef.current);
    const te: GraphEdge[] = tagEdgesRef.current.map(([a, b]) => ({ a, b, kind: 'tag' as const, len: 220 }));
    const allEdges = [...g.edges, ...te];
    return {
      nodes: g.nodes,
      edges: allEdges,
      adj: buildAdj(g.edges),
      tagAdj: buildAdj(te),
      nodeMap: g.nodeMap,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
    if (rect.width <= 640) {
      setView((v) => (v.scale === 1 ? { ...v, scale: 0.55 } : v));
    }
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top  - rect.height / 2;
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const newScale = Math.max(0.4, Math.min(3, v.scale * factor));
        const ratio = newScale / v.scale;
        return { scale: newScale, tx: mx - (mx - v.tx) * ratio, ty: my - (my - v.ty) * ratio };
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);

  const onPointerDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
    dragRef.current = { down: true, moved: false, x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
  };
  const onPointerMove = (e: React.MouseEvent) => {
    if (!dragRef.current.down) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
      dragRef.current.moved = true;
      setPanning(true);
    }
    if (dragRef.current.moved) {
      setView((v) => ({ ...v, tx: dragRef.current.tx + dx, ty: dragRef.current.ty + dy }));
    }
  };
  const onPointerUp = () => { dragRef.current.down = false; setPanning(false); };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const v = viewRef.current;
      dragRef.current = { down: true, moved: false, x: t.clientX, y: t.clientY, tx: v.tx, ty: v.ty };
      pinchRef.current.active = false;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      pinchRef.current = { active: true, dist, scale: viewRef.current.scale };
      dragRef.current.down = false;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      if (!pinchRef.current.active || pinchRef.current.dist === 0) return;
      dragRef.current.down = false;
      const newDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      );
      const ratio = newDist / pinchRef.current.dist;
      const newScale = Math.max(0.4, Math.min(3, pinchRef.current.scale * ratio));
      setView((v) => ({ ...v, scale: newScale }));
    } else if (e.touches.length === 1 && !pinchRef.current.active && dragRef.current.down) {
      const t = e.touches[0];
      const dx = t.clientX - dragRef.current.x;
      const dy = t.clientY - dragRef.current.y;
      if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
        dragRef.current.moved = true;
        setPanning(true);
      }
      if (dragRef.current.moved) {
        setView((v) => ({ ...v, tx: dragRef.current.tx + dx, ty: dragRef.current.ty + dy }));
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    pinchRef.current.active = false;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const v = viewRef.current;
      dragRef.current = { down: true, moved: false, x: t.clientX, y: t.clientY, tx: v.tx, ty: v.ty };
    } else {
      dragRef.current.down = false;
      setPanning(false);
    }
  };

  useEffect(() => {
    if (!onHover) return;
    if (!hoverId) { onHover(null); return; }
    const n = nodeMap.get(hoverId);
    if (!n) { onHover(null); return; }
    onHover({ id: n.id, label: n.label, cat: n.cat, href: n.href });
  }, [hoverId, nodeMap, onHover]);

  const tRef       = useRef(0);
  const settleRef  = useRef(0);
  const entryMsRef = useRef(0); // real ms elapsed since mount — drives entry fade

  useEffect(() => {
    let last = performance.now();

    const step = (now: number) => {
      const isMobile  = sizeRef.current.w < 640;
      const SETTLE_MS = isMobile ? 1400 : 2800;

      frameSkipRef.current++;
      const shouldUpdate = !isMobile || frameSkipRef.current % 2 === 0;

      const frameDelta = now - last;
      const dt = Math.min(40, frameDelta) / 16.6;
      entryMsRef.current  = Math.min(entryMsRef.current + frameDelta, 2000);
      settleRef.current  += dt * 16.6; // advance in wall ms regardless of frame skip
      last = now;

      const settling = settleRef.current < SETTLE_MS;

      if (shouldUpdate) {
        tRef.current += dt;

        if (settling) {
          const k_rep    = density === 'sparse' ? 1900 : density === 'dense' ? 950 : 1350;
          const k_spring = 0.020;
          const k_center = 0.0010;
          const damping  = 0.82;
          const maxSpeed = 4.0;

          for (let i = 0; i < nodes.length; i++) { nodes[i].fx = 0; nodes[i].fy = 0; }
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i], b = nodes[j];
              const dx = b.x - a.x, dy = b.y - a.y;
              const d2 = dx * dx + dy * dy + 0.01;
              const d  = Math.sqrt(d2);
              if (d > 380) continue;
              const f = k_rep / d2;
              const fx = (dx / d) * f, fy = (dy / d) * f;
              a.fx! -= fx; a.fy! -= fy;
              b.fx! += fx; b.fy! += fy;
            }
          }
          edges.forEach((e) => {
            const a = nodeMap.get(e.a);
            const b = nodeMap.get(e.b);
            if (!a || !b) return;
            const dx = b.x - a.x, dy = b.y - a.y;
            const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
            const ks = e.kind === 'tag' ? k_spring * 0.05 : k_spring;
            const f = (d - e.len) * ks;
            const fx = (dx / d) * f, fy = (dy / d) * f;
            a.fx! += fx; a.fy! += fy;
            b.fx! -= fx; b.fy! -= fy;
          });
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.fx! += -n.x * k_center;
            n.fy! += -n.y * k_center;
          }
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.vx = (n.vx + n.fx! * dt) * damping;
            n.vy = (n.vy + n.fy! * dt) * damping;
            const sp = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (sp > maxSpeed) { n.vx = n.vx / sp * maxSpeed; n.vy = n.vy / sp * maxSpeed; }
            n.x += n.vx * dt;
            n.y += n.vy * dt;
          }
        } else {
          for (let i = 0; i < nodes.length; i++) { nodes[i].vx = 0; nodes[i].vy = 0; }
        }

        if (motion !== 'off') {
          const tt = tRef.current * 0.014;
          nodes.forEach((n) => {
            const dx = Math.sin(tt + n.phase) * n.driftAmpX;
            const dy = Math.cos(tt * 0.65 + n.phase * 1.3) * n.driftAmpY;
            n.displayDX = dx;
            n.displayDY = dy;
          });
        } else {
          nodes.forEach((n) => { n.displayDX = 0; n.displayDY = 0; });
        }

        setTick((k) => (k + 1) % 1e9);
      }

      rafRef.current = requestAnimationFrame(step);
    };
    stepRef.current = step;
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, edges, motion, density]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(stepRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const cx = size.w / 2;
  const cy = size.h / 2;

  const highlightSet = useMemo(() => {
    if (!hoverId) return null;
    const s = new Set<string>([hoverId]);
    adj.get(hoverId)?.forEach((id) => s.add(id));
    tagAdj.get(hoverId)?.forEach((id) => s.add(id));
    return s;
  }, [hoverId, adj, tagAdj]);

  const toggleCat = (id: string) =>
    setActiveCats((s) => ({ ...s, [id]: !s[id as keyof typeof s] }));

  const isVisible = (n: GraphNode) => activeCats[n.cat as keyof typeof activeCats] !== false;

  const zoomBy = useCallback((factor: number) => {
    setView((v) => {
      const newScale = Math.max(0.4, Math.min(3, v.scale * factor));
      const ratio = newScale / v.scale;
      return { scale: newScale, tx: v.tx * ratio, ty: v.ty * ratio };
    });
  }, []);
  const resetView = useCallback(() => setView({ scale: 1, tx: 0, ty: 0 }), []);

  const groupTransform = `translate(${cx + view.tx} ${cy + view.ty}) scale(${view.scale})`;

  // Single-wave entry fade over 1.2 s
  const entryOpacity = Math.min(1, entryMsRef.current / 1200);

  return (
    <div
      className={`graph-stage ${panning ? 'panning' : ''}`}
      ref={wrapRef}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { pinchRef.current.active = false; dragRef.current.down = false; setPanning(false); }}
    >
      <svg
        className="graph"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {CATS.map((c) => (
            <radialGradient key={c.id} id={`blob-${c.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={c.cssColor} stopOpacity="0.95" />
              <stop offset="28%"  stopColor={c.cssColor} stopOpacity="0.62" />
              <stop offset="62%"  stopColor={c.cssColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={c.cssColor} stopOpacity="0"    />
            </radialGradient>
          ))}
        </defs>
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

        {/* nodes */}
        <g transform={groupTransform}>
          {nodes.map((n) => {
            const visible   = isVisible(n);
            const isHover   = hoverId   === n.id;
            const isClicked = clickedId === n.id;
            const hl  = highlightSet ? highlightSet.has(n.id) : false;
            const dim = highlightSet ? !hl : !visible;
            const x = n.x + (n.displayDX ?? 0);
            const y = n.y + (n.displayDY ?? 0);

            const baseOp = dim ? 0.08 : 1;
            const op = baseOp * entryOpacity;

            const onEnter = () => setHoverId(n.id);
            const onLeave = () => setHoverId(null);
            const onClick = (e: React.MouseEvent) => {
              if (dragRef.current.moved) return;
              e.stopPropagation();
              setClickedId(n.id);
              const href = n.href;
              setTimeout(() => {
                setClickedId(null);
                window.location.href = href;
              }, 180);
            };

            const r           = isHover ? n.r * 1.6 : n.r;
            const blobR       = r * 4.5;
            const springScale = isClicked ? 1.5 : 1;
            const labelText   = n.label.length > 24 ? n.label.slice(0, 22) + '…' : n.label;
            // slow per-node shimmer — each blob breathes independently
            const shimmer     = 0.88 + 0.12 * Math.sin(tRef.current * 0.018 + n.phase * 1.4);

            return (
              <g
                key={n.id}
                transform={`translate(${x} ${y})`}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                onClick={onClick}
                style={{ cursor: 'pointer', opacity: op * shimmer, transition: 'opacity 0.3s ease' }}
              >
                {/* Inner group for click spring scale */}
                <g style={{
                  transform: `scale(${springScale})`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                  {/* Gradient blob — single element, white center → brand color → transparent */}
                  <circle r={blobR} fill={`url(#blob-${n.cat})`} />
                  {/* Pulsing ring on hover */}
                  {isHover && (
                    <circle r={r + 9} fill="none" stroke={n.color} strokeWidth={1.4 / view.scale} opacity="0.6">
                      <animate attributeName="r" from={r + 9} to={r + 26} dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Label at zoom threshold */}
                  {view.scale >= LABEL_THRESHOLD && (
                    <text
                      y={r + 14}
                      textAnchor="middle"
                      fontFamily="var(--font-mono-stack)"
                      fontSize={10 / view.scale}
                      opacity="0.65"
                      fill="var(--ink)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {labelText}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* zoom controls */}
      <div className="graph-zoom" data-no-pan="true">
        <button onClick={() => zoomBy(1.18)} aria-label="zoom in">+</button>
        <button onClick={() => zoomBy(1 / 1.18)} aria-label="zoom out">−</button>
        <button onClick={resetView} aria-label="reset view">⌂</button>
      </div>

      {/* legend */}
      <div className="graph-legend" data-no-pan="true">
        {CATS.map((c) => (
          <div
            key={c.id}
            className={`legend-item ${activeCats[c.id] ? '' : 'dim'}`}
            onClick={() => toggleCat(c.id)}
            title={`toggle ${c.label.toLowerCase()}`}
          >
            <span className="sw" style={{ background: c.cssColor }} />
            {c.label}
          </div>
        ))}
      </div>

      {/* zoom badge */}
      <div className="graph-zoom-badge" data-no-pan="true">
        {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
