'use client';

import { useRef } from 'react';
import { useAnimationFrame } from 'framer-motion';
import { ShieldCheck, Github, Code2, FileText, Cloud, Trophy, GraduationCap } from 'lucide-react';

/**
 * Liquid-glass "trust orbs" hero.
 *
 * A central pearlescent shield orb (the verified core) circled by six smaller
 * glass bubbles, each holding a skill / evidence icon — GitHub, projects,
 * marksheet, certs, contests, academics. They ride an elliptical orbit; the
 * ones at the front pass *over* the central orb, the ones at the back pass
 * *behind* it (depth faked from the orbit angle: scale + opacity + z-index).
 *
 * Performance: positions are written straight to each node's `style` inside a
 * single `useAnimationFrame` loop — zero React re-renders, so it holds 120fps.
 * Respect for `prefers-reduced-motion` is automatic: the orbit still lays the
 * orbs out once, the CSS iridescent film just stops drifting.
 */

const ORBS = [
  { Icon: Github, label: 'GitHub' },
  { Icon: Code2, label: 'Projects' },
  { Icon: FileText, label: 'Marksheets' },
  { Icon: Cloud, label: 'Certificates' },
  { Icon: Trophy, label: 'Contests' },
  { Icon: GraduationCap, label: 'Academics' },
];

const RADIUS_X = 240; // ellipse half-width  (px)
const RADIUS_Y = 96; // ellipse half-height (px) — flat, tilted-ring look
const SPEED = 0.00016; // radians per ms (~one lap / 39s)

export function HeroOrbs() {
  const orbRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useAnimationFrame((t) => {
    const n = ORBS.length;
    const base = reduced.current ? 0 : t * SPEED;
    for (let i = 0; i < n; i++) {
      const el = orbRefs.current[i];
      if (!el) continue;
      const ang = base + (i / n) * Math.PI * 2;
      const x = Math.cos(ang) * RADIUS_X;
      const y = Math.sin(ang) * RADIUS_Y;
      const depth = (Math.sin(ang) + 1) / 2; // 0 = back, 1 = front
      const scale = 0.62 + depth * 0.5;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      el.style.zIndex = String(20 + Math.round(depth * 60));
      el.style.opacity = String(0.5 + depth * 0.5);
    }
  });

  return (
    <div className="relative h-[460px] w-full select-none" aria-hidden>
      {/* Soft glow puddle under the whole composition */}
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,210,200,0.55),rgba(214,205,245,0.25)_55%,transparent_75%)] blur-2xl" />

      {/* Orbit ring (tilted ellipse) */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width={RADIUS_X * 2 + 80}
        height={RADIUS_Y * 2 + 80}
        viewBox={`0 0 ${RADIUS_X * 2 + 80} ${RADIUS_Y * 2 + 80}`}
        style={{ zIndex: 10 }}
      >
        <ellipse
          cx={RADIUS_X + 40}
          cy={RADIUS_Y + 40}
          rx={RADIUS_X}
          ry={RADIUS_Y}
          fill="none"
          stroke="rgba(120,100,150,0.25)"
          strokeWidth={1}
          strokeDasharray="2 6"
        />
      </svg>

      {/* Central pearl shield orb */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-[float_6s_ease-in-out_infinite]"
        style={{ zIndex: 50 }}
      >
        <div className="glass-orb relative grid h-[184px] w-[184px] place-items-center">
          <div className="iridescent-film absolute inset-0 opacity-70" />
          <div className="absolute inset-[6px] rounded-full bg-[radial-gradient(circle_at_36%_28%,rgba(255,255,255,0.9),rgba(255,255,255,0.25)_60%,transparent)]" />
          <ShieldCheck
            className="relative h-16 w-16 text-emerald-600/90 drop-shadow-[0_2px_6px_rgba(16,185,129,0.35)]"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Orbiting skill bubbles */}
      {ORBS.map((o, i) => {
        const Icon = o.Icon;
        return (
          <div
            key={o.label}
            ref={(el) => {
              orbRefs.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2 will-change-transform"
            title={o.label}
          >
            <div className="glass-orb relative grid h-[68px] w-[68px] place-items-center">
              <div className="iridescent-film absolute inset-0 opacity-50" />
              <Icon className="relative h-7 w-7 text-stone-700" strokeWidth={1.6} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
