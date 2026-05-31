import { Module } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';
import { LayerEngine } from './layer-engine';
import { CollegeIdService } from './college-id.service';
import { AcademicRecordService } from './academic-record.service';

@Module({
  controllers: [VerificationsController],
  providers: [VerificationsService, LayerEngine, CollegeIdService, AcademicRecordService],
  exports: [VerificationsService, LayerEngine, CollegeIdService, AcademicRecordService],
})
export class VerificationsModule {}
