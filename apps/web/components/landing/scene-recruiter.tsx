'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, ShieldCheck, MapPin } from 'lucide-react';

const FILTERS = ['L3+', 'React', 'IIT / NIT', 'open to hire'];

const CANDIDATES = [
  {
    name: 'Aarav Mehta',
    college: 'IIT Bombay · CSE',
    layer: 'L4',
    layerColor: '#f59e0b',
    skills: ['React', 'TypeScript', 'Distributed systems'],
    accent: 'from-amber-500/15 to-amber-500/5',
  },
  {
    name: 'Priya Sharma',
    college: 'NIT Trichy · ECE',
    layer: 'L3',
    layerColor: '#a78bfa',
    skills: ['React', 'GraphQL', 'Postgres'],
    accent: 'from-violet-500/15 to-violet-500/5',
  },
  {
    name: 'Karthik Iyer',
    college: 'IIIT Hyderabad · CSE',
    layer: 'L3',
    layerColor: '#a78bfa',
    skills: ['React', 'Rust', 'WebGL'],
    accent: 'from-violet-500/15 to-violet-500/5',
  },
];

export function SceneRecruiter() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Headline reveal
  const headOpacity = useTransform(scrollYProgress, [0, 0.18], [0, 1]);
  const headY = useTransform(scrollYProgress, [0, 0.18], [40, 0]);

  // Search text types itself in 0.15..0.4
  const searchProgress = useTransform(scrollYProgress, [0.15, 0.4], [0, 1]);
  const fullQuery = FILTERS.join(' ');
  const [typedQuery, setTypedQuery] = useState('');
  useEffect(() => {
    return searchProgress.on('change', (v) => {
      const n = Math.floor(v * fullQuery.length);
      setTypedQuery(fullQuery.slice(0, n));
    });
  }, [searchProgress, fullQuery]);

  return (
    <section
      ref={ref}
      className="relative min-h-[180vh]"
      aria-label="Recruiter view, filter by verified level"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        <div className="container mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
          {/* Copy */}
          <motion.div style={{ opacity: headOpacity, y: headY }} className="max-w-md">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-600 mb-4">
              Recruiters see proof, not promises
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Filter to{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                L3+
              </span>
              . Get only candidates with shipped evidence.
            </h2>
            <p className="mt-5 text-sm text-muted-foreground">
              Skill, layer, college, intent. No résumé padding, every chip is reproducible from a
              real artefact on the candidate's profile.
            </p>
          </motion.div>

          {/* Mock recruiter UI */}
          <div className="relative">
            <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
              {/* Search bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <Search className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-mono text-muted-foreground tracking-tight">
                  {typedQuery}
                  <span className="inline-block w-[6px] h-[14px] bg-emerald-300 align-[-2px] ml-0.5 animate-pulse" />
                </div>
              </div>

              {/* Filter chips appear in sequence */}
              <div className="px-4 py-3 border-b flex flex-wrap gap-2">
                {FILTERS.map((f, i) => (
                  <FilterChip
                    key={f}
                    label={f}
                    appearAt={0.4 + i * 0.05}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>

              {/* Candidate rows slide in */}
              <div className="px-3 py-3 space-y-2 min-h-[320px]">
                {CANDIDATES.map((c, i) => (
                  <CandidateRow
                    key={c.name}
                    {...c}
                    appearAt={0.55 + i * 0.08}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              style={{
                opacity: useTransform(scrollYProgress, [0.85, 0.95], [0, 1]),
                y: useTransform(scrollYProgress, [0.85, 0.95], [10, 0]),
              }}
              className="absolute -bottom-4 -right-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 text-white px-3 py-1.5 text-xs shadow-lg"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> 3 verified · 0 padded résumés
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterChip({
  label,
  appearAt,
  scrollYProgress,
}: {
  label: string;
  appearAt: number;
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const opacity = useTransform(scrollYProgress, [appearAt, appearAt + 0.04], [0, 1]);
  const scale = useTransform(scrollYProgress, [appearAt, appearAt + 0.06], [0.85, 1]);
  return (
    <motion.span
      style={{ opacity, scale }}
      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-700 text-xs px-2.5 py-1"
    >
      {label}
    </motion.span>
  );
}

function CandidateRow({
  name,
  college,
  layer,
  layerColor,
  skills,
  accent,
  appearAt,
  scrollYProgress,
}: (typeof CANDIDATES)[number] & {
  appearAt: number;
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  const opacity = useTransform(scrollYProgress, [appearAt, appearAt + 0.06], [0, 1]);
  const x = useTransform(scrollYProgress, [appearAt, appearAt + 0.06], [40, 0]);
  return (
    <motion.div
      style={{ opacity, x }}
      className={`group rounded-xl border bg-gradient-to-r ${accent} px-4 py-3 flex items-center gap-3`}
    >
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 grid place-items-center text-sm font-bold text-emerald-950">
        {name
          .split(' ')
          .map((p) => p[0])
          .join('')}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {college}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {skills.map((s) => (
            <span
              key={s}
              className="text-[10px] rounded bg-background/70 border px-1.5 py-0.5 text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div
        className="text-xs font-bold px-2.5 py-1 rounded-md text-white"
        style={{ background: layerColor }}
      >
        {layer}
      </div>
    </motion.div>
  );
}
