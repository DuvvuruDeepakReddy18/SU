import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { VerificationLayer } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** A student's bookings, each annotated with its skill name. */
  async list(userId: string) {
    const bookings = await this.prisma.interviewBooking.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
    });
    const skillIds = [...new Set(bookings.map((b) => b.skillId).filter(Boolean) as string[])];
    const skills = skillIds.length
      ? await this.prisma.skillCatalog.findMany({
          where: { id: { in: skillIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(skills.map((s) => [s.id, s.name]));
    return bookings.map((b) => ({
      ...b,
      skillName: b.skillId ? (nameById.get(b.skillId) ?? null) : null,
    }));
  }

  /**
   * Skills a student is eligible to book an L4 interview for: the ones they've
   * already proven to L3. (L4 is the expert tier above L3 Proven.) Skills
   * already at L4 are excluded — there's nothing left to verify.
   */
  async eligibleSkills(userId: string) {
    const rows = await this.prisma.userSkill.findMany({
      where: { userId, highestVerificationLayer: VerificationLayer.L3_PROVEN },
      select: { skillId: true, skill: { select: { name: true } } },
      orderBy: { skill: { name: 'asc' } },
    });
    return rows.map((r) => ({ skillId: r.skillId, name: r.skill.name }));
  }

  async book(userId: string, dto: { skillId: string; scheduledAt: string; notes?: string }) {
    // Guard: you can only book an L4 interview for a skill you've proven to L3.
    const eligible = await this.prisma.userSkill.findFirst({
      where: {
        userId,
        skillId: dto.skillId,
        highestVerificationLayer: VerificationLayer.L3_PROVEN,
      },
      select: { id: true },
    });
    if (!eligible) {
      throw new BadRequestException(
        'You can only book an expert interview for a skill verified to L3 (Proven).',
      );
    }

    // Auto-generate a Jitsi Meet room — free, no API key, anyone with the URL
    // can join, so the name must be UNGUESSABLE (24 hex chars of CSPRNG). A
    // userId-slice + timestamp would be guessable and let outsiders crash or
    // eavesdrop on a candidate's interview.
    const roomName = `skillverify-${randomBytes(12).toString('hex')}`;
    const meetingUrl = `https://meet.jit.si/${roomName}`;
    return this.prisma.interviewBooking.create({
      data: {
        userId,
        skillId: dto.skillId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes ?? null,
        status: 'scheduled',
        meetingUrl,
      },
    });
  }

  async cancel(userId: string, id: string) {
    return this.prisma.interviewBooking.updateMany({
      where: { id, userId },
      data: { status: 'cancelled' },
    });
  }

  // ---------- Daily-slot model (Ch.6) ----------

  /**
   * Admin/ops: generate daily slots per domain (skill category) for the next N
   * days. Idempotent — re-running won't duplicate an existing domain+time slot.
   * Times are stored UTC; the frontend renders them in the viewer's local zone.
   */
  async generateSlots(opts: { days?: number; capacity?: number; panelSize?: number }) {
    const days = opts.days ?? 7;
    const capacity = opts.capacity ?? 5;
    const panelSize = opts.panelSize ?? 2;
    const UTC_HOURS = [4, 6, 8, 10, 12, 14]; // spread across the day

    const cats = await this.prisma.skillCatalog.findMany({
      distinct: ['category'],
      select: { category: true },
    });
    const domains = [...new Set(cats.map((c) => c.category).filter((c): c is string => !!c))];

    const today = new Date();
    let created = 0;
    for (let d = 1; d <= days; d += 1) {
      const base = new Date(today);
      base.setUTCDate(today.getUTCDate() + d);
      for (const domain of domains) {
        for (const h of UTC_HOURS) {
          const startsAt = new Date(
            Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), h, 0, 0),
          );
          const exists = await this.prisma.interviewSlot.findFirst({
            where: { domain, startsAt },
            select: { id: true },
          });
          if (exists) continue;
          await this.prisma.interviewSlot.create({
            data: { domain, startsAt, capacity, panelSize, bookedCount: 0 },
          });
          created += 1;
        }
      }
    }
    return { created, domains: domains.length };
  }

  /** Open slots a student can book for a given L3-proven skill (its domain). */
  async availableSlots(userId: string, skillId: string) {
    const us = await this.prisma.userSkill.findFirst({
      where: { userId, skillId, highestVerificationLayer: VerificationLayer.L3_PROVEN },
      select: { skill: { select: { category: true } } },
    });
    if (!us) {
      throw new BadRequestException(
        'You can only book an expert interview for an L3-proven skill.',
      );
    }
    const domain = us.skill.category;
    if (!domain) return [];
    const slots = await this.prisma.interviewSlot.findMany({
      where: { domain, startsAt: { gt: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 80,
    });
    return slots
      .filter((s) => s.bookedCount < s.capacity)
      .map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        panelSize: s.panelSize,
        remaining: s.capacity - s.bookedCount,
      }));
  }

  /**
   * Book a slot: L3-gate, atomically reserve a seat (pay-before-lock semantics —
   * the conditional update makes concurrent bookings race-safe), then randomly
   * pair the panel. Free during beta; the Razorpay path stays gated.
   */
  async bookSlot(userId: string, dto: { skillId: string; slotId: string; notes?: string }) {
    const us = await this.prisma.userSkill.findFirst({
      where: {
        userId,
        skillId: dto.skillId,
        highestVerificationLayer: VerificationLayer.L3_PROVEN,
      },
      select: { skill: { select: { category: true } } },
    });
    if (!us) {
      throw new BadRequestException(
        'You can only book an expert interview for an L3-proven skill.',
      );
    }
    const slot = await this.prisma.interviewSlot.findUnique({ where: { id: dto.slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.domain !== us.skill.category) {
      throw new BadRequestException('That slot is for a different domain.');
    }

    // Atomic seat reservation: only one booking can ever take the last seat.
    const reserved = await this.prisma.interviewSlot.updateMany({
      where: { id: slot.id, bookedCount: { lt: slot.capacity } },
      data: { bookedCount: { increment: 1 } },
    });
    if (reserved.count === 0) {
      throw new BadRequestException('That slot just filled up. Please pick another.');
    }

    try {
      const panel = await this.pickPanel(slot.domain, slot.panelSize, userId);
      const roomName = `skillverify-${randomBytes(12).toString('hex')}`;
      return await this.prisma.interviewBooking.create({
        data: {
          userId,
          skillId: dto.skillId,
          slotId: slot.id,
          scheduledAt: slot.startsAt,
          notes: dto.notes ?? null,
          status: 'booked',
          meetingUrl: `https://meet.jit.si/${roomName}`,
          interviewerId: panel[0] ?? null,
          panelist2Id: panel[1] ?? null,
        },
      });
    } catch (e) {
      // Release the reserved seat if the booking row couldn't be created.
      await this.prisma.interviewSlot.updateMany({
        where: { id: slot.id, bookedCount: { gt: 0 } },
        data: { bookedCount: { decrement: 1 } },
      });
      throw e;
    }
  }

  /**
   * Randomly pick up to `panelSize` active, licensed interviewers for a domain,
   * excluding the student. Random + independent at booking time so neither
   * panelist can predict their co-panelist (anti-collusion, Ch.6). Returns fewer
   * if the pool is small; an admin can fill the panel later.
   */
  private async pickPanel(
    domain: string,
    panelSize: number,
    excludeUserId: string,
  ): Promise<string[]> {
    const pool = await this.prisma.interviewerProfile.findMany({
      where: { active: true, licenseStatus: 'active', userId: { not: excludeUserId } },
      select: { userId: true, expertise: true },
    });
    const d = domain.toLowerCase();
    const matching = pool.filter((p) => p.expertise.some((e) => e.toLowerCase().includes(d)));
    const candidates = (matching.length >= panelSize ? matching : pool).map((p) => p.userId);
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, panelSize);
  }
}
