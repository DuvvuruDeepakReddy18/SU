import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('messages')
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Get()
  listThreads(@CurrentUser() u: JwtPayload) {
    return this.svc.listThreads(u.sub);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() u: JwtPayload) {
    return this.svc.unreadCount(u.sub).then((n) => ({ count: n }));
  }

  @Get('with/:userId')
  thread(@CurrentUser() u: JwtPayload, @Param('userId') userId: string) {
    return this.svc.thread(u.sub, userId);
  }

  @Post('with/:userId')
  send(
    @CurrentUser() u: JwtPayload,
    @Param('userId') userId: string,
    @Body() body: { body: string },
  ) {
    if (!body?.body) throw new BadRequestException('body is required');
    return this.svc.send(u.sub, userId, body.body);
  }

  @Delete(':id')
  remove(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.deleteOwn(u.sub, id);
  }
}
