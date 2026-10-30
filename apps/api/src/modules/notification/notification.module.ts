import { Module } from '@nestjs/common';

import {
  EmailTransportService,
  NotificationService,
  PushNotificationService,
  TrainingReminderScheduler,
} from './services';

@Module({
  providers: [
    EmailTransportService,
    NotificationService,
    PushNotificationService,
    TrainingReminderScheduler,
  ],
  controllers: [],
  exports: [
    EmailTransportService,
    NotificationService,
    PushNotificationService,
  ],
})
export class NotificationModule {}
