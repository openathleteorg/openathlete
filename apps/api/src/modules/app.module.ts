import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import {
  ActivityProcessingListener,
  NotificationListener,
  TrainingLoadListener,
  WorkoutSyncListener,
} from 'src/listeners';

import { AgentModule } from './agent/agent.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth';
import { CoreModule } from './core';
import { NotificationModule } from './notification';
import { ProvidersSyncModule } from './providers-sync/providers-sync.module';
import { QueueModule } from './queue';
import { PrismaService } from './prisma/services/prisma.service';

@Module({
  imports: [
    AuthModule,
    CoreModule,
    AgentModule,
    EventEmitterModule.forRoot(),
    NotificationModule,
    ProvidersSyncModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    NotificationListener,
    ActivityProcessingListener,
    TrainingLoadListener,
    WorkoutSyncListener,
  ],
})
export class AppModule {}
