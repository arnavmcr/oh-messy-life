'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

// ── Data ─────────────────────────────────────────────────────────────────────

const CATS = [
  { id: 'writing', label: 'WRITING', cssColor: '#ff5573', orbit: 230, angle: -Math.PI / 2 },
  { id: 'record',  label: 'RECORD',  cssColor: '#9b7fff', orbit: 230, angle: 0 },
  { id: 'signal',  label: 'SIGNAL',  cssColor: '#5fc1a2', orbit: 230, angle: Math.PI / 2 },
  { id: 'labs',    label: 'LABS',    cssColor: '#e87a3a', orbit: 230, angle: Math.PI },
] as const;

const LEAVES = [
  { id: 'w1', cat: 'writing', label: 'Vandalism as UI design' },
  { id: 'w2', cat: 'writing', label: 'The architecture of noise' },
  { id: 'w3', cat: 'writing', label: 'Bombay gatekeeping & Todi Mills' },
  { id: 'w4', cat: 'writing', label: 'Roads, escapism & GeoGuessr' },
  { id: 'w5', cat: 'writing', label: 'A moon shaped pool — review' },
  { id: 'w6', cat: 'writing', label: 'Stress fractures: India’s concert boom' },
  { id: 'r1', cat: 'record',  label: 'March & April ’26' },
  { id: 'r2', cat: 'record',  label: 'Dec ’25 / Jan & Feb ’26' },
  { id: 'r3', cat: 'record',  label: 'October / November ’25' },
  { id: 'r4', cat: 'record',  label: 'September ’25' },
  { id: 'r5', cat: 'record',  label: 'July / August ’25' },
  { id: 's1', cat: 'signal',  label: 'The Library — 8 records' },
  { id: 's2', cat: 'signal',  label: 'Gig archive' },
  { id: 's3', cat: 'signal',  label: 'T-shirt archive' },
  { id: 's4', cat: 'signal',  label: 'Boiler Room Bengaluru' },
  { id: 's5', cat: 'signal',  label: 'Awestrung @ Bluefrog' },
  { id: 'l1', cat: 'labs',    label: 'jhoola.world' },
  { id: 'l2', cat: 'labs',    label: 'koi' },
  { id: 'l3', cat: 'labs',    label: 'Mosh pit anatomy' },
];

const CROSS: [string, string][] = [
  ['w3', 'r1'], ['w6', 's2'], ['w2', 's1'], ['s4', 'w3'],
  ['l1', 'w1'], ['l2', 's1'], ['l3', 's2'],
  ['w4', 'r3'], ['r2', 'r1'], ['r3', 'r2'], ['r4', 'r3'],
  ['writing', 'record'], ['record', 'signal'], ['signal', 'labs'], ['labs', 'writing'],
];

const LEAF_HREFS: Record<string, string> = {
  w1: '/writing', w2: '/writing', w3: '/writing', w4: '/writing', w5: '/writing', w6: '/writing',
  r1: '/record', r2: '/record', r3: '/record', r4: '/record', r5: '/record',
  s1: '/music/index.html', s2: '/music/gig-archive', s3: '/music',
  s4: '/music', s5: '/music',
  l1: '/projects', l2: '/projects', l3: '/projects',
};

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
  x: number; y: number;
  ax?: number; ay?: number;
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
  kind: 'branch' | 'cross' | 'ring';
  len: number;
}

export interface HoverInfo {
  id: string;
  label: string;
  cat: string;
  kind: 'cat' | 'leaf';
}

