import { Injectable } from '@nestjs/common';
import { VerificationLayer } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Layer transition rules:
 *   L1_ACADEMIC : user has >=1 verified AcademicRecord (any subject)
 *   L2_CERTIFIED: L1 met AND >=1 verified Certification linked to this skill
 *   L3_PROVEN   : L2 met AND >=1 Project that lists this skill in linkedSkills and has a repo URL
 *   L4_EXPERT   : awarded only by completing an Expert Screening (stubbed in Phase 1)
 */
@Injectable()
export class LayerEngine {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeForUserSkill(userSkillId: string) {
    const us = await this.prisma.userSkill.findUnique({
      where: { id: userSkillId },
      include: { skill: true },
    });
    if (!us) return null;
    const layer = await this.computeLayer(us.userId, us.skillId);
    if (layer !== us.highestVerificationLayer) {
      await this.prisma.userSkill.update({
        where: { id: us.id },
        data: { highestVerificationLayer: layer },
      });
    }
    return layer;
  }

  async recomputeAllForUser(userId: string) {
    const skills = await this.prisma.userSkill.findMany({ where: { userId } });
    const results: { userSkillId: string; layer: VerificationLayer }[] = [];
    for (const us of skills) {
      const layer = await this.computeLayer(userId, us.skillId);
      if (layer !== us.highestVerificationLayer) {
        await this.prisma.userSkill.update({
          where: { id: us.id },
          data: { highestVerificationLayer: layer },
        });
      }
      results.push({ userSkillId: us.id, layer });
    }
    return results;
  }

  private async computeLayer(userId: string, skillId: string): Promise<VerificationLayer> {
    // Only counts records that passed the OCR+anti-tamper check (or were
    // manually approved by an admin). Free-text uploads that haven't been
    // OCR'd/reviewed stay at L0 — that's the whole point of L1.
    const academicCount = await this.prisma.academicRecord.count({
      where: { userId, verificationStatus: 'verified' },
    });
    if (academicCount === 0) return VerificationLayer.L0_UNVERIFIED;

    const certCount = await this.prisma.certification.count({
      where: { userId, skillId, verificationStatus: 'verified' },
    });
    if (certCount === 0) return VerificationLayer.L1_ACADEMIC;

    const projectCount = await this.prisma.project.count({
      where: {
        userId,
        repoUrl: { not: null },
        linkedSkills: { has: skillId },
      },
    });
    if (projectCount === 0) return VerificationLayer.L2_CERTIFIED;

    return VerificationLayer.L3_PROVEN;
    // L4 is set explicitly by the Expert Screening module (not in Phase 1).
  }
}
