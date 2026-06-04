import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { RecruitersService } from './recruiters.service';
import {
  CandidateSearchDto,
  SaveCandidateDto,
  RecruiterJobDto,
  MoveStageDto,
  RecruiterInquiryDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

// Recruiter-only surface. Approval status is enforced inside the service
// (assertApproved) for every candidate read/write; `me` is reachable by
// pending recruiters so the shell can render the pending screen.
@Controller('recruiters')
@Roles('RECRUITER')
export class RecruitersController {
  constructor(private readonly svc: RecruitersService) {}

  @Get('me')
  me(@CurrentUser() u: JwtPayload) {
    return this.svc.me(u.sub);
  }

  // ---------- Candidate search ----------

  @Get('candidates')
  search(@CurrentUser() u: JwtPayload, @Query(ZodValidationPipe) query: CandidateSearchDto) {
    return this.svc.searchCandidates(u.sub, query);
  }

  @Get('candidates/:studentId')
  candidate(@CurrentUser() u: JwtPayload, @Param('studentId') studentId: string) {
    return this.svc.getCandidate(u.sub, studentId);
  }

  // ---------- Shortlist ----------

  @Get('saved')
  listSaved(@CurrentUser() u: JwtPayload) {
    return this.svc.listSaved(u.sub);
  }

  @Post('saved/:studentId')
  save(
    @CurrentUser() u: JwtPayload,
    @Param('studentId') studentId: string,
    @Body(ZodValidationPipe) dto: SaveCandidateDto,
  ) {
    return this.svc.saveCandidate(u.sub, studentId, dto.note);
  }

  @Delete('saved/:studentId')
  unsave(@CurrentUser() u: JwtPayload, @Param('studentId') studentId: string) {
    return this.svc.unsaveCandidate(u.sub, studentId);
  }

  // ---------- Jobs ----------

  @Get('jobs')
  listJobs(@CurrentUser() u: JwtPayload) {
    return this.svc.listJobs(u.sub);
  }

  @Post('jobs')
  createJob(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: RecruiterJobDto) {
    return this.svc.createJob(u.sub, dto);
  }

  @Patch('jobs/:id')
  updateJob(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: RecruiterJobDto,
  ) {
    return this.svc.updateJob(u.sub, id, dto);
  }

  @Delete('jobs/:id')
  deleteJob(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.deleteJob(u.sub, id);
  }

  // ---------- Pipeline ----------

  @Get('jobs/:id/pipeline')
  pipeline(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getJobPipeline(u.sub, id);
  }

  @Patch('jobs/:id/applications/:applicationId')
  moveApplication(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
    @Body(ZodValidationPipe) dto: MoveStageDto,
  ) {
    return this.svc.moveApplication(u.sub, id, applicationId, dto.stage);
  }

  @Post('jobs/:id/source/:studentId')
  source(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.svc.sourceCandidate(u.sub, id, studentId);
  }

  // ---------- Contact requests (recruiter side) ----------

  @Get('inquiries')
  myInquiries(@CurrentUser() u: JwtPayload) {
    return this.svc.listMyInquiries(u.sub);
  }

  @Post('inquiries')
  createInquiry(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: RecruiterInquiryDto) {
    return this.svc.createInquiry(u.sub, dto);
  }
}
