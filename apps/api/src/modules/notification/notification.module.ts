import { Global, Module } from '@nestjs/common';

import { EmailPreferencesController } from './controllers/email-preferences.controller';
import { ResendWebhookController } from './controllers/resend-webhook.controller';
import { LifecycleEmailScheduler } from './lifecycle/lifecycle-email.scheduler';
import {
  EmailTransportService,
  NotificationService,
  PushNotificationService,
  TrainingReminderScheduler,
} from './services';
import { MetricThresholdScheduler } from './services/metric-threshold.scheduler';
import { ResendContactsService } from './services/resend-contacts.service';
import { WeeklyEmailService } from './weekly/weekly-email.service';

// Global: account code (sign-up, settings, deletion) keeps Resend contacts in
// step without importing this module
@Global()
@Module({
  providers: [
    EmailTransportService,
    ResendContactsService,
    NotificationService,
    PushNotificationService,
    TrainingReminderScheduler,
    LifecycleEmailScheduler,
    MetricThresholdScheduler,
    WeeklyEmailService,
  ],
  controllers: [EmailPreferencesController, ResendWebhookController],
  exports: [
    EmailTransportService,
    ResendContactsService,
    NotificationService,
    PushNotificationService,
    // Sent from the queue module, which spreads the sending
    WeeklyEmailService,
  ],
})
export class NotificationModule {}
