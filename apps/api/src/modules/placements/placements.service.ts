import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { VerificationLayer, type Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

const LAYER_RANK: Record<string, number> = {
  L0_UNVERIFIED: 0,
  L1_ACADEMIC: 1,
  L2_CERTIFIED: 2,
  L3_PROVEN: 3,
  L4_EXPERT: 4,
};

// Platform rule: applying to any job requires at least L3 (Proven). A drive
// may set a higher bar (e.g. L4), but never a lower one.
const APPLY_FLOOR_RANK = LAYER_RANK.L3_PROVEN;

@Injectable()
export class PlacementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { jobType?: string; excludeJobType?: string; institutionId: string | null }) {
    // A specific jobType wins; otherwise optionally exclude one type (used to
    // split internships out of the main placements board).
    const jobTypeFilter = opts.jobType
      ? { jobType: opts.jobType }
      : opts.excludeJobType
        ? { jobType: { not: opts.excludeJobType } }
        : {};
    const where: Prisma.PlacementDriveWhereInput = {
      ...jobTypeFilter,
      OR: [
        { scope: 'public' },
        ...(opts.institutionId
          ? [{ scope: 'institute_only' as const, institutionId: opts.institutionId }]
          : []),
      ],
    };
    return this.prisma.placementDrive.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  async create(
    userId: string,
    dto: {
      company: string;
      role: string;
      description?: string;
      packageLpa?: number;
      minLevel?: string;
      jobType?: string;
      skills?: string[];
      location?: string;
      scope?: 'institute_only' | 'public';
      closesAt?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.prisma.placementDrive.create({
      data: {
        postedById: userId,
        company: dto.company,
        role: dto.role,
        description: dto.description ?? null,
        packageLpa: dto.packageLpa ?? null,
        minLevel: dto.minLevel ?? 'L0_UNVERIFIED',
        jobType: dto.jobType ?? 'full_time',
        skills: dto.skills ?? [],
        location: dto.location ?? null,
        scope: dto.scope ?? 'institute_only',
        institutionId: user?.institutionId ?? null,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      },
    });
  }

  async apply(userId: string, driveId: string) {
    const drive = await this.prisma.placementDrive.findUnique({ where: { id: driveId } });
    if (!drive) throw new NotFoundException();

    // Gate by the user's highest verification layer. The required layer is the
    // higher of the drive's own minLevel and the platform-wide L3 floor.
    const maxLayer = await this.userHighestLayer(userId);
    const requiredRank = Math.max(LAYER_RANK[drive.minLevel] ?? 0, APPLY_FLOOR_RANK);
    if ((LAYER_RANK[maxLayer] ?? 0) < requiredRank) {
      const requiredLabel = requiredRank > APPLY_FLOOR_RANK ? drive.minLevel : 'L3 (Proven)';
      throw new ForbiddenException(
        `Applying requires at least ${requiredLabel}. Your highest verified layer is ${maxLayer}. ` +
          `Earn L3 by shipping projects or solving practice problems.`,
      );
    }

    try {
      return await this.prisma.placementApplication.create({
        data: { driveId, userId, status: 'applied' },
      });
    } catch {
      throw new ForbiddenException('You have already applied to this drive.');
    }
  }

  async myApplications(userId: string) {
    return this.prisma.placementApplication.findMany({
      where: { userId },
      include: { drive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async userHighestLayer(userId: string): Promise<string> {
    const skills = await this.prisma.userSkill.findMany({
      where: { userId },
      select: { highestVerificationLayer: true },
    });
    if (skills.length === 0) return VerificationLayer.L0_UNVERIFIED;
    return skills.reduce(
      (max, s) =>
        (LAYER_RANK[s.highestVerificationLayer] ?? 0) > (LAYER_RANK[max] ?? 0)
          ? s.highestVerificationLayer
          : max,
      VerificationLayer.L0_UNVERIFIED as string,
    );
  }
}
