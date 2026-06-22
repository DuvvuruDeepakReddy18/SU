'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * Pure-CSS scene. A single editorial sentence carries the section; three
 * "fake claim" cards drift in from the sides, then disintegrate (translate
 * + blur + fade) as the user scrolls past. The motion is scroll-linked so
 * the cards feel anchored to the page, not animating on a timer.
 */
const CLAIMS = [
  { label: 'Excellent communication skills' },
  { label: '"Expert" in 14 languages' },
  { label: 'CGPA — 9.8' },
];

export function SceneProblem() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Headline animates in on its own timeline; cards drift in 0.15-0.55,
  // then disintegrate 0.6-0.95.
  const headlineY = useTransform(scrollYProgress, [0, 0.25], [60, 0]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.18], [0, 1]);
  const cardDriftY = useTransform(scrollYProgress, [0.15, 0.55], [40, 0]);
  const cardOpacity = useTransform(scrollYProgress, [0.15, 0.4, 0.6, 0.95], [0, 1, 1, 0]);
  const cardBlur = useTransform(scrollYProgress, [0.6, 0.95], [0, 12]);
  const cardScale = useTransform(scrollYProgress, [0.6, 0.95], [1, 0.92]);
  const filter = useTransform(cardBlur, (b) => `blur(${b}px)`);

  return (
    <section
      ref={ref}
      className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-20"
    >
      {/* Subtle radial accent behind the text */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_60%)]" />

      <motion.h2
        style={{ y: headlineY, opacity: headlineOpacity }}
        className="text-center text-balance max-w-4xl text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
      >
        Resumes are <em className="not-italic text-muted-foreground">claims.</em>{' '}
        <br className="hidden md:block" />
        Skills need{' '}
        <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
          proof.
        </span>
      </motion.h2>

      <motion.p
        style={{ y: headlineY, opacity: headlineOpacity }}
        className="mt-6 max-w-xl text-center text-muted-foreground text-base md:text-lg"
      >
        Recruiters wade through self-rated stars and fake CGPAs. SkillVerify replaces them with four
        layers of evidence, every claim backed by a document, a run, or a human.
      </motion.p>

      {/* Fake-claim cards that disintegrate on scroll-out */}
      <motion.div
        style={{ y: cardDriftY, opacity: cardOpacity, filter, scale: cardScale }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl"
      >
        {CLAIMS.map((c, i) => (
          <div
            key={c.label}
            className="rounded-xl border bg-card/40 backdrop-blur px-5 py-4 text-sm text-muted-foreground"
            style={{ transform: `rotate(${(i - 1) * 1.5}deg)` }}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-rose-400/80 mb-1">
              Unverified
            </div>
            {c.label}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
