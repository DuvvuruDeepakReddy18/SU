import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { RazorpayService } from './razorpay.service';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Module({
  controllers: [InterviewsController, RazorpayWebhookController],
  providers: [InterviewsService, RazorpayService, IdempotencyInterceptor],
})
export class InterviewsModule {}
