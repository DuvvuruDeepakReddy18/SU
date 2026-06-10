import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const domains = await this.prisma.practiceDomain.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { problems: true } } },
    });
    // Only surface domains that actually have problems. The practice engine
    // grades code (Python/JS/C/C++/Java + algorithms/math), so domains that
    // need a different evaluator (SQL, Regex, React, Ruby, …) stay hidden
    // until they have real, solvable content rather than showing empty cards.
    return domains
      .filter((d) => d._count.problems > 0)
      .map((d) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        icon: d.icon,
        problemCount: d._count.problems,
      }));
  }

  async getBySlug(slug: string, page = 1, pageSize = 30) {
    const domain = await this.prisma.practiceDomain.findUnique({
      where: { slug },
      include: {
        problems: {
          orderBy: { title: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            topics: true,
            points: true,
          },
        },
        _count: { select: { problems: true } },
      },
    });
    if (!domain) throw new NotFoundException('Domain not found');
    return {
      slug: domain.slug,
      name: domain.name,
      icon: domain.icon,
      total: domain._count.problems,
      page,
      pageSize,
      problems: domain.problems,
    };
  }
}
