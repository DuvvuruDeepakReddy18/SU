'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Big radial gradient that follows the cursor across the hero — the spotlight
 * picks up the 3D scene behind it. Pointer-events:none so the gradient never
 * intercepts clicks on real elements.
 *
 * Wrap inside any positioned container; the spotlight tracks pointer movement
 * within that container.
 */
export function SpotlightCursor({ size = 600, color }: { size?: number; color?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xs = useSpring(x, { stiffness: 120, damping: 22 });
  const ys = useSpring(y, { stiffness: 120, damping: 22 });
  const bg = useMotionTemplate`radial-gradient(${size}px circle at ${xs}px ${ys}px, ${color ?? 'rgba(16,185,129,0.20)'}, transparent 60%)`;

  return (
    <motion.div
      onPointerMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
      className="pointer-events-auto absolute inset-0 -z-[5] hidden md:block"
      style={{ background: bg }}
    />
  );
}

/**
 * Wraps a button (or any block) and pulls it gently toward the cursor while
 * hovered. Strength is the max translation in px. Uses spring physics so the
 * snap-back never overshoots.
 */
export function Magnetic({
  children,
  strength = 12,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xs = useSpring(x, { stiffness: 250, damping: 18 });
  const ys = useSpring(y, { stiffness: 250, damping: 18 });

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        // Clamp to strength
        const maxDist = Math.max(rect.width, rect.height);
        x.set((dx / maxDist) * strength);
        y.set((dy / maxDist) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x: xs, y: ys }}
      className={cn('inline-block', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * 3D-tilt card. As the cursor moves over the card, the card rotates around
 * its X and Y axes (small angles, capped at maxTilt). The CSS perspective is
 * inherited from the parent so cards inside a grid all tilt the same way.
 *
 * Also adds a subtle gloss layer that follows the cursor — premium SaaS feel.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 8,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  // Glare position 0..100% along both axes
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const rxs = useSpring(rx, { stiffness: 250, damping: 20 });
  const rys = useSpring(ry, { stiffness: 250, damping: 20 });

  const rotateX = useTransform(rxs, (v) => `${v}deg`);
  const rotateY = useTransform(rys, (v) => `${v}deg`);

  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.25), transparent 60%)`;

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width; // 0..1
        const py = (e.clientY - rect.top) / rect.height; // 0..1
        rx.set((0.5 - py) * 2 * maxTilt);
        ry.set((px - 0.5) * 2 * maxTilt);
        gx.set(px * 100);
        gy.set(py * 100);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 1000,
      }}
      className={cn('relative', className)}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
          style={{ background: glareBg }}
        />
      )}
    </motion.div>
  );
}
