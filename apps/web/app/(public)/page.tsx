'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/interactive';
import { Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

import { DeviceShowcase } from '@/components/landing/device-showcase';
import { LandingStats } from '@/components/landing/landing-stats';
import { SceneProblem } from '@/components/landing/scene-problem';
import { SceneLayers } from '@/components/landing/scene-layers';
import { SceneFlow } from '@/components/landing/scene-flow';
import { SceneRecruiter } from '@/components/landing/scene-recruiter';
import { SceneAudience } from '@/components/landing/scene-audience';
import { SceneFinal } from '@/components/landing/scene-final';
import { LandingNavActions, LandingDomainSelector } from '@/components/landing/landing-auth';

/**
 * Landing page — cream / liquid-glass theme.
 *
 * Six scenes:
 *   1. Hero      — pearl shield orbited by glass skill bubbles (CSS, 120fps)
 *   2. Problem   — editorial type, fake claims disintegrate on scroll-out
 *   3. Layers    — pinned, 4 glass plates assemble (3D)
 *   4. Flow      — pinned, mock editor types itself + marksheet stamps "verified"
 *   5. Recruiter — pinned, search query types itself + candidate cards slide in
 *   6. Final CTA — particle field (3D), one button
 *
 * The whole <main> is scoped `.landing-cream` so every CSS-var-driven
 * component resolves to the warm cream palette regardless of the user's
 * dark/light preference. Lenis smooth-scroll is mounted site-wide.
 */
export default function LandingPage() {
  return (
    <main className="landing-cream cream-aurora min-h-screen overflow-x-hidden relative">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-[hsl(36_38%_94%/0.7)] backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg">
            <div className="grid place-items-center h-7 w-7 rounded-lg bg-gradient-to-br from-stone-700 to-stone-900 text-stone-50 shadow-sm">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-foreground">
              Skill<span className="text-emerald-600">Verify</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#for-you" className="hidden md:block">
              <Button variant="ghost" size="sm">
                For companies
              </Button>
            </a>
            <a href="#for-you" className="hidden md:block">
              <Button variant="ghost" size="sm">
                For institutions
              </Button>
            </a>
            <LandingNavActions />
          </nav>
        </div>
      </header>

      {/* Logged-in domain selector — jump straight into any domain */}
      <LandingDomainSelector />

      {/* ============ SCENE 1 — HERO ============ */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        <div className="container relative grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center py-16 md:py-24">
          {/* Copy */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs text-stone-600 backdrop-blur shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Four-layer verified skill portfolios
            </motion.div>

            <WordReveal
              text="Resumes are claims."
              className="mt-6 text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-balance pb-1 text-stone-500"
            />
            <WordReveal
              text="SkillVerify is proof."
              className="mt-1 text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-balance pb-2 text-foreground"
              accentWord="proof."
              delay={0.4}
            />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-xl text-base md:text-lg text-muted-foreground"
            >
              A digital portfolio recruiters can trust. Every claim (your CGPA, your skills, your
              projects) is backed by four layers of evidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Magnetic strength={12}>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="gap-2 rounded-full shadow-lg shadow-stone-900/15 hover:shadow-xl hover:shadow-stone-900/25 transition-all"
                  >
                    Claim a profile <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Magnetic>
              <Magnetic strength={8}>
                <a href="#layers">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-stone-300 bg-white/40 backdrop-blur"
                  >
                    How it works
                  </Button>
                </a>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.35 }}
              className="mt-12 flex items-center gap-6 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 250+ verified institutions
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> 170+ practice problems
              </span>
            </motion.div>
          </div>

          {/* Interactive device mockup — tilts to cursor, floats, live cards.
              Shown on mobile too (scaled), since it's the device-first vibe. */}
          <div className="scale-90 sm:scale-100">
            <DeviceShowcase />
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.6, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex flex-col items-center gap-2"
        >
          <span>Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-stone-400/60 to-transparent" />
        </motion.div>
      </section>

      {/* Animated stat band */}
      <LandingStats />

      {/* ============ SCENE 2 — PROBLEM ============ */}
      <SceneProblem />

      {/* ============ SCENE 3 — 4 LAYERS ============ */}
      <div id="layers">
        <SceneLayers />
      </div>

      {/* ============ SCENE 4 — PRACTICE → VERIFIED ============ */}
      <SceneFlow />

      {/* ============ SCENE 5 — RECRUITER ============ */}
      <SceneRecruiter />

      {/* ============ SCENE 6 — WHO IT'S FOR (companies / institutions) ============ */}
      <div id="for-you">
        <SceneAudience />
      </div>

      {/* ============ SCENE 7 — FINAL CTA ============ */}
      <SceneFinal />

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border/40 py-10">
        <div className="container flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-2">
            <div className="grid place-items-center h-5 w-5 rounded bg-emerald-500/15 text-emerald-700 text-[10px] font-bold">
              S
            </div>
            <span>© {new Date().getFullYear()} SkillVerify · Built for Indian students</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/company/signup" className="hover:text-foreground">
              For companies
            </Link>
            <Link href="/institution/signup" className="hover:text-foreground">
              For institutions
            </Link>
            <Link href="/support" className="hover:text-foreground">
              Support
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/admin" className="hover:text-foreground opacity-60">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/**
 * Per-word staggered reveal. `accentWord` gets a soft iridescent gradient
 * (rose → violet → amber) that ties into the cream/liquid-glass palette.
 */
function WordReveal({
  text,
  className,
  accentWord,
  delay = 0,
}: {
  text: string;
  className?: string;
  accentWord?: string;
  delay?: number;
}) {
  const words = text.split(' ');
  return (
    <h1 className={className}>
      {words.map((w, i) => {
        const isAccent = accentWord && w === accentWord;
        return (
          <motion.span
            key={`${w}-${i}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={
              // pb-1 + leading on the inline-block keeps descenders (g, q, p, y)
              // inside the gradient box; without it, bg-clip-text crops them.
              'inline-block mr-3 leading-[1.1] pb-1 ' +
              (isAccent
                ? 'bg-gradient-to-r from-rose-400 via-violet-400 to-amber-400 bg-clip-text text-transparent bg-[length:200%_140%] bg-[position:0%_50%] animate-shimmer'
                : '')
            }
          >
            {w}
          </motion.span>
        );
      })}
    </h1>
  );
}
