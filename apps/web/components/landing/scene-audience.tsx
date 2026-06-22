'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  GraduationCap,
  ShieldCheck,
  Lock,
  Sparkles,
  Users,
  Trophy,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const AUDIENCES = [
  {
    eyebrow: 'For companies',
    icon: Building2,
    title: 'Hire from proof, not paper',
    blurb:
      'Search a pool where every claim is verified. Filter to L3+ and reach only candidates with shipped, reproducible evidence.',
    accent: 'from-emerald-400/20 to-cyan-400/10',
    ring: 'group-hover:ring-emerald-400/40',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30',
    points: [
      { icon: ShieldCheck, text: 'Search verified candidates by skill, layer & college' },
      { icon: Lock, text: 'Gated contact, you connect only after a candidate accepts' },
      { icon: Sparkles, text: 'Free while we’re in beta' },
    ],
    cta: { label: 'Post a role', href: '/company/signup' },
  },
  {
    eyebrow: 'For institutions',
    icon: GraduationCap,
    title: 'Your placement cell, live',
    blurb:
      'A read-only command centre for your TPO, every student’s verification and academic status, plus the tools to run placements.',
    accent: 'from-amber-400/20 to-stone-400/10',
    ring: 'group-hover:ring-amber-400/40',
    badge: 'bg-amber-500/15 text-amber-700 border-amber-400/30',
    points: [
      { icon: Users, text: 'Roster of all your students with verification status' },
      { icon: Trophy, text: 'Run campus drives & multi-round competitions' },
      { icon: BarChart3, text: 'Placement analytics, updated in real time' },
    ],
    cta: { label: 'Set up your cell', href: '/institution/signup' },
  },
];

export function SceneAudience() {
  return (
    <section className="relative py-24 md:py-32" aria-label="Who SkillVerify is for">
      <div className="container">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
          custom={0}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-600">
            Both sides of the table
          </div>
          <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-foreground">
            One verified network.{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Two ways in.
            </span>
          </h2>
          <p className="mt-5 text-base text-muted-foreground">
            Students prove it once. Companies and colleges plug into the same source of truth.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {AUDIENCES.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.eyebrow}
                variants={reveal}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                custom={i + 1}
                className="group relative"
              >
                {/* glow */}
                <div
                  className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${a.accent} opacity-0 blur transition-opacity duration-500 group-hover:opacity-100`}
                  aria-hidden
                />
                <div
                  className={`relative flex h-full flex-col rounded-3xl border border-white/60 bg-white/55 p-7 shadow-xl ring-1 ring-transparent backdrop-blur-xl transition-all duration-300 ${a.ring} group-hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-2xl border bg-gradient-to-br ${a.accent} ${a.badge.split(' ')[0]}`}
                    >
                      <Icon className="h-5 w-5 text-stone-700" strokeWidth={2} />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${a.badge}`}
                    >
                      {a.eyebrow}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
                    {a.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">{a.blurb}</p>

                  <ul className="mt-6 space-y-3">
                    {a.points.map((p) => {
                      const P = p.icon;
                      return (
                        <li
                          key={p.text}
                          className="flex items-start gap-2.5 text-sm text-stone-700"
                        >
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/70 border">
                            <P className="h-3 w-3 text-emerald-600" />
                          </span>
                          {p.text}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-7 pt-1">
                    <Link href={a.cta.href}>
                      <Button
                        variant="outline"
                        className="rounded-full border-stone-300 bg-white/50 backdrop-blur transition-all group-hover:border-stone-400 group-hover:shadow-md"
                      >
                        {a.cta.label} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
