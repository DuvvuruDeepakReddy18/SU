import {
  BadRequestException,
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
import { CommunityPostCreateDto } from './dto';
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
    @Query('scope') scope: 'all' | 'mine' | undefined,
  ) {
    return this.svc.list({
      userId: u.sub,
      institutionId: u.institutionId ?? null,
      page,
      pageSize,
      scope: scope === 'mine' ? 'mine' : 'all',
    });
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: CommunityPostCreateDto) {
    return this.svc.create(u.sub, dto);
  }

  @Post(':id/like')
  like(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.toggleLike(u.sub, id);
  }

  @Delete(':id')
  remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.remove(u.sub, id);
  }

  // ---------- Comments ----------

  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.svc.listComments(id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() u: JwtPayload,
    @Param('id') id: string,
    @Body() body: { body: string; isAnonymous?: boolean },
  ) {
    if (!body?.body || body.body.trim().length < 1) {
      throw new BadRequestException('Comment body required');
    }
    if (body.body.length > 2000) {
      throw new BadRequestException('Comment too long (max 2000 chars)');
    }
    return this.svc.addComment(u.sub, id, body.body.trim(), !!body.isAnonymous);
  }

  @Delete('comments/:commentId')
  deleteComment(@CurrentUser() u: JwtPayload, @Param('commentId') commentId: string) {
    return this.svc.deleteComment(u.sub, commentId);
  }
}
