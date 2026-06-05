import { Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationWorker } from './notification.worker';

// Global so any service can emit notifications by injecting NotificationsService
// without re-importing the module. Matches Prisma / Email / Storage.
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationWorker],
  exports: [NotificationsService],
})
export class NotificationsModule {}
