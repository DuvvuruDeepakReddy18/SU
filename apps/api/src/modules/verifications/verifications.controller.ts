import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { VerificationsService } from './verifications.service';
import { AcademicRecordService } from './academic-record.service';
import {
  AcademicRecordCreateDto,
  CertificationCreateDto,
  ProjectCreateDto,
  ProjectLinkSkillsDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';
import { QueueService } from '../../infra/queue/queue.service';
import { QUEUE_NAMES, VERIFICATION_JOBS } from '../../infra/queue/queue.constants';

@Controller('verifications')
export class VerificationsController {
  constructor(
    private readonly svc: VerificationsService,
    private readonly academic: AcademicRecordService,
    private readonly queue: QueueService,
  ) {}

  @Get('me/summary')
  summary(@CurrentUser() u: JwtPayload) {
    return this.svc.listMineSummary(u.sub);
  }

  @Get('me/status')
  status(@CurrentUser() u: JwtPayload) {
    return this.svc.myStatus(u.sub);
  }

  /**
   * Where the user sits in the college-ID review queue. Powers the SLA
   * messaging on the dashboard ("You're #N in line · ETA < 24h").
   */
  @Get('me/queue-position')
  queuePosition(@CurrentUser() u: JwtPayload) {
    return this.svc.myCollegeIdQueuePosition(u.sub);
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

  // --------- Semester-wise marksheet (OCR + anti-tamper) ---------

  @Get('academic-records')
  listAcademic(@CurrentUser() u: JwtPayload) {
    return this.academic.listMine(u.sub);
  }

  @Post('academic-records/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadAcademic(
    @CurrentUser() u: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Query('semester', ParseIntPipe) semester: number,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Marksheet must be JPG, PNG, WebP, or PDF.');
    }
    if (semester < 1 || semester > 12) {
      throw new BadRequestException('Semester must be 1–12.');
    }
    // Sync portion: hash + S3 upload + create pending record.
    const record = await this.academic.uploadSemester({
      userId: u.sub,
      semester,
      fileBuffer: file.buffer,
      fileMime: file.mimetype,
      fileName: file.originalname,
    });
    // Async portion: OCR + auto-verify decision runs in the worker. Student
    // sees "pending" immediately and gets a status update via email later.
    await this.queue.addNamed(
      QUEUE_NAMES.VERIFICATION_SCREEN,
      VERIFICATION_JOBS.PROCESS_MARKSHEET,
      { recordId: record.id },
      { jobId: `process-marksheet:${record.id}` },
    );
    return record;
  }
}
