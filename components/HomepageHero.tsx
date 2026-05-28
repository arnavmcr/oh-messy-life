'use client';

import { useState, useCallback } from 'react';
import WaveBackdrop from './WaveBackdrop';
import HomeGraph, { type HoverInfo, type LeafItem } from './HomeGraph';

const CAT_LABEL: Record<string, string> = {
  writing: 'WRITING',
  record: 'RECORD',
  signal: 'SIGNAL',
  labs: 'LABS',
};

interface Props {
  writingLeaves: LeafItem[];
  recordLeaves: LeafItem[];
}

export default function HomepageHero({ writingLeaves, recordLeaves }: Props) {
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
              <span className="status-hint">click to open · scroll to zoom</span>
            </>
          ) : (
            <>
              <span className="status-dot" />
              <span className="status-idle">hover a node to inspect</span>
              <span className="status-hint">scroll to zoom · drag to pan</span>
            </>
          )}
        </div>
      </div>

      {/* Hero graph */}
      <section className="hero-graph">
        <div className="hero-waves">
          <WaveBackdrop />
        </div>
        <HomeGraph
          writingLeaves={writingLeaves}
          recordLeaves={recordLeaves}
          onHover={handleHover}
        />
      </section>
    </>
  );
}
