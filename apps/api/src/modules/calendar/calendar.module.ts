import { Module } from '@nestjs/common';

import { WsJwtAuthGuard } from '../agent/guards/ws-jwt-auth.guard';
import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { CalendarGateway } from './gateways/calendar.gateway';
import { CalendarWebSocketService } from './services/calendar-websocket.service';

@Module({
  imports: [AuthModule, WebSocketModule],
  providers: [
    CalendarGateway,
    CalendarWebSocketService,
    WsJwtAuthGuard,
    PrismaService,
  ],
  exports: [CalendarGateway, CalendarWebSocketService],
})
export class CalendarModule {}
