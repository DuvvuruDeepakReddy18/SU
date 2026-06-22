'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { ShieldCheck, Code2, Layers, Users } from 'lucide-react';

// Animated count-up stat band — the "alive numbers" feel modern landings use.
const STATS = [
  { icon: ShieldCheck, value: 250, suffix: '+', label: 'Verified institutions' },
  { icon: Code2, value: 1500, suffix: '+', label: 'Practice problems' },
  { icon: Layers, value: 4, suffix: '', label: 'Trust layers (L1–L4)' },
  { icon: Users, value: 5, suffix: '', label: 'Role-based portals' },
];

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {n.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

export function LandingStats() {
  return (
    <section className="border-y border-border/40 bg-white/30 backdrop-blur">
      <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="text-center">
              <Icon className="mx-auto h-5 w-5 text-emerald-600" />
              <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
