'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

// ── Static data ───────────────────────────────────────────────────────────────

const CATS = [
  { id: 'writing', label: 'WRITING', cssColor: '#ff5573', orbit: 230, angle: -Math.PI / 2 },
  { id: 'record',  label: 'RECORD',  cssColor: '#9b7fff', orbit: 230, angle: 0 },
  { id: 'signal',  label: 'SIGNAL',  cssColor: '#5fc1a2', orbit: 230, angle: Math.PI / 2 },
  { id: 'labs',    label: 'LABS',    cssColor: '#e87a3a', orbit: 230, angle: Math.PI },
] as const;

const SIGNAL_LEAVES = [
  { id: 's1', label: 'The Library — 8 records', href: '/music/index.html' },
  { id: 's2', label: 'Gig archive',             href: '/music/gig-archive' },
  { id: 's3', label: 'T-shirt archive',         href: '/music' },
  { id: 's4', label: 'Boiler Room Bengaluru',   href: '/music' },
  { id: 's5', label: 'Awestrung @ Bluefrog',    href: '/music' },
];

const LABS_LEAVES = [
  { id: 'l1', label: 'jhoola.world',     href: '/projects' },
  { id: 'l2', label: 'koi',              href: '/projects' },
  { id: 'l3', label: 'Mosh pit anatomy', href: '/projects' },
];

const CAT_HREFS: Record<string, string> = {
  writing: '/writing',
  record: '/record',
  signal: '/music',
  labs: '/projects',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  kind: 'cat' | 'leaf';
  label: string;
  cat: string;
  r: number;
  color: string;
  href: string;
  x: number; y: number;
  ax?: number; ay?: number;
  vx: number; vy: number;
  fx?: number; fy?: number;
  phase: number;
  driftAmpX: number;
  driftAmpY: number;
  wobbAmpX: number;
  wobbAmpY: number;
  wobbFreq: number;
  wobbPhase: number;
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
  kind: 'cat' | 'leaf';
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
  const a = cat.angle + rand(-1.0, 1.0);
  const dist = cat.orbit + rand(80, 260);
  return {
    id, kind: 'leaf', label, cat: cat.id,
    r: rand(rMin, rMax),
    color: cat.cssColor,
    href,
    x: Math.cos(a) * dist,
    y: Math.sin(a) * dist,
    vx: 0, vy: 0,
    phase:     rand(0, Math.PI * 2),
    driftAmpX: rand(0.2, 4.0),
    driftAmpY: rand(0.3, 5.0),
    wobbAmpX:  rand(0.2, 0.9),
    wobbAmpY:  rand(0.2, 0.9),
    wobbFreq:  rand(16, 30),
    wobbPhase: rand(0, Math.PI * 2),
    displayDX: 0, displayDY: 0,
  };
}

