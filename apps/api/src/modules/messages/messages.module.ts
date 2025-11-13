import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core/core.module';
import { PrismaService } from '../prisma/services/prisma.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { MessagesController } from './controllers/messages.controller';
import { MessagesGateway } from './gateways/messages.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { MessageService } from './services/message.service';
import { MessageThreadService } from './services/message-thread.service';

@Module({
  imports: [AuthModule, forwardRef(() => CoreModule), WebSocketModule],
  controllers: [MessagesController],
  providers: [
    MessageThreadService,
    MessageService,
    MessagesGateway,
    WsJwtAuthGuard,
    PrismaService,
  ],
  exports: [MessageThreadService, MessageService],
})
export class MessagesModule {}

