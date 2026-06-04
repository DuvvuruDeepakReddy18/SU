'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

/**
 * Closing scene. Single huge sentence, single button, ambient iridescent
 * particle field behind it. Particle colours are deepened (violet / rose)
 * so they read against the cream backdrop instead of washing out.
 */
export function SceneFinal() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Soft iridescent backdrop so the particles have something to pop on */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(221,214,243,0.55),rgba(255,210,200,0.35)_55%,transparent_80%)]" />

      {/* 3D particle backdrop */}
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 5], fov: 50 }}
        >
          <Suspense fallback={null}>
            <Float speed={0.4} rotationIntensity={0.06} floatIntensity={0.6}>
              <Sparkles count={260} scale={12} size={3} speed={0.2} color="#a78bfa" />
            </Float>
            <Float speed={0.25} rotationIntensity={0.04} floatIntensity={0.4}>
              <Sparkles count={110} scale={20} size={4} speed={0.1} color="#fb7185" />
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* Fade the edges back to cream so particles concentrate centrally */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_50%_50%,transparent,hsl(36_38%_94%/0.85))]" />

      <div className="relative container mx-auto px-6 text-center max-w-3xl">
        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.04] text-foreground pb-2">
          Stop describing your skills.{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Prove
          </span>{' '}
          them.
        </h2>
        <p className="mt-6 text-muted-foreground text-base md:text-lg">
          Sign up free with your institute email. Have a verified portfolio in 48 hours.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 rounded-full shadow-lg shadow-stone-900/15 hover:shadow-xl hover:shadow-stone-900/25 transition-all"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