function buildGraph(
  writingLeaves: LeafItem[],
  recordLeaves: LeafItem[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];

  CATS.forEach((c) => {
    const a = c.angle + rand(-0.03, 0.03);
    const ax = Math.cos(a) * c.orbit;
    const ay = Math.sin(a) * c.orbit;
    nodes.push({
      id: c.id, kind: 'cat', label: c.label, cat: c.id,
      r: 30, color: c.cssColor,
      href: CAT_HREFS[c.id],
      x: ax, y: ay, ax, ay,
      vx: 0, vy: 0,
      phase:     rand(0, Math.PI * 2),
      driftAmpX: rand(1.0, 2.0),
      driftAmpY: rand(1.2, 2.2),
      wobbAmpX:  rand(0.2, 0.5),
      wobbAmpY:  rand(0.2, 0.5),
      wobbFreq:  rand(16, 24),
      wobbPhase: rand(0, Math.PI * 2),
      displayDX: 0, displayDY: 0,
    });
  });

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
  writingLeaves.forEach((_, i) => edges.push({ a: 'writing', b: `w${i}`, kind: 'branch', len: 150 }));
  recordLeaves.forEach((_, i)  => edges.push({ a: 'record',  b: `r${i}`, kind: 'branch', len: 150 }));
  SIGNAL_LEAVES.forEach((l)    => edges.push({ a: 'signal',  b: l.id,    kind: 'branch', len: 150 }));
  LABS_LEAVES.forEach((l)      => edges.push({ a: 'labs',    b: l.id,    kind: 'branch', len: 150 }));

  return { nodes, edges };
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef(0);

  const [size, setSize]     = useState({ w: 800, h: 700 });
  const [, setTick]         = useState(0);
  const [hoverId, setHoverId]       = useState<string | null>(null);
  const [clickedId, setClickedId]   = useState<string | null>(null);
  const [activeCats, setActiveCats] = useState({
    writing: true, record: true, signal: true, labs: true,
  });
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const dragRef = useRef({ down: false, moved: false, x: 0, y: 0, tx: 0, ty: 0 });
  const [panning, setPanning] = useState(false);

  // Stable refs so useMemo deps don't change on every hover re-render
  const writingRef = useRef(writingLeaves ?? []);
  const recordRef  = useRef(recordLeaves ?? []);
  const tagEdgesRef = useRef(tagEdges);

  const { nodes, edges, adj, tagAdj } = useMemo(() => {
    const g = buildGraph(writingRef.current, recordRef.current);
    const te: GraphEdge[] = tagEdgesRef.current.map(([a, b]) => ({ a, b, kind: 'tag', len: 220 }));
    const allEdges = [...g.edges, ...te];
    return {
      nodes: g.nodes,
      edges: allEdges,
      adj: buildAdj(g.edges),
      tagAdj: buildAdj(te),
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

  useEffect(() => {
    if (!onHover) return;
    if (!hoverId) { onHover(null); return; }
    const n = nodes.find((x) => x.id === hoverId);
    if (!n) { onHover(null); return; }
    onHover({ id: n.id, label: n.label, cat: n.cat, kind: n.kind, href: n.href });
  }, [hoverId, nodes, onHover]);

  const tRef       = useRef(0);
  const settleRef  = useRef(0);
  const entryMsRef = useRef(0); // real ms elapsed since mount — drives entry fade

  useEffect(() => {
    let last = performance.now();
    const SETTLE_MS = 2800;

    const step = (now: number) => {
      const frameDelta = now - last;
      const dt = Math.min(40, frameDelta) / 16.6;
      entryMsRef.current = Math.min(entryMsRef.current + frameDelta, 2000);
      last = now;
      tRef.current += dt;
      settleRef.current += dt * 16.6;
      const settling = settleRef.current < SETTLE_MS;

      if (settling) {
        const k_rep    = density === 'sparse' ? 1900 : density === 'dense' ? 950 : 1350;
        const k_spring = 0.020;
        const k_anchor = 0.04;
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
          const a = nodes.find((n) => n.id === e.a);
          const b = nodes.find((n) => n.id === e.b);
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
          if (n.kind === 'cat') {
            n.fx! += (n.ax! - n.x) * k_anchor;
            n.fy! += (n.ay! - n.y) * k_anchor;
          } else {
            n.fx! += -n.x * k_center;
            n.fy! += -n.y * k_center;
          }
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
          // Primary slow drift (varied amplitude)
          const dx = Math.sin(tt + n.phase) * n.driftAmpX;
          const dy = Math.cos(tt * 0.65 + n.phase * 1.3) * n.driftAmpY;
          // Secondary micro-wobble (high-freq, low-amp)
          const wx = Math.sin(tt * n.wobbFreq + n.wobbPhase) * n.wobbAmpX;
          const wy = Math.cos(tt * n.wobbFreq * 1.1 + n.wobbPhase * 0.9) * n.wobbAmpY;
          n.displayDX = dx + wx;
          n.displayDY = dy + wy;
        });
      } else {
        nodes.forEach((n) => { n.displayDX = 0; n.displayDY = 0; });
      }

      setTick((k) => (k + 1) % 1e9);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [nodes, edges, motion, density]);

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

  // Entry fade: hubs appear first, leaves materialise over ~1.5s starting at 300ms
  const catEntryOpacity  = Math.min(1, entryMsRef.current / 400);
  const leafEntryOpacity = Math.max(0, Math.min(1, (entryMsRef.current - 300) / 1500));

  return (
    <div
      className={`graph-stage ${panning ? 'panning' : ''}`}
      ref={wrapRef}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
    >
      <svg
        className="graph"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="drip" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.0" />
          </filter>
          <filter id="drip-strong" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="6" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="6" />
          </filter>
          <filter id="wave-edge" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="1" seed="9" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="1.0" />
          </filter>
        </defs>

        {/* edges */}
        <g transform={groupTransform} fill="none" filter="url(#wave-edge)">
          {edges.map((e, i) => {
            const a = nodes.find((n) => n.id === e.a);
            const b = nodes.find((n) => n.id === e.b);
            if (!a || !b) return null;
            const visible = isVisible(a) && isVisible(b);
            const hl = highlightSet ? (highlightSet.has(a.id) && highlightSet.has(b.id)) : false;
            const dim = highlightSet ? !hl : !visible;
            const isTag = e.kind === 'tag';
            const opacity = !visible ? (isTag ? 0.04 : 0.06) : dim ? (isTag ? 0.05 : 0.10) : hl ? (isTag ? 0.75 : 0.95) : (isTag ? 0.28 : 0.5);
            const stroke = isTag ? '#9b7fff' : '#0e1822';
            const sw = (isTag ? (hl ? 1.2 : 0.8) : (hl ? 1.7 : 1.0)) / Math.max(0.6, view.scale);
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
            const visible = isVisible(n);
            const isHover   = hoverId  === n.id;
            const isClicked = clickedId === n.id;
            const hl = highlightSet ? highlightSet.has(n.id) : false;
            const dim = highlightSet ? !hl : !visible;
            const x = n.x + (n.displayDX ?? 0);
            const y = n.y + (n.displayDY ?? 0);

            // More pronounced dim contrast (was 0.22 / 0.20)
            const dimOpacity = n.kind === 'cat' ? 0.15 : 0.07;
            const baseOp = dim ? dimOpacity : 1;
            const entryOp = n.kind === 'cat' ? catEntryOpacity : leafEntryOpacity;
            const op = baseOp * entryOp;

            const onEnter = () => setHoverId(n.id);
            const onLeave = () => setHoverId(null);
            const onClick = (e: React.MouseEvent) => {
              if (dragRef.current.moved) return;
              e.stopPropagation();
              if (n.kind === 'cat') {
                toggleCat(n.id);
              } else {
                setClickedId(n.id);
                const href = n.href;
                setTimeout(() => {
                  setClickedId(null);
                  window.location.href = href;
                }, 180);
              }
            };

            if (n.kind === 'cat') {
              return (
                <g
                  key={n.id}
                  transform={`translate(${x} ${y})`}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                  onClick={onClick}
                  style={{ cursor: 'pointer', opacity: op, transition: 'opacity 0.3s ease' }}
                >
                  {isHover && (
                    <circle r={n.r + 18} fill="none" stroke={n.color} strokeWidth={1.2 / view.scale} strokeDasharray="3 5" opacity="0.5">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="22s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle r={n.r + 7} fill={n.color} opacity="0.22" filter="url(#drip-strong)" />
                  <circle r={n.r}     fill={n.color} filter="url(#drip)" />
                  <text
                    y={n.r + 26}
                    textAnchor="middle"
                    fontFamily="'Geist', 'Inter', system-ui, sans-serif"
                    fontWeight="700"
                    fontSize="13"
                    letterSpacing="3"
                    fill="#0e1822"
                    style={{ pointerEvents: 'none' }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            }

            const r = isHover ? n.r * 1.6 : n.r;
            const springScale = isClicked ? 1.5 : 1;

            return (
              <g
                key={n.id}
                transform={`translate(${x} ${y})`}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                onClick={onClick}
                style={{ cursor: 'pointer', opacity: op, transition: 'opacity 0.3s ease' }}
              >
                {/* Inner group for click spring scale */}
                <g style={{
                  transform: `scale(${springScale})`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                  {/* Hover glow — larger ambient fill behind the node */}
                  {isHover && (
                    <circle r={r * 3.5} fill={n.color} opacity="0.14" />
                  )}
                  <circle r={r + 3} fill={n.color} opacity="0.28" filter="url(#drip)" />
                  <circle r={r}     fill={n.color} filter="url(#drip)" />
                  {/* Pulsing ring on hover */}
                  {isHover && (
                    <circle r={r + 9} fill="none" stroke={n.color} strokeWidth={1.4 / view.scale} opacity="0.6">
                      <animate attributeName="r" from={r + 4} to={r + 26} dur="1.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                    </circle>
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
