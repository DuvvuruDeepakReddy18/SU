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
import { CommunityPostCreateDto, CommunityCommentCreateDto } from './dto';
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
    @Query('subreddit') subreddit: string | undefined,
    @Query('sort') sort: 'hot' | 'new' | 'top' | undefined,
  ) {
    return this.svc.list({
      userId: u.sub,
      institutionId: u.institutionId ?? null,
      page,
      pageSize,
      scope: scope === 'mine' ? 'mine' : 'all',
      subreddit: subreddit?.toLowerCase() || null,
      sort: sort && ['hot', 'new', 'top'].includes(sort) ? sort : 'new',
    });
  }

  @Get('subreddits')
  subreddits() {
    return this.svc.listSubreddits();
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body(ZodValidationPipe) dto: CommunityPostCreateDto) {
    return this.svc.create(u.sub, dto);
  }

  /**
   * Toggle a vote. Body: `{ value: 1 }` to upvote, `{ value: -1 }` to
   * downvote. Sending the same value twice removes the vote.
   */
  @Post(':id/vote')
  vote(@CurrentUser() u: JwtPayload, @Param('id') id: string, @Body() body: { value: 1 | -1 }) {
    if (body?.value !== 1 && body?.value !== -1) {
      throw new BadRequestException('value must be 1 or -1');
    }
    return this.svc.vote(u.sub, id, body.value);
  }

  // Back-compat alias for the old like-only UI.
  @Post(':id/like')
  like(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.vote(u.sub, id, 1);
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
    @Body(ZodValidationPipe) dto: CommunityCommentCreateDto,
  ) {
    return this.svc.addComment(u.sub, id, dto);
  }

  @Delete('comments/:commentId')
  deleteComment(@CurrentUser() u: JwtPayload, @Param('commentId') commentId: string) {
    return this.svc.deleteComment(u.sub, commentId);
  }
}
