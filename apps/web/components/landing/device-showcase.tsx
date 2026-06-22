'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Code2, Eye, TrendingUp } from 'lucide-react';

/**
 * Interactive device mockup — a SkillVerify phone that tilts toward the cursor
 * (3D), gently floats, and is ringed by floating "live activity" cards. This is
 * the tribeme-style centerpiece: an alive, interactive device rather than a
 * static screenshot. Pure CSS/transform + framer-motion, no 3D engine.
 */

const ACCENT: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-600',
  sky: 'bg-sky-500/15 text-sky-600',
  amber: 'bg-amber-500/15 text-amber-600',
};

const ACTIVITY = [
  {
    icon: CheckCircle2,
    text: 'Aarav verified React',
    sub: 'L4 · Expert panel',
    accent: 'emerald',
    pos: 'left-0 top-24',
    dur: '6s',
  },
  {
    icon: Eye,
    text: 'A recruiter viewed you',
    sub: '2 min ago',
    accent: 'sky',
    pos: 'right-0 top-44',
    dur: '7.5s',
  },
  {
    icon: TrendingUp,
    text: '+250 points',
    sub: '12 problems solved',
    accent: 'amber',
    pos: 'left-3 bottom-24',
    dur: '6.8s',
  },
] as const;

export function DeviceShowcase() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), {
    stiffness: 150,
    damping: 18,
  });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      className="relative mx-auto flex h-[520px] w-full max-w-md items-center justify-center [perspective:1200px]"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden
    >
      {/* glow */}
      <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,210,200,0.5),rgba(214,205,245,0.22)_55%,transparent_75%)] blur-2xl" />

      {/* Phone */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative z-20 h-[460px] w-[228px] animate-[float_7s_ease-in-out_infinite] will-change-transform"
      >
        <div className="relative h-full w-full rounded-[2.4rem] border border-stone-300/70 bg-stone-900 p-2.5 shadow-2xl shadow-stone-900/25">
          <div className="absolute left-1/2 top-3.5 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-full w-full overflow-hidden rounded-[1.9rem] bg-gradient-to-b from-[hsl(36_38%_97%)] to-[hsl(36_30%_93%)]">
            <MockApp />
          </div>
        </div>
      </motion.div>

      {/* Floating live-activity cards */}
      {ACTIVITY.map((a) => {
        const Icon = a.icon;
        return (
          <motion.div
            key={a.text}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute ${a.pos} z-30 flex items-center gap-2 rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-lg shadow-stone-900/5 backdrop-blur`}
          >
            <div
              className="flex items-center gap-2"
              style={{ animation: `float ${a.dur} ease-in-out infinite` }}
            >
              <div className={`grid h-7 w-7 place-items-center rounded-lg ${ACCENT[a.accent]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone-800">{a.text}</div>
                <div className="text-[9px] text-stone-500">{a.sub}</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Stylized SkillVerify mobile profile screen shown inside the phone. */
function MockApp() {
  const skills = [
    { n: 'React', l: 'L4 · Expert' },
    { n: 'Python', l: 'L3 · Proven' },
    { n: 'System Design', l: 'L2 · Certified' },
  ];
  return (
    <div className="flex h-full flex-col gap-3 px-4 pb-4 pt-9">
      <div className="flex items-center gap-2.5">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-stone-700 to-stone-900 text-sm font-semibold text-stone-50">
          AS
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-semibold text-stone-800">
            Aarav Sharma <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-[10px] text-stone-500">IIT Madras · B.Tech</div>
        </div>
      </div>

      <div className="rounded-xl bg-white/70 p-3 shadow-sm">
        <div className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-stone-400">
          Verification
        </div>
        <div className="flex gap-1">
          {['L1', 'L2', 'L3', 'L4'].map((l, i) => (
            <div
              key={l}
              className={`flex-1 rounded-md py-1 text-center text-[9px] font-semibold ${
                i < 3 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-stone-200 text-stone-400'
              }`}
            >
              {l}
            </div>
          ))}
        </div>
      </div>

      {skills.map((s) => (
        <div
          key={s.n}
          className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-stone-500" />
            <span className="text-xs font-medium text-stone-700">{s.n}</span>
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-2.5 w-2.5" /> {s.l}
          </span>
        </div>
      ))}

      <div className="mt-auto rounded-xl bg-gradient-to-br from-stone-800 to-stone-900 p-3 text-stone-50">
        <div className="text-[9px] uppercase tracking-wider text-stone-400">Open to recruiters</div>
        <div className="mt-0.5 text-xs font-semibold">3 skills verified · L4 ready</div>
      </div>
    </div>
  );
}