interface Props {
  motion?: 'on' | 'off';
  density?: 'sparse' | 'normal' | 'dense';
  onHover?: (info: HoverInfo | null) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];

  CATS.forEach((c) => {
    const a = c.angle + rand(-0.03, 0.03);
    const ax = Math.cos(a) * c.orbit;
    const ay = Math.sin(a) * c.orbit;
    nodes.push({
      id: c.id, kind: 'cat', label: c.label, cat: c.id,
      r: 30, color: c.cssColor,
      x: ax, y: ay, ax, ay,
      vx: 0, vy: 0,
      phase: rand(0, Math.PI * 2),
      driftAmpX: rand(1.6, 2.4),
      driftAmpY: rand(2.0, 2.8),
    });
  });

  LEAVES.forEach((l) => {
    const cat = CATS.find((c) => c.id === l.cat)!;
    const a = cat.angle + rand(-0.9, 0.9);
    const r = cat.orbit + rand(90, 220);
    nodes.push({
      id: l.id, kind: 'leaf', label: l.label, cat: l.cat,
      r: rand(7, 13),
      color: cat.cssColor,
      x: Math.cos(a) * r, y: Math.sin(a) * r,
      vx: 0, vy: 0,
      phase: rand(0, Math.PI * 2),
      driftAmpX: rand(1.2, 2.4),
      driftAmpY: rand(1.6, 3.0),
    });
  });

  const edges: GraphEdge[] = [];
  LEAVES.forEach((l) => edges.push({ a: l.cat, b: l.id, kind: 'branch', len: 150 }));
  CROSS.forEach(([a, b]) => {
    const isCatRing = CATS.some((c) => c.id === a) && CATS.some((c) => c.id === b);
    edges.push({ a, b, kind: isCatRing ? 'ring' : 'cross', len: isCatRing ? 330 : 200 });
  });

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

export default function HomeGraph({ motion = 'on', density = 'normal', onHover }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef(0);

  const [size, setSize] = useState({ w: 800, h: 700 });
  const [, setTick] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [activeCats, setActiveCats] = useState({
    writing: true, record: true, signal: true, labs: true,
  });
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const dragRef = useRef({ down: false, moved: false, x: 0, y: 0, tx: 0, ty: 0 });
  const [panning, setPanning] = useState(false);

  const { nodes, edges, adj } = useMemo(() => {
    const g = buildGraph();
    return { nodes: g.nodes, edges: g.edges, adj: buildAdj(g.edges) };
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
    onHover({ id: n.id, label: n.label, cat: n.cat, kind: n.kind });
  }, [hoverId, nodes, onHover]);

  const tRef = useRef(0);
  const settleRef = useRef(0);
  useEffect(() => {
    let last = performance.now();
    const SETTLE_MS = 2800;
    const step = (now: number) => {
      const dt = Math.min(40, now - last) / 16.6;
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
          const f = (d - e.len) * k_spring;
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
          n.displayDX = Math.sin(tt + n.phase) * n.driftAmpX;
          n.displayDY = Math.cos(tt * 0.65 + n.phase * 1.3) * n.driftAmpY;
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
    return s;
  }, [hoverId, adj]);

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
            const opacity = !visible ? 0.06 : dim ? 0.14 : hl ? 0.95 : 0.5;
            const stroke = e.kind === 'cross' ? '#ff5573' : '#0e1822';
            const sw = (e.kind === 'ring' ? (hl ? 2.4 : 1.6) : e.kind === 'cross' ? (hl ? 2 : 1.1) : (hl ? 1.7 : 1.0)) / Math.max(0.6, view.scale);
            const dash = e.kind === 'cross' ? '5 7' : e.kind === 'ring' ? '1 6' : 'none';
            const amp = e.kind === 'ring' ? 14 : e.kind === 'cross' ? 14 : 11;
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
            const isHover = hoverId === n.id;
            const hl = highlightSet ? highlightSet.has(n.id) : false;
            const dim = highlightSet ? !hl : !visible;
            const x = n.x + (n.displayDX ?? 0);
            const y = n.y + (n.displayDY ?? 0);
            const op = dim ? (n.kind === 'cat' ? 0.20 : 0.22) : 1;

            const onEnter = () => setHoverId(n.id);
            const onLeave = () => setHoverId(null);
            const onClick = (e: React.MouseEvent) => {
              if (dragRef.current.moved) return;
              e.stopPropagation();
              if (n.kind === 'cat') {
                toggleCat(n.id);
              } else {
                const href = LEAF_HREFS[n.id] ?? CAT_HREFS[n.cat] ?? '/';
                window.location.href = href;
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

            const r = isHover ? n.r * 1.55 : n.r;
            return (
              <g
                key={n.id}
                transform={`translate(${x} ${y})`}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                onClick={onClick}
                style={{ cursor: 'pointer', opacity: op, transition: 'opacity 0.3s ease' }}
              >
                <circle r={r + 3} fill={n.color} opacity="0.24" filter="url(#drip)" />
                <circle r={r}     fill={n.color} filter="url(#drip)" />
                {isHover && (
                  <circle r={r + 9} fill="none" stroke={n.color} strokeWidth={1.2 / view.scale} opacity="0.55">
                    <animate attributeName="r" from={r + 3} to={r + 22} dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.65" to="0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
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
