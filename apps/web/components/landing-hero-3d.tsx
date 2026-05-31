'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Stars,
  Text,
  OrbitControls,
  MeshTransmissionMaterial,
  Environment,
} from '@react-three/drei';
import { Group, Mesh } from 'three';

/**
 * 3D hero scene for the marketing page. Renders a glass "vault" core with
 * four orbiting verification-level pins (L1 → L4), a particle starfield,
 * and slow auto-rotation. Pure decoration — no UI inside the canvas.
 */
export function LandingHero3D() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['transparent']} />

        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.4} />
          <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#7dd3fc" />

          {/* Distant star field — gives depth without competing with text */}
          <Stars radius={50} depth={40} count={1500} factor={2} saturation={0} fade speed={0.5} />

          <Environment preset="city" />

          {/* The vault core + orbiting pins */}
          <OrbitingScene />
        </Suspense>

        {/* Subtle auto-rotation — disabled drag/zoom so the hero stays calm */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

function OrbitingScene() {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={group}>
      {/* Vault core: a glass-like icosahedron */}
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.5}>
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[1.2, 1]} />
          <MeshTransmissionMaterial
            samples={8}
            thickness={0.6}
            roughness={0.1}
            transmission={1}
            ior={1.3}
            chromaticAberration={0.06}
            color="#a7f3d0"
          />
        </mesh>
      </Float>

      {/* 4 orbiting verification-level pins */}
      <Pin level={1} color="#3b82f6" orbitRadius={2.6} orbitOffset={0} />
      <Pin level={2} color="#f59e0b" orbitRadius={2.8} orbitOffset={1.57} />
      <Pin level={3} color="#10b981" orbitRadius={2.6} orbitOffset={3.14} />
      <Pin level={4} color="#a78bfa" orbitRadius={2.9} orbitOffset={4.71} />
    </group>
  );
}

function Pin({
  level,
  color,
  orbitRadius,
  orbitOffset,
}: {
  level: number;
  color: string;
  orbitRadius: number;
  orbitOffset: number;
}) {
  const ref = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * 0.4 + orbitOffset;
    ref.current.position.x = Math.cos(t) * orbitRadius;
    ref.current.position.z = Math.sin(t) * orbitRadius;
    ref.current.position.y = Math.sin(t * 1.3) * 0.4;
    if (mesh.current) mesh.current.rotation.y = state.clock.getElapsedTime() * 0.6;
  });

  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={0.4}>
        {/* Pin body */}
        <mesh ref={mesh} castShadow>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.45}
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
        {/* Label "L1" / "L2" / etc, billboarded to the camera */}
        <Text
          position={[0, 0.55, 0]}
          fontSize={0.22}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineColor="#000"
          outlineWidth={0.005}
        >
          {`L${level}`}
        </Text>
      </Float>
    </group>
  );
}
