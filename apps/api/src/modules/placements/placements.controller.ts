import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { PlacementsService } from './placements.service';
import { PlacementDriveCreateDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import type { JwtPayload } from '@skillverify/shared';

@Controller('placements')
export class PlacementsController {
  constructor(private readonly svc: PlacementsService) {}

  @Get()
  list(
    @CurrentUser() u: JwtPayload,
    @Query('jobType') jobType?: string,
    @Query('excludeJobType') excludeJobType?: string,
  ) {
    return this.svc.list({ jobType, excludeJobType, institutionId: u.institutionId ?? null });
  }

  @Get('me/applications')
  mine(@CurrentUser() u: JwtPayload) {
    return this.svc.myApplications(u.sub);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: PlacementDriveCreateDto) {
    return this.svc.create(u.sub, dto);
  }

  @Post(':id/apply')
  @UseInterceptors(IdempotencyInterceptor)
  apply(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.apply(u.sub, id);
  }
}
