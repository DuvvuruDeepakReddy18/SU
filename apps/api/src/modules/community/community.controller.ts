import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CommunityService } from './community.service';
import { CommunityPostCreateDto, CommunityVoteDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('community/posts')
export class CommunityController {
  constructor(private readonly svc: CommunityService) {}

  @Get()
  list(
    @CurrentUser() u: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.svc.list({ userId: u.sub, institutionId: u.institutionId ?? null, page, pageSize });
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: CommunityPostCreateDto) {
    return this.svc.create(u.sub, dto);
  }

  @Post(':id/vote')
  vote(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body(ZodValidationPipe) dto: CommunityVoteDto,
  ) {
    return this.svc.vote(u.sub, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.remove(u.sub, id);
  }
}
