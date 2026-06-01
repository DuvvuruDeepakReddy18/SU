import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { VerificationsModule } from '../verifications/verifications.module';
import { CommunityModule } from '../community/community.module';

@Module({
  imports: [VerificationsModule, CommunityModule],
  controllers: [AdminController],
})
export class AdminModule {}
