import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { PrismaService } from '../prisma/services/prisma.service';
import { AgentController } from './controllers/agent.controller';
import { AgentGateway } from './gateways/agent.gateway';
import { BlockService } from './services/block.service';
import { MastraAgentService } from './services/mastra-agent.service';
import { MessageService } from './services/message.service';
import { ThreadService } from './services/thread.service';

@Module({
  imports: [AuthModule],
  controllers: [AgentController],
  providers: [
    ThreadService,
    MessageService,
    BlockService,
    MastraAgentService,
    AgentGateway,
    PrismaService,
  ],
  exports: [ThreadService, MessageService, BlockService, MastraAgentService],
})
export class AgentModule {}
