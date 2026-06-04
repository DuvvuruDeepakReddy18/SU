'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Mounts a Lenis instance on first paint. Lenis intercepts wheel events and
 * lerps the document scroll position toward the target — buttery-smooth feel
 * award-winning landing pages use. Disables itself on touch / reduced-motion
 * so we don't fight native scroll on mobile or interfere with accessibility.
 *
 * Anchor-link clicks still work because the browser-native hash-scroll fires
 * a scroll event Lenis happily picks up.
 */
export function SmoothScrollProvider() {
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Tuned for 120Hz: a smaller `lerp` (was implicit ~1.15 duration) catches
    // up faster per frame, so 120Hz displays see twice the catch-up steps
    // and the scroll feels glassy instead of laggy. easeOutExpo as the
    // wheel-fling shape gives the "snap then settle" feel premium sites have.
    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      // Touch devices: let the OS handle inertia.
      syncTouch: false,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
