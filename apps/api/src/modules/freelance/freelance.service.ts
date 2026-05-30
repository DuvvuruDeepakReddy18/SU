import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FreelanceService {
  constructor(private readonly prisma: PrismaService) {}

  list(category?: string, q?: string, sort: 'recent' | 'price_asc' | 'price_desc' = 'recent') {
    const orderBy: Record<string, 'asc' | 'desc'> =
      sort === 'price_asc'
        ? { priceFrom: 'asc' }
        : sort === 'price_desc'
          ? { priceFrom: 'desc' }
          : { createdAt: 'desc' };
    return this.prisma.freelanceService.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy,
      include: {
        provider: {
          include: {
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
      },
    });
  }

  async getById(id: string) {
    const svc = await this.prisma.freelanceService.findUnique({
      where: { id },
      include: {
        provider: {
          include: {
            studentProfile: {
              select: {
                fullName: true,
                avatarUrl: true,
                sharableSlug: true,
                headline: true,
                bio: true,
                location: true,
                githubUrl: true,
                linkedinUrl: true,
                portfolioUrl: true,
              },
            },
            institution: { select: { name: true } },
            userSkills: {
              include: { skill: true },
              where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' } },
              take: 8,
            },
          },
        },
      },
    });
    return svc;
  }

  create(
    userId: string,
    dto: {
      title: string;
      category: string;
      description: string;
      priceFrom?: number;
      priceUnit?: string;
      skills?: string[];
      location?: string;
      isRemote?: boolean;
    },
  ) {
    return this.prisma.freelanceService.create({
      data: {
        providerId: userId,
        title: dto.title,
        category: dto.category,
        description: dto.description,
        priceFrom: dto.priceFrom ?? null,
        priceUnit: dto.priceUnit ?? null,
        skills: dto.skills ?? [],
        location: dto.location ?? null,
        isRemote: dto.isRemote ?? true,
      },
    });
  }

  mine(userId: string) {
    return this.prisma.freelanceService.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  deactivate(userId: string, id: string) {
    return this.prisma.freelanceService.updateMany({
      where: { id, providerId: userId },
      data: { active: false },
    });
  }
}
