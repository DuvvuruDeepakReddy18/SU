import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from 'nestjs-zod';
import { CollegeIdService } from '../verifications/college-id.service';
import { AcademicRecordService } from '../verifications/academic-record.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Roles } from '../../common/decorators/roles.decorator';

const RejectSchema = z.object({ reason: z.string().min(3).max(500) });
class RejectDto extends createZodDto(RejectSchema) {}

@Controller('admin')
@Roles('PLATFORM_ADMIN')
export class AdminController {
  constructor(
    private readonly collegeId: CollegeIdService,
    private readonly academic: AcademicRecordService,
    private readonly prisma: PrismaService,
  ) {}

  // ---- College ID verification queue ----

  @Get('verifications/college-ids')
  listCollegeIds(@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    return this.collegeId.listPending(limit);
  }

  @Post('verifications/college-ids/:userId/approve')
  approveCollegeId(@Param('userId') userId: string) {
    return this.collegeId.approve(userId);
  }

  @Post('verifications/college-ids/:userId/reject')
  rejectCollegeId(@Param('userId') userId: string, @Body(ZodValidationPipe) dto: RejectDto) {
    return this.collegeId.reject(userId, dto.reason);
  }

  // ---- Academic record verification queue ----

  @Get('verifications/academic-records')
  listPendingAcademic() {
    return this.prisma.academicRecord.findMany({
      where: { verificationStatus: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            email: true,
            studentProfile: { select: { governmentName: true, fullName: true } },
            institution: { select: { name: true } },
          },
        },
      },
    });
  }

  @Post('verifications/academic-records/:id/approve')
  approveAcademic(@Param('id') id: string) {
    return this.academic.approve(id);
  }

  @Post('verifications/academic-records/:id/reject')
  rejectAcademic(@Param('id') id: string, @Body(ZodValidationPipe) dto: RejectDto) {
    return this.academic.reject(id, dto.reason);
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
  async approveInstitution(@Param('id') id: string) {
    return this.prisma.institution.update({
      where: { id },
      data: { verified: true },
    });
  }

  @Post('institutions/:id/reject')
  async rejectInstitution(@Param('id') id: string) {
    return this.prisma.institution.delete({ where: { id } });
  }
}
