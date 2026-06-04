import { Module } from '@nestjs/common';
import { InterviewerController } from './interviewer.controller';
import { InterviewerService } from './interviewer.service';
import { VerificationsModule } from '../verifications/verifications.module';

@Module({
  imports: [VerificationsModule], // for LayerEngine (L4 award)
  controllers: [InterviewerController],
  providers: [InterviewerService],
  exports: [InterviewerService],
})
export class InterviewerModule {}
