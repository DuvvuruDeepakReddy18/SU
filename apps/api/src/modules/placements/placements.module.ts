import { Module } from '@nestjs/common';
import { PlacementsController } from './placements.controller';
import { PlacementsService } from './placements.service';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Module({
  controllers: [PlacementsController],
  providers: [PlacementsService, IdempotencyInterceptor],
})
export class PlacementsModule {}
