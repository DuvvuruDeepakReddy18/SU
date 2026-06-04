import { Module } from '@nestjs/common';
import { InstitutionAdminController } from './institution-admin.controller';
import { InstitutionAdminService } from './institution-admin.service';

@Module({
  controllers: [InstitutionAdminController],
  providers: [InstitutionAdminService],
  exports: [InstitutionAdminService],
})
export class InstitutionAdminModule {}
