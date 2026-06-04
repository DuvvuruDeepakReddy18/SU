import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CompetitionsService } from './competitions.service';
import { CompetitionCreateDto, CompetitionEnterDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly svc: CompetitionsService) {}

  // Authenticated so we can scope institute-only competitions to the student's
  // own institution. Public competitions still show for everyone signed in.
  @Get()
  list(@CurrentUser() u: JwtPayload, @Query('category') category?: string) {
    return this.svc.list(category, u.institutionId ?? null);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: CompetitionCreateDto) {
    return this.svc.create(u.sub, dto);
  }

  @Post(':id/enter')
  enter(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: CompetitionEnterDto,
  ) {
    return this.svc.enter(u.sub, id, dto.submissionUrl);
  }
}
