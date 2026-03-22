'use client';

import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-surface-container-high">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-surface-container"
        aria-expanded={open}
      >
        <span className="font-mono text-[10px] tracking-[3px] uppercase text-on-surface-variant">
          {title}
        </span>
        <span className="font-mono text-[10px] text-primary flex-shrink-0" aria-hidden>
          {open ? '[ — ]' : '[ + ]'}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-6 pt-2 border-t border-surface-container-high">
          {children}
        </div>
      )}
    </div>
  );
}
