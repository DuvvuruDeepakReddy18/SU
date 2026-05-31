import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ResumeParser } from './resume-parser';
import { VerificationsModule } from '../verifications/verifications.module';

@Module({
  imports: [VerificationsModule],
  controllers: [ProfileController],
  providers: [ProfileService, ResumeParser],
  exports: [ProfileService],
})
export class ProfileModule {}
