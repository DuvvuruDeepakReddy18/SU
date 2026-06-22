'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox } from '@react-three/drei';
import { Group, MathUtils } from 'three';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const LAYERS = [
  {
    code: 'L1',
    name: 'Academic',
    color: '#22d3ee',
    body: 'Verified by your institution. Marksheets OCR-checked for grade, name match, and edit signs.',
  },
  {
    code: 'L2',
    name: 'Certified',
    color: '#34d399',
    body: 'Courses from accredited issuers. Tier-mapped, only the certificates recruiters actually trust.',
  },
  {
    code: 'L3',
    name: 'Proven',
    color: '#a78bfa',
    body: 'Shipped projects, contest podiums, real submissions on a real repo. Evidence over claims.',
  },
  {
    code: 'L4',
    name: 'Expert',
    color: '#f59e0b',
    body: 'Human-screened. A 1:1 interview with a verified senior in the field, recorded and reviewed.',
  },
];

/** Single glass plate that floats into position as scroll progress crosses its slot. */
function Plate({
  index,
  total,
  color,
  scrollRef,
}: {
  index: number;
  total: number;
  color: string;
  scrollRef: React.MutableRefObject<number>;
}) {
  const ref = useRef<Group>(null);
  // Arrival window, staggered so plates assemble in order, all in place by ~0.7.
  const inStart = (index / total) * 0.5 + 0.05;
  const inEnd = inStart + 0.18;

  useFrame((_state, dt) => {
    if (!ref.current) return;
    const s = scrollRef.current;
    const arrive = MathUtils.clamp((s - inStart) / (inEnd - inStart), 0, 1);
    const ease = 1 - Math.pow(1 - arrive, 3);

    const targetY = (index - (total - 1) / 2) * -0.62;
    const startY = 6 - index * 0.4;

    ref.current.position.y = MathUtils.damp(
      ref.current.position.y,
      MathUtils.lerp(startY, targetY, ease),
      6,
      dt,
    );
    ref.current.position.x = MathUtils.damp(
      ref.current.position.x,
      MathUtils.lerp(-2.5, 0, ease),
      6,
      dt,
    );
    ref.current.rotation.z = MathUtils.damp(
      ref.current.rotation.z,
      MathUtils.lerp(-0.6, 0, ease),
      6,
      dt,
    );

    // Stack flourish after all plates have landed.
    const flourish = MathUtils.clamp((s - 0.7) / 0.3, 0, 1);
    ref.current.rotation.y = MathUtils.damp(
      ref.current.rotation.y,
      flourish * Math.PI * 0.18,
      4,
      dt,
    );
  });

  return (
    <group ref={ref}>
      <RoundedBox args={[3, 0.55, 1.6]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.18}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transmission={0.18}
          thickness={0.4}
        />
      </RoundedBox>
    </group>
  );
}

function PlateStack({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  return (
    <group rotation={[-0.15, -0.35, 0]}>
      {LAYERS.map((l, i) => (
        <Plate key={l.code} index={i} total={LAYERS.length} color={l.color} scrollRef={scrollRef} />
      ))}
    </group>
  );
}

/**
 * Bridges a framer-motion MotionValue back into React state for use as a
 * render index. Subscribing manually avoids the rerender cost of the
 * built-in `useTransform → state` pattern.
 */
function useMotionState<T>(mv: MotionValue<T>): T {
  const [v, setV] = useState<T>(mv.get());
  useEffect(() => {
    setV(mv.get());
    return mv.on('change', (next) => setV(next));
  }, [mv]);
  return v;
}

export function SceneLayers() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Mirror scroll into a ref so r3f's useFrame can read without rerendering.
  const scrollRef = useRef(0);
  useEffect(() => scrollYProgress.on('change', (v) => (scrollRef.current = v)), [scrollYProgress]);

  const copyOpacity = useTransform(scrollYProgress, [0.1, 0.3, 0.85, 1], [0, 1, 1, 0]);
  const copyY = useTransform(scrollYProgress, [0.1, 0.3], [40, 0]);
  const activeIdxMV = useTransform(scrollYProgress, (v) => {
    if (v < 0.25) return 0;
    if (v < 0.45) return 1;
    if (v < 0.65) return 2;
    return 3;
  });
  const activeIdx = useMotionState(activeIdxMV);

  return (
    <section
      ref={ref}
      className="relative min-h-[220vh]"
      aria-label="Four-layer verification model"
    >
      {/* Sticky panel pinned for the section's scroll range */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-100/30 to-transparent" />
        <div className="absolute inset-0 grid lg:grid-cols-2 items-center container mx-auto px-6 gap-12">
          {/* Copy column */}
          <motion.div style={{ opacity: copyOpacity, y: copyY }} className="max-w-md">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-600 mb-4">
              Four layers of proof
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Every skill is{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                stacked
              </span>{' '}
              with evidence.
            </h2>

            <div className="mt-10 space-y-3">
              {LAYERS.map((l, i) => (
                <div
                  key={l.code}
                  className={
                    'rounded-lg border px-4 py-3 transition-all duration-500 ' +
                    (i === activeIdx
                      ? 'border-emerald-400/40 bg-emerald-500/5'
                      : 'border-border/40 opacity-50')
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: l.color }}
                    />
                    <span className="text-sm font-medium">
                      {l.code} · {l.name}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground pl-5">{l.body}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3D plates */}
          <div className="relative h-[60vh] hidden lg:block">
            <Canvas
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
              camera={{ position: [0, 0, 6], fov: 40 }}
              className="!absolute inset-0"
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[4, 4, 5]} intensity={1.1} />
                <directionalLight position={[-3, -2, -3]} intensity={0.5} color="#06b6d4" />
                <Environment preset="apartment" />
                <PlateStack scrollRef={scrollRef} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
