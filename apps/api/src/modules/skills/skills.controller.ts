import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { SkillsService } from './skills.service';
import {
  ClaimSkillDto,
  ClaimCustomSkillDto,
  UpdateUserSkillDto,
  SkillsCatalogQueryDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Public()
  @Get('catalog')
  catalog(@Query(ZodValidationPipe) q: SkillsCatalogQueryDto) {
    return this.skills.catalog(q);
  }

  @Get('me')
  mine(@CurrentUser() u: JwtPayload) {
    return this.skills.listMine(u.sub);
  }

  @Post('me')
  claim(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: ClaimSkillDto) {
    return this.skills.claim(u.sub, dto);
  }

  // Claim a skill not in the catalog (creates it under "Custom", then claims).
  @Post('me/custom')
  claimCustom(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: ClaimCustomSkillDto) {
    return this.skills.claimCustom(u.sub, dto.name, dto.selfRatedLevel);
  }

  @Patch('me/:id')
  update(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: UpdateUserSkillDto,
  ) {
    return this.skills.updateRating(u.sub, id, dto);
  }

  @Delete('me/:id')
  remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.skills.remove(u.sub, id);
  }
}
