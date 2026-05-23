import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PlacementsService } from './placements.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('placements')
export class PlacementsController {
  constructor(private readonly svc: PlacementsService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload, @Query('jobType') jobType?: string) {
    return this.svc.list({ jobType, institutionId: u.institutionId ?? null });
  }

  @Get('me/applications')
  mine(@CurrentUser() u: JwtPayload) {
    return this.svc.myApplications(u.sub);
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    if (!body?.company || !body?.role) throw new BadRequestException('company and role required');
    return this.svc.create(u.sub, body);
  }

  @Post(':id/apply')
  apply(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.apply(u.sub, id);
  }
}
