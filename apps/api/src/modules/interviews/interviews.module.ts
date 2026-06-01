import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { RazorpayService } from './razorpay.service';

@Module({
  controllers: [InterviewsController],
  providers: [InterviewsService, RazorpayService],
})
export class InterviewsModule {}
