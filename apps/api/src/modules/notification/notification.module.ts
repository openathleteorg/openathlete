import { Module } from '@nestjs/common';

import { EmailPreferencesController } from './controllers/email-preferences.controller';
import { LifecycleEmailScheduler } from './lifecycle/lifecycle-email.scheduler';
import {
  EmailTransportService,
  NotificationService,
  PushNotificationService,
  TrainingReminderScheduler,
} from './services';
import { MetricThresholdScheduler } from './services/metric-threshold.scheduler';

@Module({
  providers: [
    EmailTransportService,
    NotificationService,
    PushNotificationService,
    TrainingReminderScheduler,
    LifecycleEmailScheduler,
    MetricThresholdScheduler,
  ],
  controllers: [EmailPreferencesController],
  exports: [
    EmailTransportService,
    NotificationService,
    PushNotificationService,
  ],
})
export class NotificationModule {}
