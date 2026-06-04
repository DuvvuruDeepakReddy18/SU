import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { VerificationLayer } from '@prisma/client';
import type { InviteInterviewerInput, ScoreInterviewInput } from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EmailService } from '../../infra/email/email.service';
import { LayerEngine } from '../verifications/layer-engine';

@Injectable()
export class InterviewerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly layers: LayerEngine,
  ) {}

  // ---------- Admin: invite / list ----------

  /**
   * Provision an interviewer (admin-only). Creates an INTERVIEWER user + an
   * active InterviewerProfile and emails them a temporary password. Returns
   * the temp password to the admin too (so they can share it out-of-band if
   * email isn't configured).
   */
  async adminInvite(input: InviteInterviewerInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('A user with this email already exists.');

    const tempPassword = randomBytes(9).toString('base64url'); // ~12 chars
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: input.email, passwordHash, role: 'INTERVIEWER' },
      });
      await tx.interviewerProfile.create({
        data: {
          userId: u.id,
          fullName: input.fullName,
          bio: input.bio ?? null,
          expertise: input.expertise ?? [],
          active: true,
        },
      });
      return u;
    });

    void this.email.sendInterviewerInvited(input.email, input.fullName, tempPassword);
    return { userId: user.id, email: input.email, tempPassword };
  }

  async adminList() {
    const rows = await this.prisma.interviewerProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });
    // Attach per-interviewer counts.
    const withCounts = await Promise.all(
      rows.map(async (r) => {
        const [claimed, passed] = await Promise.all([
          this.prisma.interviewBooking.count({ where: { interviewerId: r.userId } }),
          this.prisma.interviewBooking.count({
            where: { interviewerId: r.userId, status: 'passed' },
          }),
        ]);
        return { ...r, claimed, passed };
      }),
    );
    return withCounts;
  }

  async adminSetActive(userId: string, active: boolean) {
    const p = await this.prisma.interviewerProfile.findUnique({ where: { userId } });
    if (!p) throw new NotFoundException('Interviewer not found');
    return this.prisma.interviewerProfile.update({ where: { userId }, data: { active } });
  }

  // ---------- Interviewer self ----------

  async me(userId: string) {
    const profile = await this.prisma.interviewerProfile.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
    if (!profile) throw new NotFoundException('Interviewer profile not found');
    return profile;
  }

  private async requireActive(userId: string) {
    const p = await this.prisma.interviewerProfile.findUnique({
      where: { userId },
      select: { active: true },
    });
    if (!p) throw new ForbiddenException('Interviewer profile not found');
    if (!p.active) throw new ForbiddenException('Your interviewer account is inactive.');
  }

  // ---------- Shared pool ----------

  /** Open bookings nobody has claimed yet. */
  async openPool(userId: string) {
    await this.requireActive(userId);
    const rows = await this.prisma.interviewBooking.findMany({
      where: { interviewerId: null, status: 'scheduled' },
      orderBy: { scheduledAt: 'asc' },
      take: 100,
      select: bookingSelect,
    });
    return this.withSkillNames(rows);
  }

  /** Resolve skillId → skill name in one batch, then build cards. */
  private async withSkillNames(rows: BookingRow[]) {
    const ids = [...new Set(rows.map((r) => r.skillId).filter(Boolean))] as string[];
    const skills = ids.length
      ? await this.prisma.skillCatalog.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(skills.map((s) => [s.id, s.name]));
    return rows.map((r) => toBookingCard(r, r.skillId ? (nameById.get(r.skillId) ?? null) : null));
  }

  /** Claim an open booking from the pool (first-come; guarded against races). */
  async claim(userId: string, bookingId: string) {
    await this.requireActive(userId);
    // Conditional update: only succeeds if still unclaimed.
    const result = await this.prisma.interviewBooking.updateMany({
      where: { id: bookingId, interviewerId: null, status: 'scheduled' },
      data: { interviewerId: userId },
    });
    if (result.count === 0) {
      throw new BadRequestException('This interview was already claimed or is no longer open.');
    }
    return { ok: true };
  }

  /** Interviews this interviewer has claimed. */
  async myInterviews(userId: string) {
    await this.requireActive(userId);
    const rows = await this.prisma.interviewBooking.findMany({
      where: { interviewerId: userId },
      orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
      select: bookingSelect,
    });
    return this.withSkillNames(rows);
  }

  /**
   * Score a claimed interview. On a pass we promote the booked skill to
   * L4_EXPERT (the only way L4 is ever awarded) and stamp the result.
   */
  async score(userId: string, bookingId: string, input: ScoreInterviewInput) {
    await this.requireActive(userId);
    const booking = await this.prisma.interviewBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.interviewerId !== userId) {
      throw new NotFoundException('Interview not found in your queue.');
    }
    if (booking.status === 'passed' || booking.status === 'failed') {
      throw new BadRequestException('This interview has already been scored.');
    }

    const pass = input.verdict === 'pass';
    const updated = await this.prisma.interviewBooking.update({
      where: { id: bookingId },
      data: {
        status: pass ? 'passed' : 'failed',
        result: pass ? 'L4_VERIFIED' : 'FEEDBACK_ONLY',
        score: input.score ?? null,
        panelNotes: input.notes ?? null,
      },
    });

    if (pass && booking.skillId) {
      await this.awardL4(booking.userId, booking.skillId);
    }
    return updated;
  }

  /** Promote (or create) the student's UserSkill for this skill to L4_EXPERT. */
  private async awardL4(studentId: string, skillId: string) {
    await this.prisma.userSkill.upsert({
      where: { userId_skillId: { userId: studentId, skillId } },
      update: { highestVerificationLayer: VerificationLayer.L4_EXPERT },
      create: {
        userId: studentId,
        skillId,
        highestVerificationLayer: VerificationLayer.L4_EXPERT,
      },
    });
    // Recompute is L4-floor-aware, so this won't be downgraded.
    await this.layers.recomputeAllForUser(studentId);
  }
}

const bookingSelect = {
  id: true,
  scheduledAt: true,
  status: true,
  meetingUrl: true,
  notes: true,
  panelNotes: true,
  score: true,
  result: true,
  skillId: true,
  user: { select: { studentProfile: { select: { fullName: true, sharableSlug: true } } } },
} as const;

type BookingRow = {
  id: string;
  scheduledAt: Date;
  status: string;
  meetingUrl: string | null;
  notes: string | null;
  panelNotes: string | null;
  score: number | null;
  result: string | null;
  skillId: string | null;
  user: { studentProfile: { fullName: string; sharableSlug: string } | null };
};

function toBookingCard(b: BookingRow, skillName: string | null) {
  return {
    id: b.id,
    scheduledAt: b.scheduledAt,
    status: b.status,
    meetingUrl: b.meetingUrl,
    notes: b.notes,
    panelNotes: b.panelNotes,
    score: b.score,
    result: b.result,
    skillId: b.skillId,
    skillName,
    studentName: b.user.studentProfile?.fullName ?? 'Student',
    studentSlug: b.user.studentProfile?.sharableSlug ?? null,
  };
}
