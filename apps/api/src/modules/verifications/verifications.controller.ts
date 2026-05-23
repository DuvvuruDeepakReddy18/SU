import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { VerificationsService } from './verifications.service';
import {
  AcademicRecordCreateDto,
  CertificationCreateDto,
  ProjectCreateDto,
  ProjectLinkSkillsDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('verifications')
export class VerificationsController {
  constructor(private readonly svc: VerificationsService) {}

  @Get('me/summary')
  summary(@CurrentUser() u: JwtPayload) {
    return this.svc.listMineSummary(u.sub);
  }

  @Post('academic')
  addAcademic(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: AcademicRecordCreateDto) {
    return this.svc.addAcademic(u.sub, dto);
  }

  @Post('certifications')
  addCert(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: CertificationCreateDto) {
    return this.svc.addCertification(u.sub, dto);
  }

  @Post('projects')
  createProject(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: ProjectCreateDto) {
    return this.svc.createProject(u.sub, dto);
  }

  @Post('projects/:id/link-skills')
  linkSkills(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: ProjectLinkSkillsDto,
  ) {
    return this.svc.linkProjectSkills(u.sub, id, dto);
  }

  @Get('expert-screening')
  expert() {
    return this.svc.expertScreening();
  }
}
