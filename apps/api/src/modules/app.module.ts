import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import {
  ActivityProcessingListener,
  NotificationListener,
} from 'src/listeners';

import { AgentModule } from './agent/agent.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth';
import { CoreModule } from './core';
import { NotificationModule } from './notification';
import { PrismaService } from './prisma/services/prisma.service';

@Module({
  imports: [
    AuthModule,
    CoreModule,
    AgentModule,
    EventEmitterModule.forRoot(),
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [PrismaService, NotificationListener, ActivityProcessingListener],
})
export class AppModule {}
