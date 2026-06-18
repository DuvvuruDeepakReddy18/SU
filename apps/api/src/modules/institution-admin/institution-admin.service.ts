import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VerificationLayer } from '@prisma/client';
import type {
  RosterQueryInput,
  InstituteDriveInput,
  InstituteCompetitionInput,
  InstituteKnowledgeInput,
} from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';

const LAYER_ORDER: VerificationLayer[] = [
  'L0_UNVERIFIED',
  'L1_ACADEMIC',
  'L2_CERTIFIED',
  'L3_PROVEN',
  'L4_EXPERT',
];
function layerRank(l: VerificationLayer): number {
  return LAYER_ORDER.indexOf(l);
}

@Injectable()
export class InstitutionAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The signed-in TPO's own profile + institution + approval status. Drives the
   * institution-portal shell (pending screen vs full app).
   */
  async me(userId: string) {
    const profile = await this.prisma.institutionAdminProfile.findUnique({
      where: { userId },
      include: { institution: true, user: { select: { email: true } } },
    });
    if (!profile) throw new NotFoundException('Institution admin profile not found');
    return profile;
  }

  // ---------- Admin approval queue ----------

  adminListPending(limit = 50) {
    return this.prisma.institutionAdminProfile.findMany({
      where: { status: 'pending' },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { institution: true, user: { select: { email: true } } },
    });
  }

  async adminApprove(userId: string) {
    const before = await this.prisma.institutionAdminProfile.findUnique({
      where: { userId },
      select: { status: true, institutionId: true },
    });
    if (!before) throw new NotFoundException('Institution admin profile not found');
    const profile = await this.prisma.institutionAdminProfile.update({
      where: { userId },
      data: { status: 'approved', approvedAt: new Date(), rejectionReason: null },
      include: { institution: true, user: { select: { email: true } } },
    });
    return { before, profile };
  }

  async adminReject(userId: string, reason?: string | null) {
    const before = await this.prisma.institutionAdminProfile.findUnique({
      where: { userId },
      select: { status: true, institutionId: true },
    });
    if (!before) throw new NotFoundException('Institution admin profile not found');
    const profile = await this.prisma.institutionAdminProfile.update({
      where: { userId },
      data: { status: 'rejected', approvedAt: null, rejectionReason: reason ?? null },
      include: { institution: true, user: { select: { email: true } } },
    });
    return { before, profile };
  }

  // ---------- Roster + analytics (approved TPOs) ----------

  /** Resolve the TPO's institution; throws unless approved. */
  private async requireInstitution(userId: string): Promise<string> {
    const p = await this.prisma.institutionAdminProfile.findUnique({
      where: { userId },
      select: { status: true, institutionId: true },
    });
    if (!p) throw new ForbiddenException('Institution admin profile not found');
    if (p.status !== 'approved') {
      throw new ForbiddenException('Your institution account is pending approval.');
    }
    return p.institutionId;
  }

  /**
   * Paginated roster of this institution's students. Verification + academic
   * status is included; personal contact (phone / login email) is NOT — the
   * college already holds that via its own systems.
   */
  async roster(userId: string, input: RosterQueryInput) {
    const institutionId = await this.requireInstitution(userId);
    const { q, minLayer, idStatus, graduationYear, page, pageSize } = input;

    const userWhere: Prisma.UserWhereInput = { institutionId, deletedAt: null, role: 'STUDENT' };
    if (minLayer) {
      userWhere.userSkills = {
        some: {
          highestVerificationLayer: {
            in: LAYER_ORDER.slice(layerRank(minLayer as VerificationLayer)),
          },
        },
      };
    }

    const where: Prisma.StudentProfileWhereInput = {
      user: { is: userWhere },
      ...(graduationYear ? { graduationYear } : {}),
      ...(idStatus
        ? {
            collegeIdStatus:
              idStatus === 'none'
                ? null
                : idStatus === 'verified'
                  ? 'verified'
                  : idStatus === 'pending'
                    ? 'pending_review'
                    : 'rejected',
          }
        : {}),
      ...(q ? { fullName: { contains: q, mode: 'insensitive' } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { fullName: 'asc' },
        select: ROSTER_SELECT,
      }),
      this.prisma.studentProfile.count({ where }),
    ]);
    return { items: rows.map(toRosterRow), total, page, pageSize };
  }

  /** Aggregate analytics over the institution's students. */
  async analytics(userId: string) {
    const institutionId = await this.requireInstitution(userId);
    const studentWhere: Prisma.StudentProfileWhereInput = {
      user: { is: { institutionId, deletedAt: null, role: 'STUDENT' } },
    };

    const [total, idVerified, cgpaVerified, placed, skills] = await Promise.all([
      this.prisma.studentProfile.count({ where: studentWhere }),
      this.prisma.studentProfile.count({ where: { ...studentWhere, collegeIdStatus: 'verified' } }),
      this.prisma.studentProfile.count({
        where: { ...studentWhere, cgpaVerifiedAt: { not: null } },
      }),
      // "placed" = students with a hired application
      this.prisma.placementApplication.count({
        where: { status: 'hired', user: { institutionId, role: 'STUDENT' } },
      }),
      this.prisma.userSkill.groupBy({
        by: ['highestVerificationLayer'],
        where: { user: { institutionId, deletedAt: null, role: 'STUDENT' } },
        _count: { _all: true },
      }),
    ]);

    // Per-student top layer distribution (L0..L4): count students whose max
    // skill layer is each level. Simpler proxy: count distinct students having
    // at least one skill at each layer — we report the skill-level distribution.
    const layerCounts: Record<string, number> = {
      L0_UNVERIFIED: 0,
      L1_ACADEMIC: 0,
      L2_CERTIFIED: 0,
      L3_PROVEN: 0,
      L4_EXPERT: 0,
    };
    for (const g of skills) layerCounts[g.highestVerificationLayer] = g._count._all;

    return {
      totalStudents: total,
      idVerified,
      cgpaVerified,
      placed,
      idVerifiedPct: total ? Math.round((idVerified / total) * 100) : 0,
      cgpaVerifiedPct: total ? Math.round((cgpaVerified / total) * 100) : 0,
      skillLayerDistribution: layerCounts,
    };
  }

  // ---------- Institute drives ----------

  async createDrive(userId: string, dto: InstituteDriveInput) {
    const institutionId = await this.requireInstitution(userId);
    return this.prisma.placementDrive.create({
      data: {
        postedById: userId,
        company: dto.company,
        role: dto.role,
        description: dto.description ?? null,
        packageLpa: dto.packageLpa ?? null,
        minLevel: dto.minLevel ?? 'L0',
        jobType: dto.jobType ?? 'full_time',
        skills: dto.skills ?? [],
        location: dto.location ?? null,
        // Institute-scoped: only this institution's students see it.
        scope: 'institute_only',
        institutionId,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      },
    });
  }

  async listDrives(userId: string) {
    const institutionId = await this.requireInstitution(userId);
    return this.prisma.placementDrive.findMany({
      where: { institutionId, scope: 'institute_only' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  async deleteDrive(userId: string, driveId: string) {
    const institutionId = await this.requireInstitution(userId);
    const drive = await this.prisma.placementDrive.findUnique({ where: { id: driveId } });
    if (!drive || drive.institutionId !== institutionId)
      throw new NotFoundException('Drive not found');
    await this.prisma.placementDrive.delete({ where: { id: driveId } });
    return { ok: true };
  }

  // ---------- Institute competitions ----------

  async createCompetition(userId: string, dto: InstituteCompetitionInput) {
    const institutionId = await this.requireInstitution(userId);
    return this.prisma.competition.create({
      data: {
        title: dto.title,
        category: dto.category,
        description: dto.description,
        prizes: dto.prizes ?? null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        bannerUrl: dto.bannerUrl ?? null,
        postedById: userId,
        scope: 'institute_only',
        institutionId,
      },
    });
  }

  async listCompetitions(userId: string) {
    const institutionId = await this.requireInstitution(userId);
    return this.prisma.competition.findMany({
      where: { institutionId, scope: 'institute_only' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
  }

  async deleteCompetition(userId: string, competitionId: string) {
    const institutionId = await this.requireInstitution(userId);
    const comp = await this.prisma.competition.findUnique({ where: { id: competitionId } });
    if (!comp || comp.institutionId !== institutionId) {
      throw new NotFoundException('Competition not found');
    }
    await this.prisma.competition.delete({ where: { id: competitionId } });
    return { ok: true };
  }

  // ---------- Chatbot knowledge base (approved TPOs) ----------

  async listKnowledge(userId: string) {
    const institutionId = await this.requireInstitution(userId);
    return this.prisma.institutionKnowledge.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addKnowledge(userId: string, dto: InstituteKnowledgeInput) {
    const institutionId = await this.requireInstitution(userId);
    return this.prisma.institutionKnowledge.create({
      data: {
        institutionId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        source: dto.source?.trim() || 'tpo',
      },
    });
  }

  async deleteKnowledge(userId: string, id: string) {
    const institutionId = await this.requireInstitution(userId);
    const row = await this.prisma.institutionKnowledge.findUnique({ where: { id } });
    if (!row || row.institutionId !== institutionId) {
      throw new NotFoundException('Knowledge entry not found');
    }
    await this.prisma.institutionKnowledge.delete({ where: { id } });
    return { ok: true };
  }
}

// Roster projection — verification + academic status, NO personal contact.
// Exported so a unit test can assert it never grows to include PII.
export const ROSTER_SELECT = {
  userId: true,
  fullName: true,
  headline: true,
  avatarUrl: true,
  sharableSlug: true,
  graduationYear: true,
  courseProgram: true,
  cgpa: true,
  cgpaVerifiedAt: true,
  collegeIdStatus: true,
  user: {
    select: {
      userSkills: {
        where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' as VerificationLayer } },
        select: {
          highestVerificationLayer: true,
          skill: { select: { name: true } },
        },
        take: 8,
      },
    },
  },
} satisfies Prisma.StudentProfileSelect;

interface RosterRowInput {
  userId: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
  sharableSlug: string;
  graduationYear: number | null;
  courseProgram: string | null;
  cgpa: number | null;
  cgpaVerifiedAt: Date | null;
  collegeIdStatus: string | null;
  user: {
    userSkills: { highestVerificationLayer: VerificationLayer; skill: { name: string } }[];
  };
}

export function toRosterRow(p: RosterRowInput) {
  const skills = p.user.userSkills.map((s) => ({
    name: s.skill.name,
    layer: s.highestVerificationLayer,
  }));
  const topLayer = skills.reduce<VerificationLayer>(
    (best, s) => (layerRank(s.layer) > layerRank(best) ? s.layer : best),
    'L0_UNVERIFIED',
  );
  return {
    userId: p.userId,
    fullName: p.fullName,
    headline: p.headline,
    avatarUrl: p.avatarUrl,
    sharableSlug: p.sharableSlug,
    graduationYear: p.graduationYear,
    courseProgram: p.courseProgram,
    cgpa: p.cgpa,
    cgpaVerified: !!p.cgpaVerifiedAt,
    collegeIdStatus: p.collegeIdStatus,
    topLayer,
    skills,
  };
}
