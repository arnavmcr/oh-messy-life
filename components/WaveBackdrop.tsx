'use client';

import { useEffect, useRef, useState } from 'react';

interface WaveBackdropProps {
  contrast?: 'soft' | 'normal' | 'high';
  ink?: string;
  coral?: string;
  violet?: string;
  kelp?: string;
  wine?: string;
}

export default function WaveBackdrop({
  contrast = 'normal',
  ink    = '#0e1822',
  coral  = '#e6536a',
  violet = '#7857c7',
  kelp   = '#5f8b7e',
  wine   = '#872b54',
}: WaveBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 600 });
  const [, setTick] = useState(0);
  const tRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
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
    let raf: number;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(40, now - last) / 16.6;
      last = now;
      tRef.current += dt;
      setTick((k) => (k + 1) % 1e9);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { w, h } = size;
  const t = tRef.current;
  const mul = contrast === 'high' ? 1.55 : contrast === 'soft' ? 0.7 : 1.0;

  const layers = [
    { y: h * 0.06, amp: 22, freq: 0.0080, color: violet, opacity: 0.16 * mul, speed: 0.010, phaseShift: 0   },
    { y: h * 0.17, amp: 28, freq: 0.0095, color: coral,  opacity: 0.24 * mul, speed: 0.014, phaseShift: 0.8 },
    { y: h * 0.30, amp: 26, freq: 0.0110, color: wine,   opacity: 0.22 * mul, speed: 0.011, phaseShift: 1.4 },
    { y: h * 0.44, amp: 32, freq: 0.0085, color: violet, opacity: 0.28 * mul, speed: 0.016, phaseShift: 2.1 },
    { y: h * 0.58, amp: 30, freq: 0.0100, color: kelp,   opacity: 0.22 * mul, speed: 0.012, phaseShift: 2.8 },
    { y: h * 0.71, amp: 36, freq: 0.0078, color: coral,  opacity: 0.26 * mul, speed: 0.018, phaseShift: 3.4 },
    { y: h * 0.84, amp: 28, freq: 0.0105, color: wine,   opacity: 0.30 * mul, speed: 0.013, phaseShift: 4.1 },
    { y: h * 0.94, amp: 24, freq: 0.0092, color: ink,    opacity: 0.28 * mul, speed: 0.009, phaseShift: 4.8 },
  ];

  const wavePath = (yBase: number, amp: number, freq: number, drift: number) => {
    const pts: [number, number][] = [];
    const N = Math.max(24, Math.floor(w / 22));
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * (w + 80) - 40;
      const y = yBase
        + Math.sin(x * freq + drift) * amp
        + Math.sin(x * freq * 2.4 + drift * 1.3) * (amp * 0.35)
        + Math.sin(x * freq * 0.5 + drift * 0.6) * (amp * 0.25);
      pts.push([x, y]);
    }
    const head = `M ${pts[0][0]},${pts[0][1]}`;
    const segs = pts.slice(1).map(([x, y]) => `L ${x},${y}`).join(' ');
    return `${head} ${segs} L ${w + 40},${h + 40} L -40,${h + 40} Z`;
  };

  return (
    <div ref={ref} className="wave-bg-host">
      <svg
        className="wave-bg"
        viewBox={`0 0 ${Math.max(1, w)} ${Math.max(1, h)}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="wave-blur">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        {layers.map((L, i) => (
          <path
            key={i}
            d={wavePath(
              L.y + Math.sin(t * 0.018 + i) * 1.5,
              L.amp,
              L.freq,
              t * L.speed + L.phaseShift,
            )}
            fill={L.color}
            opacity={L.opacity}
            filter="url(#wave-blur)"
          />
        ))}
      </svg>
    </div>
  );
}
