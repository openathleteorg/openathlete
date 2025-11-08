import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, agent_message } from '@openathlete/database';
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
  ): Promise<agent_message> {
    await this.threadService.getThreadById(user, dto.threadId);

    const message = await this.prisma.agent_message.create({
      data: {
        thread_id: dto.threadId,
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
                tool_name: block.toolName,
                tool_input: block.toolInput
                  ? (block.toolInput as Prisma.InputJsonValue)
                  : undefined,
                tool_output: block.toolOutput
                  ? (block.toolOutput as Prisma.InputJsonValue)
                  : undefined,
                chart_type: block.chartType,
                chart_data: block.chartData
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
  ): Promise<agent_message> {
    const message = await this.prisma.agent_message.findUnique({
      where: { message_id: messageId },
      include: {
        ...MESSAGE_INCLUDES,
        thread: true,
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await this.threadService.getThreadById(user, message.thread_id);

    return message;
  }

  async getThreadMessages(
    user: AuthUser,
    threadId: number,
  ): Promise<agent_message[]> {
    await this.threadService.getThreadById(user, threadId);

    const messages = await this.prisma.agent_message.findMany({
      where: { thread_id: threadId },
      include: MESSAGE_INCLUDES,
      orderBy: { created_at: 'asc' },
    });

    return messages;
  }

  async updateMessageStatus(
    user: AuthUser,
    messageId: number,
    status: 'pending' | 'processing' | 'completed' | 'error',
  ): Promise<agent_message> {
    await this.getMessageById(user, messageId);

    const updated = await this.prisma.agent_message.update({
      where: { message_id: messageId },
      data: { status },
      include: MESSAGE_INCLUDES,
    });

    return updated;
  }

  async deleteMessage(user: AuthUser, messageId: number): Promise<void> {
    await this.getMessageById(user, messageId);

    await this.prisma.agent_message.delete({
      where: { message_id: messageId },
    });
  }
}
