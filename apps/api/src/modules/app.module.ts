import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from 'src/common/config/validate-env';
import { AppThrottlerGuard } from 'src/common/security/app-throttler.guard';
import { DEFAULT_RATE_LIMIT } from 'src/common/security/rate-limits';
import {
  ActivityFeedbackExtractionListener,
  ActivityFeedbackListener,
  ActivityPushNotificationListener,
  NotificationListener,
  TrainingLoadListener,
  WorkoutSyncListener,
} from 'src/listeners';

import { AgentModule } from './agent/agent.module';
import { AiModule } from './ai';
import { AppController } from './app.controller';
import { AuthModule } from './auth';
import { CalendarModule } from './calendar/calendar.module';
import { CoreModule } from './core';
import { InstanceModule } from './instance/instance.module';
import { McpModule } from './mcp/mcp.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationModule } from './notification';
import { PrismaService } from './prisma/services/prisma.service';
import { ProvidersSyncModule } from './providers-sync/providers-sync.module';
import { QueueModule } from './queue';
import { SeoPlanModule } from './seo/seo-plan.module';
import { SubscriptionModule } from './subscription';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      validationOptions: {
        allowUnknown: false,
        abortEarly: false,
      },
    }),
    SentryModule.forRoot(),
    ThrottlerModule.forRoot(DEFAULT_RATE_LIMIT),
    AuthModule,
    CoreModule,
    InstanceModule,
    AgentModule,
    AiModule,
    McpModule,
    MessagesModule,
    CalendarModule,
    EventEmitterModule.forRoot(),
    NotificationModule,
    ProvidersSyncModule,
    QueueModule,
    SeoPlanModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
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
