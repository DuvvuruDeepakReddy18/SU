// How an L4 badge was earned. Mirrors the Prisma enum L4VerificationMethod.
export const L4_VERIFICATION_METHODS = ['AI_VERIFIED', 'EXPERT_VERIFIED'] as const;
export type L4VerificationMethod = (typeof L4_VERIFICATION_METHODS)[number];

const LAYER_LABELS: Record<string, string> = {
  L0_UNVERIFIED: 'L0 Unverified',
  L1_ACADEMIC: 'L1 Academic',
  L2_CERTIFIED: 'L2 Certified',
  L3_PROVEN: 'L3 Proven',
  L4_EXPERT: 'L4 Expert',
};

/**
 * Display label for a verification layer. For an L4 badge it appends how the
 * skill was verified — "AI-Verified" vs "Expert-Verified" — when that's known,
 * so recruiters can calibrate trust per skill. Below L4, l4Method is ignored.
 */
export function verificationLayerLabel(
  layer?: string | null,
  l4Method?: L4VerificationMethod | string | null,
): string {
  const base = LAYER_LABELS[layer ?? ''] ?? (layer ?? '').replace(/_/g, ' ');
  if (layer === 'L4_EXPERT') {
    if (l4Method === 'AI_VERIFIED') return 'L4 Expert · AI-Verified';
    if (l4Method === 'EXPERT_VERIFIED') return 'L4 Expert · Expert-Verified';
  }
  return base;
}
