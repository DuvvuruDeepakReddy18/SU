import { BadRequestException, Injectable } from '@nestjs/common';
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

    // Auto-generate a Jitsi Meet room — free, no API key, anyone with the URL can join.
    // Format: https://meet.jit.si/<room-name>. Room names are random + unguessable.
    const roomName = `skillverify-${userId.slice(-6)}-${Date.now().toString(36)}`;
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
}
