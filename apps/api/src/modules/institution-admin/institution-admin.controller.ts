import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { InstitutionAdminService } from './institution-admin.service';
import {
  RosterQueryDto,
  InstituteDriveDto,
  InstituteCompetitionDto,
  InstituteKnowledgeDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

// Institution / TPO-only surface. Approval status is enforced per-endpoint
// where it matters (roster / analytics); `me` is reachable by pending admins
// so the shell can render the pending screen.
@Controller('institution-admin')
@Roles('INSTITUTION_ADMIN')
export class InstitutionAdminController {
  constructor(private readonly svc: InstitutionAdminService) {}

  @Get('me')
  me(@CurrentUser() u: JwtPayload) {
    return this.svc.me(u.sub);
  }

  @Get('roster')
  roster(@CurrentUser() u: JwtPayload, @Query(ZodValidationPipe) query: RosterQueryDto) {
    return this.svc.roster(u.sub, query);
  }

  @Get('analytics')
  analytics(@CurrentUser() u: JwtPayload) {
    return this.svc.analytics(u.sub);
  }

  // ---------- Institute drives ----------

  @Get('drives')
  listDrives(@CurrentUser() u: JwtPayload) {
    return this.svc.listDrives(u.sub);
  }

  @Post('drives')
  createDrive(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: InstituteDriveDto) {
    return this.svc.createDrive(u.sub, dto);
  }

  @Delete('drives/:id')
  deleteDrive(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.deleteDrive(u.sub, id);
  }

  // ---------- Institute competitions ----------

  @Get('competitions')
  listCompetitions(@CurrentUser() u: JwtPayload) {
    return this.svc.listCompetitions(u.sub);
  }

  @Post('competitions')
  createCompetition(
    @CurrentUser() u: JwtPayload,
    @Body(ZodValidationPipe) dto: InstituteCompetitionDto,
  ) {
    return this.svc.createCompetition(u.sub, dto);
  }

  @Delete('competitions/:id')
  deleteCompetition(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.deleteCompetition(u.sub, id);
  }

  // ---------- Chatbot knowledge base ----------

  @Get('knowledge')
  listKnowledge(@CurrentUser() u: JwtPayload) {
    return this.svc.listKnowledge(u.sub);
  }

  @Post('knowledge')
  addKnowledge(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: InstituteKnowledgeDto) {
    return this.svc.addKnowledge(u.sub, dto);
  }

  @Delete('knowledge/:id')
  deleteKnowledge(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.deleteKnowledge(u.sub, id);
  }
}
