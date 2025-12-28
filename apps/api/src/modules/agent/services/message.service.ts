import { Injectable, NotFoundException } from '@nestjs/common';

import { AgentMessage, Prisma } from '@openathlete/database';
import { CreateMessageDto } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ThreadService } from './thread.service';

const MESSAGE_INCLUDES = {
  blocks: {
    orderBy: { order: 'asc' as const },
  },
};

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private threadService: ThreadService,
  ) {}

  async createMessage(
    user: AuthUser,
    dto: CreateMessageDto,
  ): Promise<AgentMessage> {
    await this.threadService.getThreadById(user, dto.threadId);

    const message = await this.prisma.agentMessage.create({
      data: {
        threadId: dto.threadId,
        role: dto.role || 'USER',
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
        blocks: dto.blocks
          ? {
              create: dto.blocks.map((block) => ({
                type: block.type,
                order: block.order,
                content: block.content,
                metadata: (block.metadata || {}) as Prisma.InputJsonValue,
                status: block.status || 'completed',
                error: block.error,
                toolName: block.toolName,
                toolInput: block.toolInput
                  ? (block.toolInput as Prisma.InputJsonValue)
                  : undefined,
                toolOutput: block.toolOutput
                  ? (block.toolOutput as Prisma.InputJsonValue)
                  : undefined,
                chartType: block.chartType,
                chartData: block.chartData
                  ? (block.chartData as Prisma.InputJsonValue)
                  : undefined,
              })),
            }
          : undefined,
      },
      include: MESSAGE_INCLUDES,
    });

    return message;
  }

  async getMessageById(
    user: AuthUser,
    messageId: number,
  ): Promise<AgentMessage> {
    const message = await this.prisma.agentMessage.findUnique({
      where: { messageId: messageId },
      include: {
        ...MESSAGE_INCLUDES,
        thread: true,
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await this.threadService.getThreadById(user, message.threadId);

    return message;
  }

  async getThreadMessages(
    user: AuthUser,
    threadId: number,
  ): Promise<AgentMessage[]> {
    await this.threadService.getThreadById(user, threadId);

    const messages = await this.prisma.agentMessage.findMany({
      where: { threadId: threadId },
      include: MESSAGE_INCLUDES,
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async updateMessageStatus(
    user: AuthUser,
    messageId: number,
    status: 'pending' | 'processing' | 'completed' | 'error',
  ): Promise<AgentMessage> {
    await this.getMessageById(user, messageId);

    const updated = await this.prisma.agentMessage.update({
      where: { messageId: messageId },
      data: { status },
      include: MESSAGE_INCLUDES,
    });

    return updated;
  }

  async deleteMessage(user: AuthUser, messageId: number): Promise<void> {
    await this.getMessageById(user, messageId);

    await this.prisma.agentMessage.delete({
      where: { messageId: messageId },
    });
  }
}
