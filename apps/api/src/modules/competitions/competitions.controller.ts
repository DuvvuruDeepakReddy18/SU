import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly svc: CompetitionsService) {}

  @Public()
  @Get()
  list(@Query('category') category?: string) {
    return this.svc.list(category);
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@CurrentUser() u: JwtPayload, @Body() body: any) {
    if (!body?.title || !body?.category || !body?.startsAt || !body?.endsAt) {
      throw new BadRequestException('title, category, startsAt, endsAt required');
    }
    return this.svc.create(u.sub, body);
  }

  @Post(':id/enter')
  enter(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: { submissionUrl?: string } = {},
  ) {
    return this.svc.enter(u.sub, id, body?.submissionUrl);
  }
}
