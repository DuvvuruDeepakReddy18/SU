'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Check, ScanLine, Sparkles, FileText, Code2 } from 'lucide-react';

const CODE_LINES = [
  '// twoSum.ts — practice arena',
  'function twoSum(nums: number[], target: number) {',
  '  const map = new Map<number, number>();',
  '  for (let i = 0; i < nums.length; i++) {',
  '    const need = target - nums[i];',
  '    if (map.has(need)) return [map.get(need)!, i];',
  '    map.set(nums[i], i);',
  '  }',
  '}',
  '// ✓ 17 / 17 test cases passed in 4ms',
];

/**
 * Two-panel scrollytelling scene:
 *   left  → Monaco-style editor that "types itself" as the user enters the section
 *   right → a marksheet card that drops in, gets scanned by an OCR sweep line,
 *           then gets a green "Verified" stamp.
 *
 * No 3D here on purpose — the storytelling is in the UI fidelity, not the
 * polygons. Costs almost nothing on the GPU.
 */
export function SceneFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Typing progresses 0..1 across [0.1, 0.5] of the section.
  const typeProgress = useTransform(scrollYProgress, [0.1, 0.5], [0, 1]);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    const full = CODE_LINES.join('\n');
    return typeProgress.on('change', (v) => {
      const n = Math.floor(v * full.length);
      setTyped(full.slice(0, n));
    });
  }, [typeProgress]);

  // Right column choreography.
  const sheetY = useTransform(scrollYProgress, [0.2, 0.5], [80, 0]);
  const sheetOpacity = useTransform(scrollYProgress, [0.2, 0.45], [0, 1]);
  const scanY = useTransform(scrollYProgress, [0.5, 0.8], ['0%', '100%']);
  const scanOpacity = useTransform(scrollYProgress, [0.48, 0.52, 0.78, 0.82], [0, 1, 1, 0]);
  const stampScale = useTransform(scrollYProgress, [0.78, 0.88], [0.6, 1]);
  const stampOpacity = useTransform(scrollYProgress, [0.78, 0.85], [0, 1]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  const headerY = useTransform(scrollYProgress, [0, 0.15], [40, 0]);

  return (
    <section ref={ref} className="relative min-h-[200vh]" aria-label="From practice to verified">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        <div className="container mx-auto px-6 grid lg:grid-cols-[1fr_1fr_1fr] gap-8 items-center">
          {/* Header rail (left, narrow) */}
          <motion.div style={{ opacity: headerOpacity, y: headerY }} className="max-w-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-600 mb-4">
              How the proof gets made
            </div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              You write the code.{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                We verify
              </span>{' '}
              the proof.
            </h2>
            <p className="mt-5 text-sm text-muted-foreground">
              Practice in the browser, upload your marksheet, connect GitHub. Each artifact gets
              scanned, fingerprinted, and stamped — or sent to a human reviewer.
            </p>
          </motion.div>

          {/* Editor mock (centre) */}
          <div className="relative">
            <div className="rounded-xl border bg-[#0b1220] shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 text-[10px] text-white/40 inline-flex items-center gap-1">
                  <Code2 className="h-3 w-3" /> twoSum.ts · Practice Arena
                </div>
              </div>
              <pre className="text-[12px] leading-[1.55] p-4 font-mono text-emerald-100/90 min-h-[280px] whitespace-pre-wrap">
                <Highlighted text={typed} />
                <span className="inline-block w-[7px] h-[14px] bg-emerald-300 align-[-2px] ml-0.5 animate-pulse" />
              </pre>
            </div>
            {/* Floating success chip */}
            <motion.div
              style={{
                opacity: useTransform(scrollYProgress, [0.45, 0.55], [0, 1]),
                y: useTransform(scrollYProgress, [0.45, 0.55], [10, 0]),
              }}
              className="absolute -bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1.5 text-xs text-emerald-700 backdrop-blur"
            >
              <Sparkles className="h-3 w-3" /> +120 points · L1 unlocked
            </motion.div>
          </div>

          {/* Marksheet card (right) */}
          <div className="relative">
            <motion.div
              style={{ y: sheetY, opacity: sheetOpacity }}
              className="relative rounded-xl border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs font-medium">Semester 4 — Marksheet.pdf</div>
              </div>
              <div className="p-5 space-y-2.5 text-xs">
                <SkeletonLine width="80%" />
                <SkeletonLine width="55%" />
                <SkeletonLine width="92%" />
                <SkeletonLine width="40%" />
                <SkeletonLine width="78%" />
                <SkeletonLine width="62%" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Cell label="SGPA" value="8.7" />
                  <Cell label="CGPA" value="8.5" />
                  <Cell label="Date" value="06/2026" />
                </div>
              </div>

              {/* OCR sweep line */}
              <motion.div
                style={{ y: scanY, opacity: scanOpacity }}
                className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_18px_4px_rgba(16,185,129,0.7)]"
              />
              {/* OCR scanning chip */}
              <motion.div
                style={{ opacity: scanOpacity }}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/80 border border-emerald-400/30 px-2.5 py-1 text-[10px] text-emerald-700 backdrop-blur"
              >
                <ScanLine className="h-3 w-3" /> OCR scan
              </motion.div>

              {/* Stamp */}
              <motion.div
                style={{ scale: stampScale, opacity: stampOpacity }}
                className="absolute bottom-4 right-4 grid place-items-center rounded-full bg-emerald-500 text-white h-14 w-14 shadow-xl rotate-[-8deg] border-4 border-emerald-400/40"
              >
                <Check className="h-6 w-6" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.div
              style={{ opacity: stampOpacity }}
              className="mt-3 text-center text-xs text-emerald-700 inline-flex items-center gap-1.5 w-full justify-center"
            >
              Verified by SkillVerify · name + grade + edit-signs checked
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Naive syntax shading so the editor doesn't read as flat white. */
function Highlighted({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  text
    .split(/(\b(?:function|return|const|let|for|if)\b|\/\/[^\n]*|".*?"|<[\w<>[\]]+>|\b\d+\b)/g)
    .forEach((p, i) => {
      if (!p) return;
      if (/^\/\//.test(p))
        parts.push(
          <span key={i} className="text-emerald-400/50">
            {p}
          </span>,
        );
      else if (/^(function|return|const|let|for|if)$/.test(p))
        parts.push(
          <span key={i} className="text-cyan-300">
            {p}
          </span>,
        );
      else if (/^".*"$/.test(p))
        parts.push(
          <span key={i} className="text-amber-300">
            {p}
          </span>,
        );
      else if (/^<.+>$/.test(p))
        parts.push(
          <span key={i} className="text-violet-300">
            {p}
          </span>,
        );
      else if (/^\d+$/.test(p))
        parts.push(
          <span key={i} className="text-pink-300">
            {p}
          </span>,
        );
      else parts.push(<span key={i}>{p}</span>);
    });
  return <>{parts}</>;
}

function SkeletonLine({ width }: { width: string }) {
  return <div className="h-2 rounded-full bg-muted/60" style={{ width }} />;
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/50 px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}
