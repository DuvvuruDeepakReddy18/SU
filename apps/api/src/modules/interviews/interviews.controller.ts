import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly svc: InterviewsService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload) {
    return this.svc.list(u.sub);
  }

  @Post()
  book(
    @CurrentUser() u: JwtPayload,
    @Body() body: { skillId?: string; scheduledAt: string; notes?: string },
  ) {
    if (!body?.scheduledAt) throw new BadRequestException('scheduledAt required');
    return this.svc.book(u.sub, body);
  }

  @Delete(':id')
  cancel(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.cancel(u.sub, id);
  }
}
