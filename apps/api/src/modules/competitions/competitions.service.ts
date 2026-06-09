import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { instituteScopeAllows } from '../../common/institute-scope';
import { rankEntries, type EntryScores } from './competition-ranking';

type Actor = { sub: string; role: string };

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(category?: string, institutionId?: string | null) {
    return this.prisma.competition.findMany({
      where: {
        ...(category ? { category } : {}),
        // Public competitions to everyone; institute-only ones only to that
        // institution's students.
        OR: [
          { scope: 'public' },
          ...(institutionId ? [{ scope: 'institute_only' as const, institutionId }] : []),
        ],
      },
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

    // Scope gate: an institute-only competition is open only to that
    // institution's students. Block direct-by-ID entries, not just the list.
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { institutionId: true },
    });
    if (!instituteScopeAllows(comp.scope, comp.institutionId, me?.institutionId ?? null)) {
      throw new NotFoundException(); // don't reveal the competition exists
    }

    try {
      return await this.prisma.competitionEntry.create({
        data: { competitionId, userId, submissionUrl: submissionUrl ?? null },
      });
    } catch {
      throw new ForbiddenException('Already entered');
    }
  }

  // ---------- Multi-round jury scoring ----------

  /** The organiser (poster) or a platform admin may manage rounds/judges. */
  private async assertManager(actor: Actor, competitionId: string) {
    const comp = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true, postedById: true },
    });
    if (!comp) throw new NotFoundException('Competition not found');
    if (comp.postedById !== actor.sub && actor.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only the organiser can manage this competition.');
    }
    return comp;
  }

  /** A judge on the panel (or the manager) may score. */
  private async assertJudge(actor: Actor, competitionId: string) {
    const comp = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      select: { postedById: true },
    });
    if (!comp) throw new NotFoundException('Competition not found');
    if (comp.postedById === actor.sub || actor.role === 'PLATFORM_ADMIN') return;
    const onPanel = await this.prisma.competitionJudge.findUnique({
      where: { competitionId_userId: { competitionId, userId: actor.sub } },
      select: { id: true },
    });
    if (!onPanel) throw new ForbiddenException('You are not a judge for this competition.');
  }

  async addRound(
    actor: Actor,
    competitionId: string,
    dto: { name: string; advanceCount?: number },
  ) {
    await this.assertManager(actor, competitionId);
    const last = await this.prisma.competitionRound.findFirst({
      where: { competitionId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    // The organiser is always on their own jury panel.
    await this.prisma.competitionJudge.upsert({
      where: { competitionId_userId: { competitionId, userId: actor.sub } },
      update: {},
      create: { competitionId, userId: actor.sub },
    });
    return this.prisma.competitionRound.create({
      data: {
        competitionId,
        name: dto.name,
        sequence: (last?.sequence ?? 0) + 1,
        advanceCount: dto.advanceCount ?? null,
      },
    });
  }

  async setRoundStatus(actor: Actor, roundId: string, status: string) {
    const round = await this.prisma.competitionRound.findUnique({
      where: { id: roundId },
      select: { competitionId: true },
    });
    if (!round) throw new NotFoundException('Round not found');
    await this.assertManager(actor, round.competitionId);
    return this.prisma.competitionRound.update({ where: { id: roundId }, data: { status } });
  }

  async addJudge(actor: Actor, competitionId: string, judgeUserId: string) {
    await this.assertManager(actor, competitionId);
    const user = await this.prisma.user.findUnique({
      where: { id: judgeUserId },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('No such user.');
    return this.prisma.competitionJudge.upsert({
      where: { competitionId_userId: { competitionId, userId: judgeUserId } },
      update: {},
      create: { competitionId, userId: judgeUserId },
    });
  }

  async listJudges(competitionId: string) {
    const rows = await this.prisma.competitionJudge.findMany({
      where: { competitionId },
      include: {
        user: { select: { id: true, studentProfile: { select: { fullName: true } } } },
      },
    });
    return rows.map((r) => ({
      userId: r.userId,
      name: r.user.studentProfile?.fullName ?? 'Judge',
    }));
  }

  async removeJudge(actor: Actor, competitionId: string, judgeUserId: string) {
    const comp = await this.assertManager(actor, competitionId);
    if (comp.postedById === judgeUserId) {
      throw new BadRequestException('The organiser cannot be removed from the panel.');
    }
    await this.prisma.competitionJudge.deleteMany({
      where: { competitionId, userId: judgeUserId },
    });
    return { ok: true };
  }

  async scoreEntry(
    actor: Actor,
    roundId: string,
    dto: { entryId: string; score: number; feedback?: string },
  ) {
    const round = await this.prisma.competitionRound.findUnique({
      where: { id: roundId },
      select: { competitionId: true, status: true },
    });
    if (!round) throw new NotFoundException('Round not found');
    await this.assertJudge(actor, round.competitionId);
    if (round.status === 'closed') {
      throw new BadRequestException('This round is closed to scoring.');
    }
    const entry = await this.prisma.competitionEntry.findUnique({
      where: { id: dto.entryId },
      select: { competitionId: true },
    });
    if (!entry || entry.competitionId !== round.competitionId) {
      throw new BadRequestException('That entry is not part of this competition.');
    }
    return this.prisma.roundScore.upsert({
      where: {
        roundId_entryId_judgeId: { roundId, entryId: dto.entryId, judgeId: actor.sub },
      },
      update: { score: dto.score, feedback: dto.feedback ?? null },
      create: {
        roundId,
        entryId: dto.entryId,
        judgeId: actor.sub,
        score: dto.score,
        feedback: dto.feedback ?? null,
      },
    });
  }

  /** Rounds with their leaderboards (entry avg jury score + advancement). */
  async rounds(competitionId: string) {
    const [rounds, entries] = await Promise.all([
      this.prisma.competitionRound.findMany({
        where: { competitionId },
        orderBy: { sequence: 'asc' },
        include: { scores: { select: { entryId: true, score: true } } },
      }),
      this.prisma.competitionEntry.findMany({
        where: { competitionId },
        select: {
          id: true,
          user: { select: { studentProfile: { select: { fullName: true } } } },
        },
      }),
    ]);
    const nameByEntry = new Map(
      entries.map((e) => [e.id, e.user.studentProfile?.fullName ?? 'Entrant']),
    );

    return rounds.map((r) => {
      const byEntry = new Map<string, number[]>();
      for (const s of r.scores) {
        if (!byEntry.has(s.entryId)) byEntry.set(s.entryId, []);
        byEntry.get(s.entryId)!.push(s.score);
      }
      const entryScores: EntryScores[] = entries.map((e) => ({
        entryId: e.id,
        name: nameByEntry.get(e.id)!,
        scores: byEntry.get(e.id) ?? [],
      }));
      return {
        id: r.id,
        name: r.name,
        sequence: r.sequence,
        status: r.status,
        advanceCount: r.advanceCount,
        leaderboard: rankEntries(entryScores, r.advanceCount),
      };
    });
  }
}
