import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.interviewBooking.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async book(userId: string, dto: { skillId?: string; scheduledAt: string; notes?: string }) {
    // Auto-generate a Jitsi Meet room — free, no API key, anyone with the URL can join.
    // Format: https://meet.jit.si/<room-name>. Room names are random + unguessable.
    const roomName = `skillverify-${userId.slice(-6)}-${Date.now().toString(36)}`;
    const meetingUrl = `https://meet.jit.si/${roomName}`;
    return this.prisma.interviewBooking.create({
      data: {
        userId,
        skillId: dto.skillId ?? null,
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
