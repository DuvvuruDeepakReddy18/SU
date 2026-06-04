import { describe, it, expect, vi } from 'vitest';
import { LayerEngine } from './layer-engine';
import { VerificationLayer } from '@prisma/client';

function mockPrisma(stub: {
  academic?: number;
  cert?: number;
  project?: number;
  currentLayer?: VerificationLayer;
}) {
  return {
    userSkill: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'us_1',
        userId: 'u_1',
        skillId: 's_1',
        highestVerificationLayer: stub.currentLayer ?? VerificationLayer.L0_UNVERIFIED,
        skill: { id: 's_1' },
      }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    academicRecord: { count: vi.fn().mockResolvedValue(stub.academic ?? 0) },
    certification: { count: vi.fn().mockResolvedValue(stub.cert ?? 0) },
    project: { count: vi.fn().mockResolvedValue(stub.project ?? 0) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('LayerEngine', () => {
  it('returns L0 when no verified academic record', async () => {
    const engine = new LayerEngine(mockPrisma({ academic: 0 }));
    expect(await engine.recomputeForUserSkill('us_1')).toBe(VerificationLayer.L0_UNVERIFIED);
  });

  it('promotes to L1 with academic but no cert', async () => {
    const engine = new LayerEngine(mockPrisma({ academic: 1, cert: 0 }));
    expect(await engine.recomputeForUserSkill('us_1')).toBe(VerificationLayer.L1_ACADEMIC);
  });

  it('promotes to L2 with academic + cert', async () => {
    const engine = new LayerEngine(mockPrisma({ academic: 1, cert: 1, project: 0 }));
    expect(await engine.recomputeForUserSkill('us_1')).toBe(VerificationLayer.L2_CERTIFIED);
  });

  it('promotes to L3 with academic + cert + project', async () => {
    const engine = new LayerEngine(mockPrisma({ academic: 1, cert: 1, project: 1 }));
    expect(await engine.recomputeForUserSkill('us_1')).toBe(VerificationLayer.L3_PROVEN);
  });

  it('never downgrades an interview-granted L4 (L4 floor)', async () => {
    // A skill already at L4 (awarded by passing an expert interview) must NOT
    // be recomputed back down even when the evidence would compute to L0.
    const prisma = mockPrisma({ academic: 0, currentLayer: VerificationLayer.L4_EXPERT });
    const engine = new LayerEngine(prisma);
    expect(await engine.recomputeForUserSkill('us_1')).toBe(VerificationLayer.L4_EXPERT);
    // And it must not have written a downgrade.
    expect(prisma.userSkill.update).not.toHaveBeenCalled();
  });
});
