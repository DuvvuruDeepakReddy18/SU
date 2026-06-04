import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { RedisService } from '../../infra/redis/redis.service';
import { QUEUE_NAMES, VERIFICATION_JOBS } from '../../infra/queue/queue.constants';
import { CollegeIdService } from './college-id.service';
import { AcademicRecordService } from './academic-record.service';

type ScreenCollegeIdJob = { userId: string };
type ProcessMarksheetJob = { recordId: string };

/**
 * BullMQ worker that drains the verification-screen queue. Two job kinds:
 *
 *   - "screen-college-id" → CollegeIdService.screen(userId)
 *   - "process-marksheet" → AcademicRecordService.processOcrForRecord(recordId)
 *
 * concurrency=4: OpenRouter free-tier rate limit is ~10 RPM per key, so we
 * keep a small parallel pool and let BullMQ's exponential backoff (3 attempts,
 * 2s base — set in QueueService) handle 429s.
 */
@Injectable()
export class VerificationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(VerificationWorker.name);
  private worker?: Worker;

  constructor(
    private readonly redis: RedisService,
    private readonly collegeId: CollegeIdService,
    private readonly academic: AcademicRecordService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAMES.VERIFICATION_SCREEN,
      async (job: Job) => {
        if (job.name === VERIFICATION_JOBS.SCREEN_COLLEGE_ID) {
          const { userId } = job.data as ScreenCollegeIdJob;
          this.log.log(`Screening college-id for user ${userId}`);
          await this.collegeId.screen(userId);
          return;
        }
        if (job.name === VERIFICATION_JOBS.PROCESS_MARKSHEET) {
          const { recordId } = job.data as ProcessMarksheetJob;
          this.log.log(`Processing marksheet ${recordId}`);
          await this.academic.processOcrForRecord(recordId);
          return;
        }
        this.log.warn(`Unknown job name on verification-screen queue: ${job.name}`);
      },
      {
        connection: this.redis.client,
        concurrency: 4,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.log.error(
        `Verification job ${job?.name ?? '<unknown>'} (id=${job?.id ?? '?'}) failed: ${err.message}`,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
