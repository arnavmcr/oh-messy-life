'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import HomeGraph, { type HoverInfo, type LeafItem } from './HomeGraph';
import { COPY } from '@/lib/copy';

const CAT_LABEL: Record<string, string> = {
  writing: 'WRITING',
  record: 'RECORD',
  signal: 'SIGNAL',
  labs: 'LABS',
};

interface Props {
  writingLeaves: LeafItem[];
  recordLeaves: LeafItem[];
  tagEdges: [string, string][];
}

export default function HomepageHero({ writingLeaves, recordLeaves, tagEdges }: Props) {
  const [hovered, setHovered]       = useState<HoverInfo | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isTouch, setIsTouch]       = useState(false);
  const heroRef                     = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const handleHover = useCallback((n: HoverInfo | null) => {
    setHovered(n);
    if (!n) setTooltipPos(null);
    // If triggered by touch tap, use the node's screen position
    if (n?.tapPos) setTooltipPos(n.tapPos);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tooltipWidth = 260;
    setTooltipPos({
      x: Math.max(8, Math.min(x + 16, rect.width - tooltipWidth - 8)),
      y: y < 60 ? y + 16 : y - 52,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipPos(null);
    setHovered(null);
  }, []);

  return (
    <>
      {/* Status banner — sticky below nav, idle state only */}
      <div className="status-banner">
        <div className="status-inner">
          <span className="status-dot" />
          <span className="status-idle">{COPY.home.graph.idle}</span>
          <span className="status-hint">{isTouch ? COPY.home.graph.idleHintMobile : COPY.home.graph.idleHint}</span>
        </div>
      </div>

      {/* Hero graph */}
      <section
        className="hero-graph"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <HomeGraph
          writingLeaves={writingLeaves}
          recordLeaves={recordLeaves}
          tagEdges={tagEdges}
          onHover={handleHover}
        />

        {/* Scroll affordance — mobile only, fades out after 3s */}
        <div className="graph-scroll-hint" aria-hidden="true">↓</div>

        {/* Floating tooltip — appears near cursor when a node is hovered */}
        {hovered && tooltipPos && (
          <div
            className="graph-tooltip"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <span className={`status-tag tag-${hovered.cat}`}>
              {CAT_LABEL[hovered.cat] ?? hovered.cat.toUpperCase()}
            </span>
            <span className="graph-tooltip-label">{hovered.label}</span>
            <span className="graph-tooltip-hint">{COPY.home.graph.activeHint}</span>
          </div>
        )}
      </section>
    </>
  );
}
