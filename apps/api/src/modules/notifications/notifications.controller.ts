import { Controller, Get, Param, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@skillverify/shared';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload) {
    return this.svc.list(u.sub);
  }

  @Post(':id/read')
  markRead(@CurrentUser() u: JwtPayload, @Param('id') id: string) {
    return this.svc.markRead(u.sub, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() u: JwtPayload) {
    return this.svc.markAllRead(u.sub);
  }
}
