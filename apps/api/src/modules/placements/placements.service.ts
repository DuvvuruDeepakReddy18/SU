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

@Injectable()
export class PlacementsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: { jobType?: string; institutionId: string | null }) {
    const where: Prisma.PlacementDriveWhereInput = {
      ...(opts.jobType ? { jobType: opts.jobType } : {}),
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

    // Gate by user's highest verification layer.
    const maxLayer = await this.userHighestLayer(userId);
    if (LAYER_RANK[maxLayer] < LAYER_RANK[drive.minLevel]) {
      throw new ForbiddenException(
        `This drive requires ${drive.minLevel}. Your current highest layer is ${maxLayer}.`,
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
