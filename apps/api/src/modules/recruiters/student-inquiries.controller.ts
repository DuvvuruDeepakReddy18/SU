import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { RecruitersService } from './recruiters.service';
import { RespondInquiryDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

// Student side of recruiter contact requests. Accepting reveals the student's
// contact details to that recruiter (the consent gate).
@Controller('me/recruiter-inquiries')
@Roles('STUDENT')
export class StudentInquiriesController {
  constructor(private readonly svc: RecruitersService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload) {
    return this.svc.listStudentInquiries(u.sub);
  }

  @Get('pending-count')
  pendingCount(@CurrentUser() u: JwtPayload) {
    return this.svc.countStudentPendingInquiries(u.sub);
  }

  @Post(':id/respond')
  respond(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: RespondInquiryDto,
  ) {
    return this.svc.respondToInquiry(u.sub, id, dto.accept);
  }
}
