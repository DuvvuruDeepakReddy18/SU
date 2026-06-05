import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException();
    if (n.userId !== userId) throw new ForbiddenException();
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  create(userId: string, type: string, payload: Prisma.InputJsonValue) {
    return this.prisma.notification.create({ data: { userId, type, payload } });
  }

  /**
   * Fire-and-forget emit. Standardises the payload shape ({ title, body, href })
   * the frontend bell renders, and never throws — a notification failing must
   * not break the action that triggered it.
   */
  async emit(
    userId: string,
    type: string,
    payload: { title: string; body: string; href?: string },
  ) {
    try {
      await this.create(userId, type, payload);
    } catch {
      // Best-effort only.
    }
  }
}
