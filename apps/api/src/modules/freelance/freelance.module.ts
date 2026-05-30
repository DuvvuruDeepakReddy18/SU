import { Module } from '@nestjs/common';
import { FreelanceController } from './freelance.controller';
import { FreelanceService } from './freelance.service';
import { GeocodeService } from './geocode.service';

@Module({
  controllers: [FreelanceController],
  providers: [FreelanceService, GeocodeService],
})
export class FreelanceModule {}
