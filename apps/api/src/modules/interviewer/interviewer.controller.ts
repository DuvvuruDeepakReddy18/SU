import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { InterviewerService } from './interviewer.service';
import { ScoreInterviewDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

// Interviewer-only surface. Invited interviewers are pre-approved; the service
// guards on `active`.
@Controller('interviewer')
@Roles('INTERVIEWER')
export class InterviewerController {
  constructor(private readonly svc: InterviewerService) {}

  @Get('me')
  me(@CurrentUser() u: JwtPayload) {
    return this.svc.me(u.sub);
  }

  @Get('pool')
  pool(@CurrentUser() u: JwtPayload) {
    return this.svc.openPool(u.sub);
  }

  @Post('pool/:bookingId/claim')
  claim(@CurrentUser() u: JwtPayload, @Param('bookingId') bookingId: string) {
    return this.svc.claim(u.sub, bookingId);
  }

  @Get('mine')
  mine(@CurrentUser() u: JwtPayload) {
    return this.svc.myInterviews(u.sub);
  }

  @Post('mine/:bookingId/score')
  score(
    @CurrentUser() u: JwtPayload,
    @Param('bookingId') bookingId: string,
    @Body(ZodValidationPipe) dto: ScoreInterviewDto,
  ) {
    return this.svc.score(u.sub, bookingId, dto);
  }
}
