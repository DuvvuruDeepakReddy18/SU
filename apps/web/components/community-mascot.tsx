'use client';

import { motion } from 'framer-motion';

/**
 * SkillVerify community mascot — a stylized spider sitting at the center of
 * a web. The web lines represent the network of student communities the
 * platform connects. Rainbow accent ring nods to the diverse-community
 * pillar; bluish-purple body keeps the "professional yet playful" tone.
 *
 * Pure SVG so it scales crisp at any DPR and animates cheaply with framer.
 */
export function CommunityMascot({ size = 96 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      initial={{ rotate: -8, scale: 0.92 }}
      animate={{ rotate: [-8, 0, -8], scale: [0.92, 1, 0.92] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      aria-label="SkillVerify community mascot"
    >
      <defs>
        <linearGradient id="community-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="community-rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="75%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <radialGradient id="community-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow */}
      <circle cx="60" cy="60" r="55" fill="url(#community-glow)" />

      {/* Web — 4 radial spokes + 3 concentric rings, all stroked thin */}
      <g stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.35" fill="none">
        <line x1="60" y1="10" x2="60" y2="110" />
        <line x1="10" y1="60" x2="110" y2="60" />
        <line x1="25" y1="25" x2="95" y2="95" />
        <line x1="25" y1="95" x2="95" y2="25" />
        <circle cx="60" cy="60" r="44" />
        <circle cx="60" cy="60" r="30" />
        <circle cx="60" cy="60" r="18" />
      </g>

      {/* Rainbow accent ring */}
      <circle
        cx="60"
        cy="60"
        r="22"
        fill="none"
        stroke="url(#community-rainbow)"
        strokeWidth="2"
        strokeOpacity="0.7"
      />

      {/* Spider body — soft blob */}
      <ellipse cx="60" cy="64" rx="14" ry="16" fill="url(#community-body)" />
      <circle cx="60" cy="48" r="9" fill="url(#community-body)" />

      {/* Legs — 8 thin curved strokes */}
      <g stroke="#6366f1" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M50 52 Q40 42 32 38" />
        <path d="M70 52 Q80 42 88 38" />
        <path d="M48 60 Q35 56 28 56" />
        <path d="M72 60 Q85 56 92 56" />
        <path d="M48 68 Q35 72 30 76" />
        <path d="M72 68 Q85 72 90 76" />
        <path d="M52 76 Q45 86 40 92" />
        <path d="M68 76 Q75 86 80 92" />
      </g>

      {/* Eyes */}
      <circle cx="56" cy="46" r="1.6" fill="#fff" />
      <circle cx="64" cy="46" r="1.6" fill="#fff" />
      <circle cx="56" cy="46" r="0.7" fill="#0f172a" />
      <circle cx="64" cy="46" r="0.7" fill="#0f172a" />
    </motion.svg>
  );
}
