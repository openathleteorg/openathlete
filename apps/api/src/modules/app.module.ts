import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import {
  ActivityFeedbackExtractionListener,
  ActivityFeedbackListener,
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
    ...(process.env.ENABLE_ACTIVITY_PROCESSING === 'true'
      ? [TrainingLoadListener, ActivityFeedbackListener]
      : []),
    ActivityFeedbackExtractionListener,
    WorkoutSyncListener,
  ],
})
export class AppModule {}
