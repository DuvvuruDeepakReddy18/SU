import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { VerificationsModule } from '../verifications/verifications.module';

@Module({
  imports: [VerificationsModule],
  controllers: [AdminController],
})
export class AdminModule {}
