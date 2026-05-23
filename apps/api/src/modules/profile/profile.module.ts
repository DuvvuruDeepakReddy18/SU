import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ResumeParser } from './resume-parser';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, ResumeParser],
  exports: [ProfileService],
})
export class ProfileModule {}
