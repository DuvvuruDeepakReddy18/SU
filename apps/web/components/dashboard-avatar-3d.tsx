'use client';

import { Suspense, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  Float,
  Html,
  MeshTransmissionMaterial,
  OrbitControls,
  Environment,
} from '@react-three/drei';
import { Group, Mesh } from 'three';
import {
  Sparkles,
  ShieldCheck,
  Code2,
  Briefcase,
  Building2,
  Trophy,
  Users,
  Video,
} from 'lucide-react';

// Bubble nav config — each entry becomes a 3D sphere that navigates on click.
// Positions calculated dynamically by index so adding / removing is trivial.
const NAV = [
  { href: '/dashboard/profile', icon: Sparkles, label: 'Profile', color: '#a78bfa' },
  { href: '/dashboard/verifications', icon: ShieldCheck, label: 'Verify', color: '#10b981' },
  { href: '/dashboard/practice', icon: Code2, label: 'Practice', color: '#3b82f6' },
  { href: '/dashboard/interviews', icon: Video, label: 'Interview', color: '#f59e0b' },
  { href: '/dashboard/freelance', icon: Briefcase, label: 'Freelance', color: '#ec4899' },
  { href: '/dashboard/placements', icon: Building2, label: 'Placements', color: '#06b6d4' },
  { href: '/dashboard/compete', icon: Trophy, label: 'Compete', color: '#eab308' },
  { href: '/dashboard/community', icon: Users, label: 'Community', color: '#f43f5e' },
];

/**
 * Interactive 3D nav for the dashboard hero. A central glass avatar with
 * 8 orbiting bubble shortcuts to the major sections. Clicking a bubble
 * navigates via the Next router; the central avatar rotates slowly on its own.
 *
 * Dynamically imported with ssr:false so Three.js doesn't run during SSR.
 */
export function DashboardAvatar3D({ studentName }: { studentName?: string }) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50/30 via-background to-primary/5 dark:from-emerald-950/20">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.5, 6.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} />
          <pointLight position={[-3, -3, -3]} intensity={0.6} color="#a78bfa" />
          <Environment preset="city" />
          <Scene />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>

      {/* Decorative caption — sits over the canvas */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Your Vault</div>
        {studentName && <div className="text-lg font-semibold">{studentName}</div>}
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none text-[10px] text-muted-foreground">
        Click a bubble to navigate
      </div>
    </div>
  );
}

function Scene() {
  return (
    <>
      {/* Central avatar core */}
      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.4}>
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <MeshTransmissionMaterial
            samples={8}
            thickness={0.5}
            roughness={0.1}
            transmission={1}
            ior={1.3}
            chromaticAberration={0.04}
            color="#a7f3d0"
          />
        </mesh>
      </Float>

      {/* Orbiting nav bubbles. The orbits are tilted slightly for depth. */}
      {NAV.map((n, i) => (
        <NavBubble key={n.href} index={i} total={NAV.length} {...n} />
      ))}
    </>
  );
}

function NavBubble({
  index,
  total,
  href,
  icon: Icon,
  label,
  color,
}: {
  index: number;
  total: number;
  href: string;
  icon: typeof Sparkles;
  label: string;
  color: string;
}) {
  const router = useRouter();
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Orbit parameters: each bubble at its own phase + slight vertical tilt
  // so the formation reads as a 3D ring, not a flat circle.
  const radius = 3;
  const phaseOffset = (index / total) * Math.PI * 2;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime() * 0.25 + phaseOffset;
    group.current.position.x = Math.cos(t) * radius;
    group.current.position.z = Math.sin(t) * radius;
    // Subtle elliptical vertical wobble
    group.current.position.y = Math.sin(t * 1.7 + index) * 0.35;
    if (mesh.current) {
      const target = hovered ? 1.25 : 1;
      mesh.current.scale.lerp({ x: target, y: target, z: target } as never, 0.15);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    router.push(href);
  };

  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.2}>
        {/* Clickable orb */}
        <mesh
          ref={mesh}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'default';
          }}
          castShadow
        >
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.8 : 0.45}
            metalness={0.5}
            roughness={0.25}
          />
        </mesh>

        {/* Icon + label rendered as HTML, billboarded to the camera */}
        <Html
          center
          distanceFactor={8}
          zIndexRange={[10, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <Icon
            style={{
              width: 18,
              height: 18,
              color: 'white',
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.6))',
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </Html>
      </Float>
    </group>
  );
}
