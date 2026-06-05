import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { RedisService } from '../../infra/redis/redis.service';
import { QUEUE_NAMES } from '../../infra/queue/queue.constants';
import { NotificationsService, type NotificationJob } from './notifications.service';

/**
 * Drains the notification-fanout queue: each job writes one Notification row.
 * Keeping this off the request path means a slow/locked DB never delays the
 * action that triggered the notification, and BullMQ's retry/backoff recovers
 * from a transient write failure instead of silently dropping it.
 */
@Injectable()
export class NotificationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(NotificationWorker.name);
  private worker?: Worker;

  constructor(
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAMES.NOTIFICATION_FANOUT,
      async (job: Job<NotificationJob>) => {
        const { userId, type, payload } = job.data;
        await this.notifications.create(userId, type, payload);
      },
      { connection: this.redis.client, concurrency: 8 },
    );

    this.worker.on('failed', (job, err) => {
      this.log.error(`Notification job (id=${job?.id ?? '?'}) failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
