import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { WsJwtAuthGuard } from '../messages/guards/ws-jwt-auth.guard';
import { WebSocketModule } from '../websocket/websocket.module';
import { CalendarGateway } from './gateways/calendar.gateway';
import { CalendarWebSocketService } from './services/calendar-websocket.service';

@Module({
  imports: [AuthModule, WebSocketModule],
  providers: [CalendarGateway, CalendarWebSocketService, WsJwtAuthGuard],
  exports: [CalendarGateway, CalendarWebSocketService],
})
export class CalendarModule {}
