'use client';

import { useState, useCallback } from 'react';
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
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
  const handleHover = useCallback((n: HoverInfo | null) => setHovered(n), []);

  return (
    <>
      {/* Status banner — sticky below nav */}
      <div className={`status-banner ${hovered ? 'has-hover' : ''}`}>
        <div className="status-inner">
          {hovered ? (
            <>
              <span className={`status-tag tag-${hovered.cat}`}>
                {CAT_LABEL[hovered.cat] ?? hovered.cat.toUpperCase()}
              </span>
              <span className="status-label">{hovered.label}</span>
              <span className="status-hint">{COPY.home.graph.activeHint}</span>
            </>
          ) : (
            <>
              <span className="status-dot" />
              <span className="status-idle">{COPY.home.graph.idle}</span>
              <span className="status-hint">{COPY.home.graph.idleHint}</span>
            </>
          )}
        </div>
      </div>

      {/* Hero graph */}
      <section className="hero-graph">
        <HomeGraph
          writingLeaves={writingLeaves}
          recordLeaves={recordLeaves}
          tagEdges={tagEdges}
          onHover={handleHover}
        />
      </section>
    </>
  );
}
