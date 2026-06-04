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

  /**
   * On-demand per-skill leaderboard. Ranks users by their highest verification
   * layer in that skill (L4 > L3 > L2 > L1), then by total AC points as a
   * tiebreaker. Optionally scoped to a single institution.
   *
   * Not cached because the surface is much wider than global / college
   * (a skill picker per institution = O(skills × institutions) entries).
   */
  async getSkill(skillId: string, institutionId: string | null, limit = 30) {
    const LAYER_RANK: Record<string, number> = {
      L4_EXPERT: 4,
      L3_PROVEN: 3,
      L2_CERTIFIED: 2,
      L1_ACADEMIC: 1,
      L0_UNVERIFIED: 0,
    };

    const userSkills = await this.prisma.userSkill.findMany({
      where: {
        skillId,
        ...(institutionId ? { user: { institutionId } } : {}),
        highestVerificationLayer: { not: 'L0_UNVERIFIED' },
      },
      include: {
        skill: { select: { name: true } },
        user: {
          select: {
            id: true,
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
            institution: { select: { name: true, shortName: true } },
          },
        },
      },
      take: 500,
    });

    if (userSkills.length === 0) {
      return { scope: 'skill', skillId, items: [], skillName: null };
    }

    // Practice score per user — used as the tiebreaker.
    const userIds = userSkills.map((us) => us.user.id);
    const subs = await this.prisma.submission.findMany({
      where: { userId: { in: userIds }, verdict: 'AC' },
      select: { userId: true, problem: { select: { points: true } } },
      distinct: ['userId', 'problemId'],
    });
    const points = new Map<string, number>();
    for (const s of subs) {
      points.set(s.userId, (points.get(s.userId) ?? 0) + (s.problem?.points ?? 0));
    }

    const ranked = userSkills
      .map((us) => ({
        userId: us.user.id,
        layer: us.highestVerificationLayer,
        layerScore: LAYER_RANK[us.highestVerificationLayer] ?? 0,
        practicePoints: points.get(us.user.id) ?? 0,
        profile: us.user.studentProfile,
        institution: us.user.institution?.shortName ?? us.user.institution?.name ?? null,
      }))
      .sort((a, b) => {
        if (b.layerScore !== a.layerScore) return b.layerScore - a.layerScore;
        return b.practicePoints - a.practicePoints;
      })
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.userId,
        layer: u.layer,
        score: u.practicePoints,
        institution: u.institution,
        profile: u.profile,
      }));

    return { scope: 'skill', skillId, skillName: userSkills[0].skill.name, items: ranked };
  }
}
