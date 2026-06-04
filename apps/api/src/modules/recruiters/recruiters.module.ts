import { Module } from '@nestjs/common';
import { RecruitersController } from './recruiters.controller';
import { StudentInquiriesController } from './student-inquiries.controller';
import { RecruitersService } from './recruiters.service';

@Module({
  controllers: [RecruitersController, StudentInquiriesController],
  providers: [RecruitersService],
  exports: [RecruitersService],
})
export class RecruitersModule {}
