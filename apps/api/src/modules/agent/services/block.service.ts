import { Injectable, NotFoundException } from '@nestjs/common';

import { AgentMessageBlock, Prisma } from '@openathlete/database';
import { CreateBlockDto, UpdateBlockDto } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MessageService } from './message.service';

@Injectable()
export class BlockService {
  constructor(
    private prisma: PrismaService,
    private messageService: MessageService,
  ) {}

  async createBlock(
    user: AuthUser,
    messageId: number,
    dto: CreateBlockDto,
  ): Promise<AgentMessageBlock> {
    await this.messageService.getMessageById(user, messageId);

    const block = await this.prisma.agentMessageBlock.create({
      data: {
        messageId: messageId,
        type: dto.type,
        order: dto.order,
        content: dto.content,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
        status: dto.status || 'completed',
        error: dto.error,
        toolName: dto.toolName,
        toolInput: dto.toolInput
          ? (dto.toolInput as Prisma.InputJsonValue)
          : undefined,
        toolOutput: dto.toolOutput
          ? (dto.toolOutput as Prisma.InputJsonValue)
          : undefined,
        chartType: dto.chartType,
        chartData: dto.chartData
          ? (dto.chartData as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return block;
  }

  async getBlockById(
    user: AuthUser,
    blockId: number,
  ): Promise<AgentMessageBlock> {
    const block = await this.prisma.agentMessageBlock.findUnique({
      where: { blockId: blockId },
      include: {
        message: {
          include: {
            thread: true,
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }

    await this.messageService.getMessageById(user, block.messageId);

    return block;
  }

  async updateBlock(
    user: AuthUser,
    blockId: number,
    dto: UpdateBlockDto,
  ): Promise<AgentMessageBlock> {
    await this.getBlockById(user, blockId);

    const block = await this.prisma.agentMessageBlock.update({
      where: { blockId: blockId },
      data: {
        type: dto.type,
        content: dto.content,
        metadata: dto.metadata
          ? (dto.metadata as Prisma.InputJsonValue)
          : undefined,
        status: dto.status,
        error: dto.error,
        toolName: dto.toolName,
        toolInput: dto.toolInput
          ? (dto.toolInput as Prisma.InputJsonValue)
          : undefined,
        toolOutput: dto.toolOutput
          ? (dto.toolOutput as Prisma.InputJsonValue)
          : undefined,
        chartType: dto.chartType,
        chartData: dto.chartData
          ? (dto.chartData as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return block;
  }

  async deleteBlock(user: AuthUser, blockId: number): Promise<void> {
    await this.getBlockById(user, blockId);

    await this.prisma.agentMessageBlock.delete({
      where: { blockId: blockId },
    });
  }
}
