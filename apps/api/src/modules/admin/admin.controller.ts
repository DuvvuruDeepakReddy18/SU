import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  RejectActionSchema,
  RecruiterRejectSchema,
  InviteInterviewerSchema,
} from '@skillverify/shared';
import type { JwtPayload, AuditTargetType } from '@skillverify/shared';
import { CollegeIdService } from '../verifications/college-id.service';
import { AcademicRecordService } from '../verifications/academic-record.service';
import { CommunityService } from '../community/community.service';
import { RecruitersService } from '../recruiters/recruiters.service';
import { InstitutionAdminService } from '../institution-admin/institution-admin.service';
import { InterviewerService } from '../interviewer/interviewer.service';
import { EmailService } from '../../infra/email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerificationAuditService } from './verification-audit.service';

class RejectDto extends createZodDto(RejectActionSchema) {}
class RecruiterRejectDto extends createZodDto(RecruiterRejectSchema) {}
class InviteInterviewerDto extends createZodDto(InviteInterviewerSchema) {}

@Controller('admin')
@Roles('PLATFORM_ADMIN')
export class AdminController {
  constructor(
    private readonly collegeId: CollegeIdService,
    private readonly academic: AcademicRecordService,
    private readonly community: CommunityService,
    private readonly recruiters: RecruitersService,
    private readonly institutionAdmins: InstitutionAdminService,
    private readonly interviewers: InterviewerService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly audit: VerificationAuditService,
  ) {}

  // ---- Audit log read endpoint (per-target trail) ----

  @Get('audit/:targetType/:targetId')
  auditTrail(
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.audit.forTarget(targetType as AuditTargetType, targetId, limit);
  }

  // ---- College ID verification queue ----

  @Get('verifications/college-ids')
  listCollegeIds(@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    return this.collegeId.listPending(limit);
  }

