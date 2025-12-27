import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ApiEnvSchema } from '@openathlete/shared';

import {
  ActivityFeedbackExtractionListener,
  ActivityFeedbackListener,
  ActivityPushNotificationListener,
  NotificationListener,
  TrainingLoadListener,
  WorkoutSyncListener,
} from 'src/listeners';

import { AgentModule } from './agent/agent.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth';
import { CalendarModule } from './calendar/calendar.module';
import { CoreModule } from './core';
import { MessagesModule } from './messages/messages.module';
import { NotificationModule } from './notification';
import { PrismaService } from './prisma/services/prisma.service';
import { ProvidersSyncModule } from './providers-sync/providers-sync.module';
import { QueueModule } from './queue';
import { SubscriptionModule } from './subscription';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const result = ApiEnvSchema.safeParse(config);
        if (!result.success) {
          const errors = result.error.errors.map((err) => {
            const path = err.path.join('.');
            return `  - ${path}: ${err.message}`;
          });
          throw new Error(
            `Environment validation failed:\n${errors.join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`,
          );
        }
        return result.data;
      },
      validationOptions: {
        allowUnknown: false,
        abortEarly: false,
      },
    }),
    SentryModule.forRoot(),
    AuthModule,
    CoreModule,
    AgentModule,
    MessagesModule,
    CalendarModule,
    EventEmitterModule.forRoot(),
    NotificationModule,
    ProvidersSyncModule,
    QueueModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    PrismaService,
    NotificationListener,
    // Only register listeners that depend on activity processing
    // if ENABLE_ACTIVITY_PROCESSING is true so they run on the same instances.
    // Note: We use process.env here because ConfigService is not available
    // at module definition time. The value is validated by envValidationSchema.
    ...(process.env.ENABLE_ACTIVITY_PROCESSING === 'true'
      ? [
          TrainingLoadListener,
          ActivityFeedbackListener,
          ActivityPushNotificationListener,
        ]
      : []),
    ActivityFeedbackExtractionListener,
    WorkoutSyncListener,
  ],
})
export class AppModule {}
