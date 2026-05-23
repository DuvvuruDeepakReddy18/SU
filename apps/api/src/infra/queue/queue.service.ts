import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { Queue, type QueueOptions } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES, type QueueName } from './queue.constants';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues = new Map<QueueName, Queue>();

  constructor(private readonly redis: RedisService) {
    const opts: QueueOptions = {
      connection: this.redis.client,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: { count: 1_000 },
        removeOnFail: { count: 5_000 },
      },
    };
    for (const name of Object.values(QUEUE_NAMES)) {
      this.queues.set(name, new Queue(name, opts));
    }
  }

  get(name: QueueName): Queue {
    const q = this.queues.get(name);
    if (!q) throw new Error(`Queue not registered: ${name}`);
    return q;
  }

  async add<T>(name: QueueName, payload: T, jobId?: string) {
    return this.get(name).add(name, payload, jobId ? { jobId } : undefined);
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
