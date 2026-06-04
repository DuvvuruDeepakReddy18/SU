import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly svc: LeaderboardService) {}

  @Public()
  @Get()
  get(
    @Query('scope', new DefaultValuePipe('global')) scope: string,
    @Query('id') id: string | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
  ) {
    const fullScope = id ? `${scope}:${id}` : scope;
    return this.svc.get(fullScope, page, pageSize);
  }

  /**
   * Per-skill leaderboard. Ranks by highest verification layer in that skill,
   * with practice points as the tiebreaker. Optionally scoped to a single
   * institution via `?institutionId=`.
   */
  @Public()
  @Get('skill')
  getSkill(
    @Query('skillId') skillId: string,
    @Query('institutionId') institutionId: string | undefined,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
  ) {
    if (!skillId) throw new BadRequestException('skillId is required');
    return this.svc.getSkill(skillId, institutionId || null, limit);
  }
}
