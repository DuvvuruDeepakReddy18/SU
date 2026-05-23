import { Module } from '@nestjs/common';
import { FreelanceController } from './freelance.controller';
import { FreelanceService } from './freelance.service';

@Module({ controllers: [FreelanceController], providers: [FreelanceService] })
export class FreelanceModule {}
