import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import {
  NotificationListener,
  TrainingLoadListener,
  WorkoutSyncListener,
} from 'src/listeners';

import { AgentModule } from './agent/agent.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth';
import { CoreModule } from './core';
import { MessagesModule } from './messages/messages.module';
import { NotificationModule } from './notification';
import { PrismaService } from './prisma/services/prisma.service';
import { ProvidersSyncModule } from './providers-sync/providers-sync.module';
import { QueueModule } from './queue';

@Module({
  imports: [
    AuthModule,
    CoreModule,
    AgentModule,
    MessagesModule,
    EventEmitterModule.forRoot(),
    NotificationModule,
    ProvidersSyncModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    NotificationListener,
    TrainingLoadListener,
    WorkoutSyncListener,
  ],
})
export class AppModule {}
