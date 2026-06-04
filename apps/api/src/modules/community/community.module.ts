import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService, IdempotencyInterceptor],
  exports: [CommunityService],
})
export class CommunityModule {}
