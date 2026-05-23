import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CertificationTier } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LayerEngine } from './layer-engine';
import type {
  AcademicRecordCreateDto,
  CertificationCreateDto,
  ProjectCreateDto,
  ProjectLinkSkillsDto,
} from './dto';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: LayerEngine,
  ) {}

  async addAcademic(userId: string, dto: AcademicRecordCreateDto) {
    const record = await this.prisma.academicRecord.create({
      data: {
        userId,
        semester: dto.semester,
        cgpa: dto.cgpa,
        sgpa: dto.sgpa ?? null,
        docUrl: dto.docUrl ?? null,
        verifiedVia: dto.verifiedVia,
        // For Phase 1, institution and manual uploads land verified.
        // DigiLocker integration will gate this with a real verification call later.
        verifiedAt: dto.verifiedVia === 'manual' ? null : new Date(),
      },
    });
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { cgpa: dto.cgpa },
    });
    await this.engine.recomputeAllForUser(userId);
    return record;
  }

  async addCertification(userId: string, dto: CertificationCreateDto) {
    // Look up tier rule by (issuer, courseName). Hit => verified. Miss => UNRANKED + pending.
    const rule = await this.prisma.certificationTierRule.findUnique({
      where: { issuer_courseName: { issuer: dto.issuer, courseName: dto.courseName } },
    });

    const cert = await this.prisma.certification.create({
      data: {
        userId,
        issuer: dto.issuer,
        courseName: dto.courseName,
        skillId: dto.skillId ?? rule?.skillId ?? null,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        certificateUrl: dto.certificateUrl ?? null,
        verificationUrl: dto.verificationUrl ?? null,
        tier: rule ? rule.tier : CertificationTier.UNRANKED,
        verificationStatus: rule ? 'verified' : 'pending',
      },
    });

    if (cert.skillId) {
      const us = await this.prisma.userSkill.findUnique({
        where: { userId_skillId: { userId, skillId: cert.skillId } },
      });
      if (us) await this.engine.recomputeForUserSkill(us.id);
    }
    return cert;
  }

  async listMineSummary(userId: string) {
    const [skills, certs, academic, projects] = await Promise.all([
      this.prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      this.prisma.certification.findMany({ where: { userId } }),
      this.prisma.academicRecord.findMany({ where: { userId } }),
      this.prisma.project.findMany({ where: { userId } }),
    ]);
    return { skills, certs, academic, projects };
  }

  async createProject(userId: string, dto: ProjectCreateDto) {
    const project = await this.prisma.project.create({
      data: {
        userId,
        source: 'manual',
        title: dto.title,
        description: dto.description ?? null,
        repoUrl: dto.repoUrl ?? null,
        liveUrl: dto.liveUrl ?? null,
        techStack: dto.techStack,
        linkedSkills: dto.linkedSkills,
      },
    });
    if (dto.linkedSkills.length > 0) {
      await this.engine.recomputeAllForUser(userId);
    }
    return project;
  }

  async linkProjectSkills(userId: string, projectId: string, dto: ProjectLinkSkillsDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { linkedSkills: dto.skillIds },
    });
    await this.engine.recomputeAllForUser(userId);
    return updated;
  }

  expertScreening() {
    // L4 is stubbed in Phase 1; a waitlist endpoint exists in the controller.
    return {
      status: 'coming_soon',
      message: 'Expert screening (L4) launches in Phase 2. You can join the waitlist.',
    };
  }
}
