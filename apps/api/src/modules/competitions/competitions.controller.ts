import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import {
  AddRoundSchema,
  RoundStatusSchema,
  AddJudgeSchema,
  ScoreEntrySchema,
} from '@skillverify/shared';
import { CompetitionsService } from './competitions.service';
import { CompetitionCreateDto, CompetitionEnterDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

class AddRoundDto extends createZodDto(AddRoundSchema) {}
class RoundStatusDto extends createZodDto(RoundStatusSchema) {}
class AddJudgeDto extends createZodDto(AddJudgeSchema) {}
class ScoreEntryDto extends createZodDto(ScoreEntrySchema) {}

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

  // ---------- Rounds + jury scoring ----------

  /** Rounds with leaderboards. Public to anyone who can see the competition. */
  @Get(':id/rounds')
  rounds(@Param('id') id: string) {
    return this.svc.rounds(id);
  }

  @Post(':id/rounds')
  addRound(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: AddRoundDto,
  ) {
    return this.svc.addRound({ sub: u.sub, role: u.role }, id, dto);
  }

  @Patch('rounds/:roundId/status')
  setRoundStatus(
    @CurrentUser() u: JwtPayload,
    @Param('roundId') roundId: string,
    @Body(ZodValidationPipe) dto: RoundStatusDto,
  ) {
    return this.svc.setRoundStatus({ sub: u.sub, role: u.role }, roundId, dto.status);
  }

  @Post('rounds/:roundId/scores')
  scoreEntry(
    @CurrentUser() u: JwtPayload,
    @Param('roundId') roundId: string,
    @Body(ZodValidationPipe) dto: ScoreEntryDto,
  ) {
    return this.svc.scoreEntry({ sub: u.sub, role: u.role }, roundId, dto);
  }

  @Get(':id/judges')
  judges(@Param('id') id: string) {
    return this.svc.listJudges(id);
  }

  @Post(':id/judges')
  addJudge(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: AddJudgeDto,
  ) {
    return this.svc.addJudge({ sub: u.sub, role: u.role }, id, dto.userId);
  }

  @Delete(':id/judges/:userId')
  removeJudge(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.svc.removeJudge({ sub: u.sub, role: u.role }, id, userId);
  }
}
