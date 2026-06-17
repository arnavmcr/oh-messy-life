'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { TicketRecord } from '@/lib/ticket-ticker';

// ── Constants ────────────────────────────────────────────────────────────────

const SVG_HEIGHT = 460;
const MIN_SVG_WIDTH = 480;
const PAD = { top: 40, right: 40, bottom: 55, left: 68 };
const MIN_R = 6;
const MAX_R = 36;
const MIN_DOMAIN_SPAN = 10;
const DEFAULT_MIN_DEMAND = 40;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventAggregate {
  event: string;
  demand: number;
  sells: number;
  avgLoss: number;
  avgLossValid: boolean;
  avgPrice: number;
  eventDate: string | null;
  cx: number;
  cy: number;
  r: number;
}

interface Props {
  records: TicketRecord[];
}

// ── Scale helpers ─────────────────────────────────────────────────────────────

function linear(v: number, d0: number, d1: number, r0: number, r1: number): number {
  if (d1 === d0) return (r0 + r1) / 2;
  return r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
}

function sqrtScale(v: number, d0: number, d1: number, r0: number, r1: number): number {
  if (d1 === d0) return (r0 + r1) / 2;
  const t = Math.sqrt(Math.max(0, v - d0)) / Math.sqrt(Math.max(1e-9, d1 - d0));
  return r0 + t * (r1 - r0);
}

function guardDomain(min: number, max: number): [number, number] {
  if (max - min < MIN_DOMAIN_SPAN) {
    const mid = (min + max) / 2;
    return [mid - MIN_DOMAIN_SPAN / 2, mid + MIN_DOMAIN_SPAN / 2];
  }
  return [min, max];
}

function niceRange(min: number, max: number, ticks: number): number[] {
  const [lo, hi] = guardDomain(min, max);
  const step = (hi - lo) / (ticks - 1);
  return Array.from({ length: ticks }, (_, i) => lo + i * step);
}

function formatEventDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TicketTickerChart({ records }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(MIN_SVG_WIDTH);
  const [eventFilter, setEventFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minDemand, setMinDemand] = useState(DEFAULT_MIN_DEMAND);
  const [drillDownArtist, setDrillDownArtist] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [clickedEvent, setClickedEvent] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSvgWidth(Math.max(MIN_SVG_WIDTH, el.clientWidth));
    });
    ro.observe(el);
    setSvgWidth(Math.max(MIN_SVG_WIDTH, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // ── Filter + aggregate ────────────────────────────────────────────────────

  const aggregates: EventAggregate[] = useMemo(() => {
    const filterLower = eventFilter.toLowerCase();
    const isDrillDown = drillDownArtist !== null;

    const filtered = records.filter((r) => {
      if (!r.event) return false;
      if (isDrillDown) {
        // Drill-down: only records for this artist
        if (r.event !== drillDownArtist) return false;
      } else {
        // Artist view: apply event name filter
        if (filterLower && !r.event.toLowerCase().includes(filterLower)) return false;
      }
      if (startDate && r.message_date < startDate) return false;
      if (endDate && r.message_date > endDate) return false;
      return true;
    });

    // Group key: in drill-down, group by location (city); otherwise by event name
    const getKey = (r: TicketRecord): string =>
      isDrillDown ? (r.location ?? 'Unknown') : r.event;

    const byKey = new Map<string, {
      buys: number;
      sells: number;
      lossSum: number;
      lossCount: number;
      priceSum: number;
      priceCount: number;
      eventDate: string | null;
    }>();

    for (const r of filtered) {
      const key = getKey(r);
      if (!byKey.has(key)) {
        byKey.set(key, { buys: 0, sells: 0, lossSum: 0, lossCount: 0, priceSum: 0, priceCount: 0, eventDate: null });
      }
      const agg = byKey.get(key)!;

      if (r.type === 'BUY') {
        agg.buys++;
        // Capture first non-null event_date for tooltip
        if (!agg.eventDate && r.event_date) agg.eventDate = r.event_date;
      }

      if (r.type === 'SELL') {
        agg.sells++;
        if (!agg.eventDate && r.event_date) agg.eventDate = r.event_date;
        if (r.price != null) {
          agg.priceSum += r.price;
          agg.priceCount++;
        }
        if (r.price != null && r.original_price_inferred != null && r.original_price_inferred > 0) {
          const loss = ((r.original_price_inferred - r.price) / r.original_price_inferred) * 100;
          agg.lossSum += loss;
          agg.lossCount++;
        }
      }
    }

    let result: Omit<EventAggregate, 'cx' | 'cy' | 'r'>[] = [];
    byKey.forEach((agg, key) => {
      if (agg.buys === 0 && agg.priceCount === 0) return;
      result.push({
        event: key,
        demand: agg.buys,
        sells: agg.sells,
        avgLoss: agg.lossCount > 0 ? agg.lossSum / agg.lossCount : 0,
        avgLossValid: agg.lossCount > 0,
        avgPrice: agg.priceCount > 0 ? agg.priceSum / agg.priceCount : 0,
        eventDate: agg.eventDate,
      });
    });

    // Apply minDemand filter in artist view only
    if (!isDrillDown && minDemand > 0) {
      result = result.filter((e) => e.demand >= minDemand);
    }

    if (result.length === 0) return [];

    const demands = result.map((e) => e.demand);
    const losses = result.map((e) => e.avgLoss);
    const prices = result.map((e) => e.avgPrice);

    const [demandMin, demandMax] = guardDomain(0, Math.max(...demands));
    const [lossMin, lossMax] = guardDomain(
      Math.min(0, ...losses),
      Math.max(0, ...losses),
    );
    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);

    const chartW = svgWidth - PAD.left - PAD.right;
    const chartH = SVG_HEIGHT - PAD.top - PAD.bottom;

    return result.map((e) => ({
      ...e,
      cx: PAD.left + linear(e.demand, demandMin, demandMax, 0, chartW),
      cy: PAD.top + linear(e.avgLoss, lossMax, lossMin, 0, chartH),
      r: Math.max(MIN_R, sqrtScale(e.avgPrice, priceMin, priceMax, MIN_R, MAX_R)),
    }));
  }, [records, eventFilter, startDate, endDate, minDemand, drillDownArtist, svgWidth]);

  // ── Tooltip ────────────────────────────────────────────────────────────────

  const activeEvent = hoveredEvent ?? clickedEvent;
  const activeBubble = activeEvent ? aggregates.find((a) => a.event === activeEvent) : null;

  function tooltipStyle(b: EventAggregate): React.CSSProperties {
    const xPct = b.cx / svgWidth;
    const yPct = b.cy / SVG_HEIGHT;
    const left = xPct > 0.55 ? undefined : `${b.cx + b.r + 10}px`;
    const right = xPct > 0.55 ? `${svgWidth - b.cx + b.r + 10}px` : undefined;
    const top = yPct > 0.6 ? undefined : `${b.cy}px`;
    const bottom = yPct > 0.6 ? `${SVG_HEIGHT - b.cy + 4}px` : undefined;
    return { position: 'absolute', left, right, top, bottom };
  }

  // ── Axis ticks ─────────────────────────────────────────────────────────────

  const axisData = useMemo(() => {
    if (aggregates.length === 0) return null;
    const demands = aggregates.map((a) => a.demand);
    const losses = aggregates.map((a) => a.avgLoss);
    const [demandMin, demandMax] = guardDomain(0, Math.max(...demands));
    const [lossMin, lossMax] = guardDomain(Math.min(0, ...losses), Math.max(0, ...losses));
    const chartW = svgWidth - PAD.left - PAD.right;
    const chartH = SVG_HEIGHT - PAD.top - PAD.bottom;
    const xTicks = niceRange(demandMin, demandMax, 5);
    const yTicks = niceRange(lossMin, lossMax, 5);
    return { demandMin, demandMax, lossMin, lossMax, xTicks, yTicks, chartW, chartH };
  }, [aggregates, svgWidth]);

  // ── Dismiss click-tooltip when clicking SVG background ────────────────────

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if ((e.target as SVGElement).tagName === 'svg') {
      setClickedEvent(null);
    }
  }

  // ── Drill-down entry ───────────────────────────────────────────────────────

  function enterDrillDown(artist: string) {
    setDrillDownArtist(artist);
    setClickedEvent(null);
    setHoveredEvent(null);
  }

  function exitDrillDown() {
    setDrillDownArtist(null);
    setClickedEvent(null);
    setHoveredEvent(null);
  }

  // ── Clear handlers ─────────────────────────────────────────────────────────

  function clearAll() {
    setEventFilter('');
    setStartDate('');
    setEndDate('');
    setMinDemand(DEFAULT_MIN_DEMAND);
    setDrillDownArtist(null);
    setHoveredEvent(null);
    setClickedEvent(null);
  }

  const hasActiveFilter =
    eventFilter || startDate || endDate || minDemand !== DEFAULT_MIN_DEMAND || drillDownArtist !== null;

  const isDrillDown = drillDownArtist !== null;

  return (
    <div className="space-y-4">

      {/* ── Breadcrumb (drill-down only) ──────────────────────────────────── */}
      {isDrillDown && (
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
          <button
            onClick={exitDrillDown}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); exitDrillDown(); } }}
            className="opacity-50 hover:opacity-100 transition-opacity underline underline-offset-2"
            aria-label="Return to all artists view"
          >
            All Artists
          </button>
          <span className="opacity-30">›</span>
          <span className="text-primary font-bold">{drillDownArtist}</span>
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Event name filter (artist view only) */}
        {!isDrillDown && (
          <div className="flex flex-col gap-1 min-w-[180px] flex-1">
            <label className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              Event
            </label>
            <div className="relative">
              <input
                type="text"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                placeholder="Search events…"
                className="w-full border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-primary"
              />
              {eventFilter && (
                <button
                  onClick={() => setEventFilter('')}
                  aria-label="Clear event filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 font-mono text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Date range filters */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest opacity-50">
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {/* Min demand control (artist view only) */}
        {!isDrillDown && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor="min-demand"
              className="font-mono text-[10px] uppercase tracking-widest opacity-50"
            >
              Min demand: {minDemand}
            </label>
            <input
              id="min-demand"
              type="range"
              min={0}
              max={200}
              step={5}
              value={minDemand}
              onChange={(e) => setMinDemand(Number(e.target.value))}
              className="w-28 accent-[var(--coral)]"
            />
          </div>
        )}

        {/* Clear all */}
        {hasActiveFilter && (
          <button
            onClick={clearAll}
            className="font-mono text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 border border-black/15 dark:border-white/15 px-3 py-1.5 transition-opacity self-end"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Chart area ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto"
        style={{ maxWidth: '100%' }}
      >
        <svg
          width={svgWidth}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
          role="img"
          aria-label={
            isDrillDown
              ? `City breakdown for ${drillDownArtist}: ${aggregates.length} cities by demand and seller loss`
              : `Bubble chart showing ${aggregates.length} events by demand and seller loss`
          }
          onClick={handleSvgClick}
          style={{ display: 'block' }}
        >
          {/* ── Axes ──────────────────────────────────────────────────────── */}
          {axisData && (
            <g fill="none">
              <line
                x1={PAD.left} y1={SVG_HEIGHT - PAD.bottom}
                x2={svgWidth - PAD.right} y2={SVG_HEIGHT - PAD.bottom}
                stroke="var(--ink)" strokeOpacity="0.15"
              />
              <line
                x1={PAD.left} y1={PAD.top}
                x2={PAD.left} y2={SVG_HEIGHT - PAD.bottom}
                stroke="var(--ink)" strokeOpacity="0.15"
              />

              {axisData.xTicks.map((v, i) => {
                const x = PAD.left + linear(v, axisData.demandMin, axisData.demandMax, 0, axisData.chartW);
                return (
                  <g key={i}>
                    <line
                      x1={x} y1={SVG_HEIGHT - PAD.bottom}
                      x2={x} y2={SVG_HEIGHT - PAD.bottom + 4}
                      stroke="var(--ink)" strokeOpacity="0.25"
                    />
                    <text
                      x={x} y={SVG_HEIGHT - PAD.bottom + 16}
                      textAnchor="middle"
                      fontFamily="var(--font-mono-stack)"
                      fontSize={10} fill="var(--ink)" opacity={0.45}
                    >
                      {Math.round(v)}
                    </text>
                  </g>
                );
              })}

              {axisData.yTicks.map((v, i) => {
                const y = PAD.top + linear(v, axisData.lossMax, axisData.lossMin, 0, axisData.chartH);
                return (
                  <g key={i}>
                    <line
                      x1={PAD.left - 4} y1={y}
                      x2={PAD.left} y2={y}
                      stroke="var(--ink)" strokeOpacity="0.25"
                    />
                    <text
                      x={PAD.left - 8} y={y}
                      textAnchor="end" dominantBaseline="middle"
                      fontFamily="var(--font-mono-stack)"
                      fontSize={10} fill="var(--ink)" opacity={0.45}
                    >
                      {Math.round(v)}%
                    </text>
                  </g>
                );
              })}

              <text
                x={PAD.left + axisData.chartW / 2} y={SVG_HEIGHT - 8}
                textAnchor="middle"
                fontFamily="var(--font-mono-stack)"
                fontSize={9} fill="var(--ink)" opacity={0.4} letterSpacing="0.08em"
              >
                BUY DEMAND →
              </text>
              <text
                x={14} y={PAD.top + axisData.chartH / 2}
                textAnchor="middle"
                fontFamily="var(--font-mono-stack)"
                fontSize={9} fill="var(--ink)" opacity={0.4} letterSpacing="0.08em"
                transform={`rotate(-90, 14, ${PAD.top + axisData.chartH / 2})`}
              >
                SELLER LOSS % ↑
              </text>

              {axisData.lossMin < 0 && axisData.lossMax > 0 && (() => {
                const zeroY = PAD.top + linear(0, axisData.lossMax, axisData.lossMin, 0, axisData.chartH);
                return (
                  <line
                    x1={PAD.left} y1={zeroY}
                    x2={svgWidth - PAD.right} y2={zeroY}
                    stroke="var(--ink)" strokeOpacity="0.08" strokeDasharray="4 4"
                  />
                );
              })()}
            </g>
          )}

          {/* ── Empty state ───────────────────────────────────────────────── */}
          {aggregates.length === 0 && (
            <text
              x={svgWidth / 2} y={SVG_HEIGHT / 2}
              textAnchor="middle" dominantBaseline="middle"
              fontFamily="var(--font-mono-stack)"
              fontSize={12} fill="var(--ink)" opacity={0.35}
            >
              {records.length === 0
                ? 'No data loaded'
                : 'No events match the current filters'}
            </text>
          )}

          {/* ── Bubbles ───────────────────────────────────────────────────── */}
          <g>
            {aggregates.map((bubble) => {
              const isActive = activeEvent === bubble.event;
              const isDimmed = activeEvent !== null && !isActive;
              const noData = !bubble.avgLossValid;
              return (
                <circle
                  key={bubble.event}
                  cx={bubble.cx}
                  cy={bubble.cy}
                  r={bubble.r}
                  fill="var(--coral)"
                  fillOpacity={isDimmed ? 0.12 : noData ? 0.22 : isActive ? 0.85 : 0.55}
                  stroke="var(--coral)"
                  strokeOpacity={isDimmed ? 0.08 : noData ? 0.35 : isActive ? 1 : 0.7}
                  strokeWidth={isActive ? 1.5 : 0.8}
                  strokeDasharray={noData ? '4 2' : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${bubble.event}: ${bubble.demand} buys, ${bubble.avgLossValid ? bubble.avgLoss.toFixed(1) + '% avg loss' : 'no loss data'}, ₹${Math.round(bubble.avgPrice).toLocaleString()} avg price`}
                  style={{
                    cursor: 'pointer',
                    transition: 'fill-opacity 0.15s, stroke-opacity 0.15s',
                  }}
                  onMouseEnter={() => setHoveredEvent(bubble.event)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDrillDown) {
                      // Artist view: click enters drill-down
                      enterDrillDown(bubble.event);
                    } else {
                      // Drill-down: click pins tooltip
                      setClickedEvent(clickedEvent === bubble.event ? null : bubble.event);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!isDrillDown) {
                        enterDrillDown(bubble.event);
                      } else {
                        setClickedEvent(clickedEvent === bubble.event ? null : bubble.event);
                      }
                    }
                  }}
                />
              );
            })}
          </g>
        </svg>

        {/* ── Tooltip ───────────────────────────────────────────────────── */}
        {activeBubble && (
          <div
            style={tooltipStyle(activeBubble)}
            className="pointer-events-none z-10 border border-black/10 dark:border-white/10 bg-bone dark:bg-surface-container px-3 py-2 shadow-sm font-mono text-xs"
            role="tooltip"
          >
            <div className="font-headline font-black uppercase text-[11px] mb-1 max-w-[180px] leading-tight">
              {activeBubble.event}
            </div>
            <div className="opacity-60 space-y-0.5">
              {activeBubble.eventDate && (
                <div>{formatEventDate(activeBubble.eventDate)}</div>
              )}
              <div>Demand: <span className="text-primary font-bold">{activeBubble.demand}</span> buys</div>
              <div>Sells: <span className="font-bold">{activeBubble.sells}</span></div>
              <div>
                Avg loss:{' '}
                <span className="text-primary font-bold">
                  {activeBubble.avgLossValid
                    ? `${activeBubble.avgLoss.toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div>
                Avg price:{' '}
                <span className="font-bold">
                  ₹{Math.round(activeBubble.avgPrice).toLocaleString()}
                </span>
              </div>
              {!activeBubble.avgLossValid && (
                <div className="opacity-70 italic">Loss data unavailable</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6 font-mono text-[10px] uppercase tracking-widest opacity-40">
        <span>X → buy demand</span>
        <span>Y ↑ seller loss %</span>
        <span>● size = avg price</span>
        {aggregates.length > 0 && (
          <span>{aggregates.length} {isDrillDown ? 'cities' : 'events'} shown</span>
        )}
      </div>
      {/* Loss data legend — always visible */}
      <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest opacity-35">
        <span className="flex items-center gap-1.5">
          <svg width={14} height={14} aria-hidden>
            <circle cx={7} cy={7} r={5} fill="var(--coral)" fillOpacity={0.55} stroke="var(--coral)" strokeWidth={1} />
          </svg>
          Loss data available
        </span>
        <span className="flex items-center gap-1.5">
          <svg width={14} height={14} aria-hidden>
            <circle cx={7} cy={7} r={5} fill="var(--coral)" fillOpacity={0.22} stroke="var(--coral)" strokeWidth={1} strokeDasharray="3 1.5" />
          </svg>
          Loss data unavailable
        </span>
      </div>
    </div>
  );
}
