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
import { WeeklyEmailService } from './weekly/weekly-email.service';

@Module({
  providers: [
    EmailTransportService,
    NotificationService,
    PushNotificationService,
    TrainingReminderScheduler,
    LifecycleEmailScheduler,
    MetricThresholdScheduler,
    WeeklyEmailService,
  ],
  controllers: [EmailPreferencesController],
  exports: [
    EmailTransportService,
    NotificationService,
    PushNotificationService,
    // Sent from the queue module, which spreads the sending
    WeeklyEmailService,
  ],
})
export class NotificationModule {}
