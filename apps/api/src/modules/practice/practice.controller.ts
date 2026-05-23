import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { SUPPORTED_LANGUAGES } from '@skillverify/shared';
import { PracticeService } from './practice.service';
import { ProblemsQueryDto, SubmissionCreateDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@skillverify/shared';

const DraftReviewSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
  code: z.string().min(1).max(50_000),
});
class DraftReviewDto extends createZodDto(DraftReviewSchema) {}

@Controller('practice')
export class PracticeController {
  constructor(private readonly svc: PracticeService) {}

  @Public()
  @Get('problems')
  list(@Query(ZodValidationPipe) q: ProblemsQueryDto) {
    return this.svc.listProblems(q);
  }

  @Public()
  @Get('problems/:slug')
  detail(@Param('slug') slug: string) {
    return this.svc.getProblem(slug);
  }

  @Post('submissions')
  submit(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: SubmissionCreateDto) {
    return this.svc.submit(u.sub, dto);
  }

  @Get('submissions')
  list_mine(@CurrentUser() u: JwtPayload) {
    return this.svc.listSubmissions(u.sub);
  }

  @Get('submissions/:id')
  detail_submission(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.getSubmission(u.sub, id);
  }

  // --- AI helpers tied to a problem (no submission needed) ---

  @Post('problems/:slug/hint')
  hint(@Param('slug') slug: string) {
    return this.svc.problemHint(slug);
  }

  @Post('problems/:slug/explain')
  explain(@Param('slug') slug: string) {
    return this.svc.problemExplain(slug);
  }

  @Post('problems/:slug/review-draft')
  reviewDraft(@Param('slug') slug: string, @Body(ZodValidationPipe) dto: DraftReviewDto) {
    if (!dto.code.trim()) throw new BadRequestException('No code to review');
    return this.svc.reviewDraft(slug, dto.language, dto.code);
  }
}
