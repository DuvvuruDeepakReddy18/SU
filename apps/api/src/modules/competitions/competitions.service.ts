import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(category?: string) {
    return this.prisma.competition.findMany({
      where: category ? { category } : undefined,
      orderBy: { startsAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
  }

  create(
    userId: string,
    dto: {
      title: string;
      category: string;
      description: string;
      prizes?: string;
      startsAt: string;
      endsAt: string;
      bannerUrl?: string;
    },
  ) {
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
      },
    });
  }

  async enter(userId: string, competitionId: string, submissionUrl?: string) {
    const comp = await this.prisma.competition.findUnique({ where: { id: competitionId } });
    if (!comp) throw new NotFoundException();
    try {
      return await this.prisma.competitionEntry.create({
        data: { competitionId, userId, submissionUrl: submissionUrl ?? null },
      });
    } catch {
      throw new ForbiddenException('Already entered');
    }
  }
}
