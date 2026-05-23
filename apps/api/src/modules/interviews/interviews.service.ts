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
    return this.prisma.interviewBooking.create({
      data: {
        userId,
        skillId: dto.skillId ?? null,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes ?? null,
        status: 'scheduled',
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
