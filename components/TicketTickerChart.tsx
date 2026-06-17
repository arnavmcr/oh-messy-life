'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { TicketRecord } from '@/lib/ticket-ticker';
import { getGenre, getGenreColor, GENRE_COLORS } from '@/lib/genre-map';

// ── Constants ────────────────────────────────────────────────────────────────

const SVG_HEIGHT = 460;
const MIN_SVG_WIDTH = 480;
const PAD = { top: 40, right: 40, bottom: 55, left: 68 };
const MIN_R = 6;
const MAX_R = 36;
const MIN_DOMAIN_SPAN = 10;
const DEFAULT_MIN_DEMAND = 40;
// Records where |computed loss| falls outside this band are likely inference
// errors (e.g. a dataset-inferred original price that's clearly wrong) and
// are excluded from avgLoss aggregation.
const LOSS_OUTLIER_MIN = -100;
const LOSS_OUTLIER_MAX = 200;

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventAggregate {
  event: string;
  demand: number;
  sells: number;
  avgLoss: number;
  avgLossValid: boolean;
  avgPrice: number;
  eventDate: string | null;
  genre: string;
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

// Generates ticks at multiples of `step`, up to 6 ticks max.
function fixedStepTicks(maxVal: number, step = 500, maxTicks = 6): number[] {
  const ceiling = Math.ceil(Math.max(maxVal, step) / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= ceiling; v += step) ticks.push(v);
  if (ticks.length > maxTicks) return fixedStepTicks(maxVal, step * 2, maxTicks);
  return ticks;
}

function formatTickLabel(v: number): string {
  if (v === 0) return '0';
  if (v >= 1000) return `${v / 1000}k`;
  return String(v);
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

  // ── Full-corpus callout data (unfiltered, stable across filter changes) ────

  const calloutData = useMemo(() => {
    const byEvent = new Map<string, {
      buys: number;
      lossSum: number;
      lossCount: number;
      priceSum: number;
      priceCount: number;
    }>();

    for (const r of records) {
      if (!r.event) continue;
      if (!byEvent.has(r.event)) {
        byEvent.set(r.event, { buys: 0, lossSum: 0, lossCount: 0, priceSum: 0, priceCount: 0 });
      }
      const agg = byEvent.get(r.event)!;
      if (r.type === 'BUY') agg.buys++;
      if (r.type === 'SELL') {
        if (r.price != null) { agg.priceSum += r.price; agg.priceCount++; }
        if (r.price != null && r.original_price_inferred != null && r.original_price_inferred > 0) {
          const loss = ((r.original_price_inferred - r.price) / r.original_price_inferred) * 100;
          if (loss >= LOSS_OUTLIER_MIN && loss <= LOSS_OUTLIER_MAX) {
            agg.lossSum += loss;
            agg.lossCount++;
          }
        }
      }
    }

    let mostWanted = { event: '', demand: 0 };
    let steepestLoss = { event: '', loss: 0 };
    let priciest = { event: '', price: 0 };

    byEvent.forEach((agg, event) => {
      if (agg.buys > mostWanted.demand) mostWanted = { event, demand: agg.buys };
      if (agg.lossCount > 0) {
        const avgLoss = agg.lossSum / agg.lossCount;
        if (avgLoss > steepestLoss.loss) steepestLoss = { event, loss: avgLoss };
      }
      if (agg.priceCount > 0) {
        const avgPrice = agg.priceSum / agg.priceCount;
        if (avgPrice > priciest.price) priciest = { event, price: avgPrice };
      }
    });

    return { mostWanted, steepestLoss, priciest };
  }, [records]);

  // ── Filter + aggregate ────────────────────────────────────────────────────

  const aggregates: EventAggregate[] = useMemo(() => {
    const filterLower = eventFilter.toLowerCase();
    const isDrillDown = drillDownArtist !== null;

    const filtered = records.filter((r) => {
      if (!r.event) return false;
      if (isDrillDown) {
        if (r.event !== drillDownArtist) return false;
      } else {
        if (filterLower && !r.event.toLowerCase().includes(filterLower)) return false;
      }
      if (startDate && r.message_date < startDate) return false;
      if (endDate && r.message_date > endDate) return false;
      return true;
    });

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
      artistEvent: string;
    }>();

    for (const r of filtered) {
      const key = getKey(r);
      if (!byKey.has(key)) {
        byKey.set(key, {
          buys: 0, sells: 0, lossSum: 0, lossCount: 0,
          priceSum: 0, priceCount: 0, eventDate: null, artistEvent: r.event,
        });
      }
      const agg = byKey.get(key)!;

      if (r.type === 'BUY') {
        agg.buys++;
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
          // Exclude outliers — values outside [-100%, 200%] are likely inference errors
          if (loss >= LOSS_OUTLIER_MIN && loss <= LOSS_OUTLIER_MAX) {
            agg.lossSum += loss;
            agg.lossCount++;
          }
        }
      }
    }

    let result: Omit<EventAggregate, 'cx' | 'cy' | 'r'>[] = [];
    byKey.forEach((agg, key) => {
      if (agg.buys === 0 && agg.priceCount === 0) return;
      const artistName = isDrillDown ? drillDownArtist! : key;
      result.push({
        event: key,
        demand: agg.buys,
        sells: agg.sells,
        avgLoss: agg.lossCount > 0 ? agg.lossSum / agg.lossCount : 0,
        avgLossValid: agg.lossCount > 0,
        avgPrice: agg.priceCount > 0 ? agg.priceSum / agg.priceCount : 0,
        eventDate: agg.eventDate,
        genre: getGenre(artistName),
      });
    });

    if (!isDrillDown && minDemand > 0) {
      result = result.filter((e) => e.demand >= minDemand);
    }

    if (result.length === 0) return [];

    const demands = result.map((e) => e.demand);
    const losses = result.map((e) => e.avgLoss);
    const prices = result.map((e) => e.avgPrice);

    const [demandMin, demandMax] = guardDomain(0, Math.max(...demands));

    // Y axis always starts at 0 — no negative side after outlier exclusion
    const rawLossMax = Math.max(0, ...losses);
    const lossMin = 0;
    const lossMax = Math.max(rawLossMax, MIN_DOMAIN_SPAN);

    const priceMin = Math.min(...prices);
    const priceMax = Math.max(...prices);

    const chartW = svgWidth - PAD.left - PAD.right;
    const chartH = SVG_HEIGHT - PAD.top - PAD.bottom;

    return result.map((e) => ({
      ...e,
      cx: PAD.left + linear(e.demand, demandMin, demandMax, 0, chartW),
      // Clamp avgLoss to [0, ...] so bubbles never fall below the X axis
      cy: PAD.top + linear(Math.max(0, e.avgLoss), lossMax, lossMin, 0, chartH),
      r: Math.max(MIN_R, sqrtScale(e.avgPrice, priceMin, priceMax, MIN_R, MAX_R)),
    }));
  }, [records, eventFilter, startDate, endDate, minDemand, drillDownArtist, svgWidth]);

  // ── KPI stats (from visible aggregates, updates with filters) ─────────────

  const kpiStats = useMemo(() => {
    if (aggregates.length === 0) return null;
    const totalListings = aggregates.reduce((sum, a) => sum + a.demand + a.sells, 0);
    const lossAggs = aggregates.filter((a) => a.avgLossValid);
    const avgLoss = lossAggs.length > 0
      ? lossAggs.reduce((sum, a) => sum + a.avgLoss, 0) / lossAggs.length
      : null;
    const topDemand = aggregates.reduce((max, a) => (a.demand > max.demand ? a : max), aggregates[0]);
    return { eventsTracked: aggregates.length, totalListings, avgLoss, topDemand };
  }, [aggregates]);

  // ── Visible genres (filtered to only genres present in current view) ───────

  const visibleGenres = useMemo(() => {
    const seen = new Set(aggregates.map((a) => a.genre));
    return Object.keys(GENRE_COLORS).filter((g) => seen.has(g));
  }, [aggregates]);

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
    const lossMin = 0;
    const lossMax = Math.max(0, ...losses, MIN_DOMAIN_SPAN);
    const chartW = svgWidth - PAD.left - PAD.right;
    const chartH = SVG_HEIGHT - PAD.top - PAD.bottom;
    const xTicks = fixedStepTicks(demandMax);
    const yTicks = niceRange(lossMin, lossMax, 5);
    return { demandMin, demandMax, lossMin, lossMax, xTicks, yTicks, chartW, chartH };
  }, [aggregates, svgWidth]);

  // ── SVG background click → dismiss pinned tooltip ─────────────────────────

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if ((e.target as SVGElement).tagName === 'svg') setClickedEvent(null);
  }

  // ── Drill-down ─────────────────────────────────────────────────────────────

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

      {/* ── KPI stat cards (artist view only, updates with filters) ─────── */}
      {kpiStats && !isDrillDown && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          <div className="border border-black/15 dark:border-white/15 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-1">Events tracked</div>
            <div className="font-headline text-2xl font-black text-primary">{kpiStats.eventsTracked}</div>
          </div>
          <div className="border border-black/15 dark:border-white/15 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-1">Total listings</div>
            <div className="font-headline text-2xl font-black text-primary">{kpiStats.totalListings.toLocaleString()}</div>
          </div>
          <div className="border border-black/15 dark:border-white/15 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-1">Avg seller loss</div>
            <div className="font-headline text-2xl font-black text-primary">
              {kpiStats.avgLoss != null ? `${kpiStats.avgLoss.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="border border-black/15 dark:border-white/15 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-1">Top demand</div>
            <div className="font-headline text-2xl font-black text-primary leading-none">{kpiStats.topDemand.demand}</div>
            <div className="font-mono text-[10px] opacity-50 mt-0.5 truncate">{kpiStats.topDemand.event}</div>
          </div>
        </div>
      )}

      {/* ── Callout chips (full-corpus, stable across filter changes) ────── */}
      {!isDrillDown && calloutData.mostWanted.event && (
        <div className="flex flex-wrap gap-2 border-b border-black/10 dark:border-white/10 pb-4">
          <button
            onClick={() => enterDrillDown(calloutData.mostWanted.event)}
            className="flex items-center gap-2 border border-black/15 dark:border-white/15 px-3 py-1.5 hover:border-primary transition-colors text-left"
          >
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">Most wanted</span>
            <span className="font-mono text-[11px] font-bold text-primary">{calloutData.mostWanted.event}</span>
            <span className="font-mono text-[9px] opacity-40">{calloutData.mostWanted.demand} buys</span>
          </button>
          {calloutData.steepestLoss.event && (
            <button
              onClick={() => enterDrillDown(calloutData.steepestLoss.event)}
              className="flex items-center gap-2 border border-black/15 dark:border-white/15 px-3 py-1.5 hover:border-primary transition-colors text-left"
            >
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">Steepest loss</span>
              <span className="font-mono text-[11px] font-bold text-primary">{calloutData.steepestLoss.event}</span>
              <span className="font-mono text-[9px] opacity-40">{calloutData.steepestLoss.loss.toFixed(1)}% avg</span>
            </button>
          )}
          {calloutData.priciest.event && (
            <button
              onClick={() => enterDrillDown(calloutData.priciest.event)}
              className="flex items-center gap-2 border border-black/15 dark:border-white/15 px-3 py-1.5 hover:border-primary transition-colors text-left"
            >
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-50">Priciest ticket</span>
              <span className="font-mono text-[11px] font-bold text-primary">{calloutData.priciest.event}</span>
              <span className="font-mono text-[9px] opacity-40">₹{Math.round(calloutData.priciest.price).toLocaleString()} avg</span>
            </button>
          )}
        </div>
      )}

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

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest opacity-50">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[10px] uppercase tracking-widest opacity-50">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-black/15 dark:border-white/15 bg-transparent px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-primary"
          />
        </div>

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
                      {formatTickLabel(v)}
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
              const color = getGenreColor(bubble.genre);
              return (
                <circle
                  key={bubble.event}
                  cx={bubble.cx}
                  cy={bubble.cy}
                  r={bubble.r}
                  fill={color.fill}
                  fillOpacity={isDimmed ? 0.12 : noData ? 0.22 : isActive ? 0.85 : 0.55}
                  stroke={color.stroke}
                  strokeOpacity={isDimmed ? 0.08 : noData ? 0.35 : isActive ? 1 : 0.7}
                  strokeWidth={isActive ? 1.5 : 0.8}
                  strokeDasharray={noData ? '4 2' : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`${bubble.event}: ${bubble.demand} buys, ${bubble.avgLossValid ? bubble.avgLoss.toFixed(1) + '% avg loss' : 'no loss data'}, ₹${Math.round(bubble.avgPrice).toLocaleString()} avg price`}
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s, stroke-opacity 0.15s' }}
                  onMouseEnter={() => setHoveredEvent(bubble.event)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDrillDown) {
                      enterDrillDown(bubble.event);
                    } else {
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

      {/* ── Axis legend ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6 font-mono text-[10px] uppercase tracking-widest opacity-40">
        <span>X → buy demand</span>
        <span>Y ↑ seller loss %</span>
        <span>● size = avg price</span>
        {aggregates.length > 0 && (
          <span>{aggregates.length} {isDrillDown ? 'cities' : 'events'} shown</span>
        )}
      </div>

      {/* ── Genre legend (only genres present in current view) ────────────── */}
      {visibleGenres.length > 0 && (
        <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest opacity-35">
          {visibleGenres.map((genre) => {
            const color = getGenreColor(genre);
            return (
              <span key={genre} className="flex items-center gap-1.5">
                <svg width={12} height={12} aria-hidden>
                  <circle cx={6} cy={6} r={5} fill={color.fill} fillOpacity={0.6} stroke={color.stroke} strokeWidth={0.8} />
                </svg>
                {genre}
              </span>
            );
          })}
        </div>
      )}

      {/* ── Loss data availability legend ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest opacity-35">
        <span className="flex items-center gap-1.5">
          <svg width={14} height={14} aria-hidden>
            <circle cx={7} cy={7} r={5} fill="var(--ink)" fillOpacity={0.55} stroke="var(--ink)" strokeWidth={1} />
          </svg>
          Loss data available
        </span>
        <span className="flex items-center gap-1.5">
          <svg width={14} height={14} aria-hidden>
            <circle cx={7} cy={7} r={5} fill="var(--ink)" fillOpacity={0.22} stroke="var(--ink)" strokeWidth={1} strokeDasharray="3 1.5" />
          </svg>
          Loss data unavailable
        </span>
      </div>
    </div>
  );
}
