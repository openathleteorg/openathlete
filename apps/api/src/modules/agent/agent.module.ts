import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core/core.module';
import { PrismaService } from '../prisma/services/prisma.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { AIFeaturesController } from './controllers/ai-features.controller';
import { ChatAgentController } from './controllers/chat-agent.controller';
import { AgentGateway } from './gateways/agent.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { BlockService } from './services/block.service';
import { EventGenerationService } from './services/event-generation.service';
import { EventModificationService } from './services/event-modification.service';
import { MastraAgentService } from './services/mastra-agent.service';
import { MessageService } from './services/message.service';
import { ThreadService } from './services/thread.service';

@Module({
  imports: [AuthModule, CoreModule, WebSocketModule],
  controllers: [ChatAgentController, AIFeaturesController],
  providers: [
    ThreadService,
    MessageService,
    BlockService,
    MastraAgentService,
    EventGenerationService,
    EventModificationService,
    AgentGateway,
    WsJwtAuthGuard,
    PrismaService,
  ],
  exports: [ThreadService, MessageService, BlockService, MastraAgentService],
})
export class AgentModule {}
