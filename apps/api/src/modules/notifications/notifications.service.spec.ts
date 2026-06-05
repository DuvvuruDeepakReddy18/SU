import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service';
import { QUEUE_NAMES } from '../../infra/queue/queue.constants';

function setup() {
  const prisma = { notification: { create: vi.fn().mockResolvedValue({ id: 'n_1' }) } };
  const queue = { add: vi.fn().mockResolvedValue({ id: 'job_1' }) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = new NotificationsService(prisma as any, queue as any);
  return { prisma, queue, svc };
}

describe('NotificationsService.emit', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  it('enqueues a fanout job and does NOT write directly', async () => {
    await ctx.svc.emit('u_1', 'inquiry_received', { title: 'Hi', body: 'A company is interested' });
    expect(ctx.queue.add).toHaveBeenCalledTimes(1);
    expect(ctx.queue.add).toHaveBeenCalledWith(QUEUE_NAMES.NOTIFICATION_FANOUT, {
      userId: 'u_1',
      type: 'inquiry_received',
      payload: { title: 'Hi', body: 'A company is interested' },
    });
    expect(ctx.prisma.notification.create).not.toHaveBeenCalled();
  });

  it('falls back to a direct write when the queue is unreachable', async () => {
    ctx.queue.add.mockRejectedValueOnce(new Error('redis down'));
    await ctx.svc.emit('u_2', 'college_id_approved', { title: 'Verified', body: 'done' });
    expect(ctx.prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(ctx.prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'u_2',
        type: 'college_id_approved',
        payload: { title: 'Verified', body: 'done' },
      },
    });
  });

  it('never throws even if both the queue and the fallback fail', async () => {
    ctx.queue.add.mockRejectedValueOnce(new Error('redis down'));
    ctx.prisma.notification.create.mockRejectedValueOnce(new Error('db down'));
    await expect(
      ctx.svc.emit('u_3', 'marksheet_rejected', { title: 'x', body: 'y' }),
    ).resolves.toBeUndefined();
  });
});
