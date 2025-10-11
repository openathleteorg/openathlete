import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CoreModule } from '../core/core.module';
import { PrismaService } from '../prisma/services/prisma.service';
import { AgentController } from './controllers/agent.controller';
import { AgentGateway } from './gateways/agent.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { BlockService } from './services/block.service';
import { MastraAgentService } from './services/mastra-agent.service';
import { MessageService } from './services/message.service';
import { ThreadService } from './services/thread.service';

@Module({
  imports: [AuthModule, CoreModule],
  controllers: [AgentController],
  providers: [
    ThreadService,
    MessageService,
    BlockService,
    MastraAgentService,
    AgentGateway,
    WsJwtAuthGuard,
    PrismaService,
  ],
  exports: [ThreadService, MessageService, BlockService, MastraAgentService],
})
export class AgentModule {}
