import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { QueueService } from '../../infra/queue/queue.service';
import { QUEUE_NAMES } from '../../infra/queue/queue.constants';

export type NotificationPayload = { title: string; body: string; href?: string };
export type NotificationJob = { userId: string; type: string; payload: NotificationPayload };

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

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

  /** The actual DB write. Called by the worker, and as the offline fallback. */
  create(userId: string, type: string, payload: Prisma.InputJsonValue) {
    return this.prisma.notification.create({ data: { userId, type, payload } });
  }

  /**
   * Fire-and-forget emit. Enqueues a notification-fanout job so the DB write
   * (and any future email fanout) happens off the request path with BullMQ's
   * retry/backoff. Never throws — a notification must never break the action
   * that triggered it. If the queue is unreachable, falls back to a direct
   * write so the notification isn't lost.
   */
  async emit(userId: string, type: string, payload: NotificationPayload) {
    const job: NotificationJob = { userId, type, payload };
    try {
      await this.queue.add(QUEUE_NAMES.NOTIFICATION_FANOUT, job);
    } catch (e) {
      this.log.warn(`Notification enqueue failed, writing directly: ${(e as Error).message}`);
      try {
        await this.create(userId, type, payload);
      } catch {
        // Best-effort only.
      }
    }
  }
}
