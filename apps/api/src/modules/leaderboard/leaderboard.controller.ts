import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
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
}
