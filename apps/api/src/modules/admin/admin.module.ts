import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { VerificationsModule } from '../verifications/verifications.module';
import { CommunityModule } from '../community/community.module';
import { RecruitersModule } from '../recruiters/recruiters.module';
import { InstitutionAdminModule } from '../institution-admin/institution-admin.module';
import { InterviewerModule } from '../interviewer/interviewer.module';
import { VerificationAuditService } from './verification-audit.service';

@Module({
  imports: [
    VerificationsModule,
    CommunityModule,
    RecruitersModule,
    InstitutionAdminModule,
    InterviewerModule,
  ],
  controllers: [AdminController],
  providers: [VerificationAuditService],
  exports: [VerificationAuditService],
})
export class AdminModule {}
