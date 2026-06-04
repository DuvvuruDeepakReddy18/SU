import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CertificationTier } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
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
    private readonly storage: StorageService,
  ) {}

  async addAcademic(userId: string, dto: AcademicRecordCreateDto) {
    const isVerified = dto.verifiedVia !== 'manual';
    const record = await this.prisma.academicRecord.create({
      data: {
        userId,
        semester: dto.semester,
        cgpa: dto.cgpa,
        sgpa: dto.sgpa ?? null,
        docUrl: dto.docUrl ?? null,
        verifiedVia: dto.verifiedVia,
        // Institution and DigiLocker sources land verified; manual stays pending
        // until the user backs it with an OCR'd semester marksheet.
        verifiedAt: isVerified ? new Date() : null,
        verificationStatus: isVerified ? 'verified' : 'pending',
      },
    });
    // Only update the master CGPA if this record is itself verified — manual
    // entries must not poison the displayed CGPA.
    if (isVerified) {
      await this.prisma.studentProfile.update({
        where: { userId },
        data: { cgpa: dto.cgpa, cgpaVerifiedAt: new Date() },
      });
    }
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
    // Sign the owner's own marksheet URLs too so the persistent S3 URL
    // never crosses the API boundary.
    const academicSigned = await Promise.all(
      academic.map(async (r) => ({
        ...r,
        docUrl: await this.storage.signedDownloadFor(r.docUrl),
      })),
    );
    return { skills, certs, academic: academicSigned, projects };
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

  /**
   * Per-field verification snapshot. Drives the UNVERIFIED / VERIFIED chips
   * on the dashboard, profile page, and public portfolio.
   */
  async myStatus(userId: string) {
    const [profile, verifiedRecords, skills] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { userId },
        select: {
          collegeIdStatus: true,
          collegeIdVerifiedAt: true,
          cgpa: true,
          cgpaVerifiedAt: true,
        },
      }),
      this.prisma.academicRecord.count({
        where: { userId, verificationStatus: 'verified' },
      }),
      this.prisma.userSkill.findMany({
        where: { userId },
        select: { highestVerificationLayer: true },
      }),
    ]);

    const collegeId =
      profile?.collegeIdStatus === 'verified' || !!profile?.collegeIdVerifiedAt
        ? 'verified'
        : profile?.collegeIdStatus === 'rejected'
          ? 'rejected'
          : profile?.collegeIdStatus === 'pending_review'
            ? 'pending'
            : 'unverified';

    const cgpa = profile?.cgpaVerifiedAt ? 'verified' : 'unverified';
    const skillsVerified = skills.filter(
      (s) => s.highestVerificationLayer !== 'L0_UNVERIFIED',
    ).length;

    // Overall: verified only if college ID AND cgpa AND at least one skill verified
    const overall =
      collegeId === 'verified' && cgpa === 'verified' && skillsVerified > 0
        ? 'verified'
        : collegeId === 'verified' || cgpa === 'verified' || skillsVerified > 0
          ? 'partial'
          : 'unverified';

    return {
      overall,
      fields: {
        collegeId,
        cgpa,
        academicRecords: { verified: verifiedRecords },
        skills: { verified: skillsVerified, total: skills.length },
      },
    };
  }

  /**
   * Returns the student's position in the college-ID review queue (1 = next
   * up), plus the total queue length, for the SLA messaging on the dashboard.
   *
   * Returns `position: null` when the student doesn't have a pending review
   * (already verified, rejected, or never uploaded).
   */
  async myCollegeIdQueuePosition(userId: string) {
    const me = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { collegeIdStatus: true, collegeIdUploadedAt: true },
    });
    if (me?.collegeIdStatus !== 'pending_review' || !me.collegeIdUploadedAt) {
      return { position: null, queueLength: 0 };
    }
    const [ahead, queueLength] = await Promise.all([
      this.prisma.studentProfile.count({
        where: {
          collegeIdStatus: 'pending_review',
          collegeIdUploadedAt: { lt: me.collegeIdUploadedAt },
        },
      }),
      this.prisma.studentProfile.count({ where: { collegeIdStatus: 'pending_review' } }),
    ]);
    return { position: ahead + 1, queueLength };
  }
}
