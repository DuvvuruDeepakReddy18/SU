'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns 0..1 progress through a section as the viewport scrolls past it.
 * 0 = top of section just touched viewport bottom,
 * 1 = bottom of section just left viewport top.
 *
 * Two outputs: a React state value (rerenders consumers — use for opacity
 * or one-shot toggles) and a stable ref (no rerenders — use inside r3f
 * useFrame for buttery animations that should not cost reconciliation).
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // total scroll distance over which we want the progress to go 0→1.
      // Bottom of section at viewport top, top of section at viewport bottom.
      const span = rect.height + vh;
      const traveled = vh - rect.top;
      const p = Math.min(1, Math.max(0, traveled / span));
      progressRef.current = p;
      setProgress(p);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { ref, progress, progressRef };
}

/**
 * Maps a 0..1 input through [inLow, inHigh] → [outLow, outHigh], clamped.
 * Pure utility — use to slice section progress into per-element ranges.
 */
export function mapRange(
  v: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number,
): number {
  if (inHigh === inLow) return outLow;
  const t = Math.min(1, Math.max(0, (v - inLow) / (inHigh - inLow)));
  return outLow + t * (outHigh - outLow);
}