  @Post('verifications/college-ids/:userId/approve')
  async approveCollegeId(@CurrentUser() u: JwtPayload, @Param('userId') userId: string) {
    const { before, updated } = await this.collegeId.approve(userId);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'college_id',
      targetId: userId,
      action: 'approve',
      previousState: before ?? undefined,
    });
    return updated;
  }

  @Post('verifications/college-ids/:userId/reject')
  async rejectCollegeId(
    @CurrentUser() u: JwtPayload,
    @Param('userId') userId: string,
    @Body(ZodValidationPipe) dto: RejectDto,
  ) {
    const { before, updated } = await this.collegeId.reject(userId, dto.reasonCode, dto.reasonNote);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'college_id',
      targetId: userId,
      action: 'reject',
      reasonCode: dto.reasonCode,
      reasonNote: dto.reasonNote ?? null,
      previousState: before ?? undefined,
    });
    return updated;
  }

  // ---- Academic record verification queue ----

  @Get('verifications/academic-records')
  listPendingAcademic() {
    return this.academic.listPending(100);
  }

  @Post('verifications/academic-records/:id/approve')
  async approveAcademic(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    const { before, rec } = await this.academic.approve(id);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'academic_record',
      targetId: id,
      action: 'approve',
      previousState: before ?? undefined,
    });
    return rec;
  }

  @Post('verifications/academic-records/:id/reject')
  async rejectAcademic(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: RejectDto,
  ) {
    const { before, rec } = await this.academic.reject(id, dto.reasonCode, dto.reasonNote);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'academic_record',
      targetId: id,
      action: 'reject',
      reasonCode: dto.reasonCode,
      reasonNote: dto.reasonNote ?? null,
      previousState: before ?? undefined,
    });
    return rec;
  }

  // ---- Institution moderation (user-suggested rows) ----

  @Get('institutions/pending')
  listPendingInstitutions() {
    return this.prisma.institution.findMany({
      where: { verified: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Post('institutions/:id/approve')
  async approveInstitution(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    const updated = await this.prisma.institution.update({
      where: { id },
      data: { verified: true },
    });
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'institution',
      targetId: id,
      action: 'approve',
    });
    return updated;
  }

  @Post('institutions/:id/reject')
  async rejectInstitution(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: RejectDto,
  ) {
    // Snapshot before destructive action so the audit row has the deleted data.
    const before = await this.prisma.institution.findUnique({ where: { id } });
    await this.prisma.institution.delete({ where: { id } });
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'institution',
      targetId: id,
      action: 'delete',
      reasonCode: dto.reasonCode,
      reasonNote: dto.reasonNote ?? null,
      previousState: before ? { ...before, createdAt: before.createdAt.toISOString() } : undefined,
    });
    return { ok: true };
  }

  // ---- Recruiter approval queue ----

  @Get('recruiters')
  listPendingRecruiters() {
    return this.recruiters.adminListPending(50);
  }

  @Post('recruiters/:userId/approve')
  async approveRecruiter(@CurrentUser() u: JwtPayload, @Param('userId') userId: string) {
    const { before, profile } = await this.recruiters.adminApprove(userId);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'recruiter',
      targetId: userId,
      action: 'approve',
      previousState: before ?? undefined,
    });
    void this.email.sendRecruiterApproved(
      profile.user.email,
      profile.fullName ?? 'there',
      profile.employer.name,
    );
    void this.notifications.emit(userId, 'recruiter_approved', {
      title: 'Recruiter account approved',
      body: `Your account for ${profile.employer.name} is approved. You can now search and contact candidates.`,
      href: '/company',
    });
    return profile;
  }

  @Post('recruiters/:userId/reject')
  async rejectRecruiter(
    @CurrentUser() u: JwtPayload,
    @Param('userId') userId: string,
    @Body(ZodValidationPipe) dto: RecruiterRejectDto,
  ) {
    const { before, profile } = await this.recruiters.adminReject(userId, dto.reason);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'recruiter',
      targetId: userId,
      action: 'reject',
      reasonNote: dto.reason ?? null,
      previousState: before ?? undefined,
    });
    void this.email.sendRecruiterRejected(
      profile.user.email,
      profile.fullName ?? 'there',
      dto.reason ?? null,
    );
    void this.notifications.emit(userId, 'recruiter_rejected', {
      title: 'Recruiter account not approved',
      body: dto.reason
        ? `Your recruiter account wasn't approved: ${dto.reason}`
        : "Your recruiter account wasn't approved. Contact support if you think this is a mistake.",
      href: '/company',
    });
    return profile;
  }

  // ---- Institution / TPO approval queue ----

  @Get('institution-admins')
  listPendingInstitutionAdmins() {
    return this.institutionAdmins.adminListPending(50);
  }

  @Post('institution-admins/:userId/approve')
  async approveInstitutionAdmin(@CurrentUser() u: JwtPayload, @Param('userId') userId: string) {
    const { before, profile } = await this.institutionAdmins.adminApprove(userId);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'institution_admin',
      targetId: userId,
      action: 'approve',
      previousState: before ?? undefined,
    });
    void this.email.sendInstitutionAdminApproved(
      profile.user.email,
      profile.fullName ?? 'there',
      profile.institution.name,
    );
    void this.notifications.emit(userId, 'institution_admin_approved', {
      title: 'Institution access approved',
      body: `Your TPO account for ${profile.institution.name} is approved. Your placement dashboard is now live.`,
      href: '/institution',
    });
    return profile;
  }

  @Post('institution-admins/:userId/reject')
  async rejectInstitutionAdmin(
    @CurrentUser() u: JwtPayload,
    @Param('userId') userId: string,
    @Body(ZodValidationPipe) dto: RecruiterRejectDto,
  ) {
    const { before, profile } = await this.institutionAdmins.adminReject(userId, dto.reason);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'institution_admin',
      targetId: userId,
      action: 'reject',
      reasonNote: dto.reason ?? null,
      previousState: before ?? undefined,
    });
    void this.email.sendInstitutionAdminRejected(
      profile.user.email,
      profile.fullName ?? 'there',
      dto.reason ?? null,
    );
    void this.notifications.emit(userId, 'institution_admin_rejected', {
      title: 'Institution access not approved',
      body: dto.reason
        ? `Your TPO request wasn't approved: ${dto.reason}`
        : "Your TPO request wasn't approved. Contact support if you think this is a mistake.",
      href: '/institution',
    });
    return profile;
  }

  // ---- Interviewer management (invite-only) ----

  @Get('interviewers')
  listInterviewers() {
    return this.interviewers.adminList();
  }

  @Post('interviewers/invite')
  inviteInterviewer(@Body(ZodValidationPipe) dto: InviteInterviewerDto) {
    return this.interviewers.adminInvite(dto);
  }

  @Post('interviewers/:userId/active')
  setInterviewerActive(@Param('userId') userId: string, @Body() body: { active: boolean }) {
    return this.interviewers.adminSetActive(userId, body.active !== false);
  }

  // ---- Interview review window / licensing / payouts (Ch.6) ----

  /** Interviews awaiting the ~48h review before results go live. */
  @Get('interviews/review-queue')
  interviewReviewQueue() {
    return this.interviewers.adminReviewQueue();
  }

  /** Release a reviewed interview — pass awards L4 (Expert-Verified). */
  @Post('interviews/:id/release')
  releaseInterview(@Param('id') id: string, @Body() body: { pass: boolean }) {
    return this.interviewers.adminRelease(id, body?.pass === true);
  }

  /** Renew / suspend / reactivate an interviewer's license. */
  @Post('interviewers/:userId/license')
  setInterviewerLicense(
    @Param('userId') userId: string,
    @Body() body: { action: 'renew' | 'suspend' | 'reactivate' },
  ) {
    return this.interviewers.adminSetLicense(userId, body?.action ?? 'renew');
  }

  /** Build a fortnightly interviewer payout batch for a period. */
  @Post('interviews/payouts/run')
  runInterviewPayouts(@Body() body: { periodStart: string; periodEnd: string }) {
    if (!body?.periodStart || !body?.periodEnd) {
      throw new BadRequestException('periodStart and periodEnd are required (ISO dates).');
    }
    return this.interviewers.runPayouts(body.periodStart, body.periodEnd);
  }

  // ---- Community moderation ----

  @Post('community/posts/:id/hide')
  async hideCommunityPost(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    const updated = await this.community.hidePostByMod(id);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'community_post',
      targetId: id,
      action: 'hide',
    });
    return updated;
  }

  @Post('community/posts/:id/unhide')
  async unhideCommunityPost(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    const updated = await this.community.unhidePostByMod(id);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'community_post',
      targetId: id,
      action: 'unhide',
    });
    return updated;
  }

  @Post('community/comments/:id/hide')
  async hideCommunityComment(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    const updated = await this.community.hideCommentByMod(id);
    await this.audit.record({
      actorUserId: u.sub,
      targetType: 'community_comment',
      targetId: id,
      action: 'hide',
    });
    return updated;
  }
}
