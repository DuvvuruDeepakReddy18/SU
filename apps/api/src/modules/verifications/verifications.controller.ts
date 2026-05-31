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

@Controller('verifications')
export class VerificationsController {
  constructor(
    private readonly svc: VerificationsService,
    private readonly academic: AcademicRecordService,
  ) {}

  @Get('me/summary')
  summary(@CurrentUser() u: JwtPayload) {
    return this.svc.listMineSummary(u.sub);
  }

  @Get('me/status')
  status(@CurrentUser() u: JwtPayload) {
    return this.svc.myStatus(u.sub);
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
  uploadAcademic(
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
    return this.academic.uploadSemester({
      userId: u.sub,
      semester,
      fileBuffer: file.buffer,
      fileMime: file.mimetype,
      fileName: file.originalname,
    });
  }
}
