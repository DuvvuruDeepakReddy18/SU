import { Module } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';
import { LayerEngine } from './layer-engine';

@Module({
  controllers: [VerificationsController],
  providers: [VerificationsService, LayerEngine],
  exports: [VerificationsService, LayerEngine],
})
export class VerificationsModule {}
