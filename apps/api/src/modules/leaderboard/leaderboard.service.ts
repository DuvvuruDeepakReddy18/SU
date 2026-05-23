import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';

@Injectable()
export class LeaderboardService {
  private readonly log = new Logger(LeaderboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async rebuildAll() {
    this.log.log('Rebuilding leaderboards...');
    await this.prisma.leaderboardSnapshot.deleteMany({});

    const acceptedByUser = await this.prisma.submission.findMany({
      where: { verdict: 'AC' },
      select: { userId: true, problemId: true, problem: { select: { points: true } } },
      distinct: ['userId', 'problemId'],
    });
    const scores = new Map<string, number>();
    for (const s of acceptedByUser) {
      scores.set(s.userId, (scores.get(s.userId) ?? 0) + (s.problem?.points ?? 0));
    }
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < ranked.length; i++) {
      const [userId, score] = ranked[i];
      await this.prisma.leaderboardSnapshot.create({
        data: { userId, scope: 'global', score, rank: i + 1 },
      });
    }

    const institutions = await this.prisma.institution.findMany();
    for (const inst of institutions) {
      const members = await this.prisma.user.findMany({
        where: { institutionId: inst.id },
        select: { id: true },
      });
      const memberIds = new Set(members.map((m) => m.id));
      const local = ranked.filter(([uid]) => memberIds.has(uid));
      for (let i = 0; i < local.length; i++) {
        const [userId, score] = local[i];
        await this.prisma.leaderboardSnapshot.create({
          data: { userId, scope: `college:${inst.id}`, score, rank: i + 1 },
        });
      }
    }
    await this.redis.client.del('lb:cache');
  }

  async get(scope: string, page: number, pageSize: number) {
    const cacheKey = `lb:${scope}:${page}:${pageSize}`;
    const cached = await this.redis.client.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const items = await this.prisma.leaderboardSnapshot.findMany({
      where: { scope },
      orderBy: { rank: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const userIds = items.map((i) => i.userId);
    const profiles = await this.prisma.studentProfile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, fullName: true, avatarUrl: true, sharableSlug: true },
    });
    const byUser = new Map(profiles.map((p) => [p.userId, p]));
    const result = {
      scope,
      items: items.map((i) => ({
        rank: i.rank,
        score: i.score,
        userId: i.userId,
        profile: byUser.get(i.userId) ?? null,
      })),
    };
    await this.redis.client.set(cacheKey, JSON.stringify(result), 'EX', 60);
    return result;
  }
}
