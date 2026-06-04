'use client';

import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

/**
 * Wraps a block in a slide-up + fade-in animation that fires once per page
 * the first time it scrolls into view. Generic enough to wrap any section.
 */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated word-by-word reveal for the hero headline. Each word fades up
 * with a tiny stagger — the whole headline assembles in ~0.8s.
 */
export function AnimatedHeadline({
  text,
  highlight,
  className,
}: {
  text: string;
  // Optional substring inside `text` to color-highlight + emphasize.
  highlight?: string;
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <h1 className={className} aria-label={text}>
      {words.map((w, i) => {
        const isHi = highlight && (highlight.split(' ') ?? []).includes(w);
        return (
          <motion.span
            key={`${w}-${i}`}
            initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className={
              isHi
                ? 'inline-block mr-[0.25em] text-emerald-600 dark:text-emerald-400'
                : 'inline-block mr-[0.25em]'
            }
          >
            {w}
          </motion.span>
        );
      })}
    </h1>
  );
}

/**
 * Number that counts from 0 → `value` when scrolled into view. `display`
 * lets us format the number (e.g. "170+", "4-Layer").
 */
export function CountUp({
  value,
  duration = 1.8,
  format,
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (latest) =>
    format ? format(latest) : Math.round(latest).toLocaleString(),
  );

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
