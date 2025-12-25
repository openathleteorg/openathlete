import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/services/prisma.service';
import { NotificationService, PushNotificationService } from './services';

@Module({
  providers: [NotificationService, PushNotificationService, PrismaService],
  controllers: [],
  exports: [NotificationService, PushNotificationService],
})
export class NotificationModule {}
