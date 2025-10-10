import { Injectable, NotFoundException } from '@nestjs/common';

import { agent_message_block } from '@openathlete/database';
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
  ): Promise<agent_message_block> {
    // Verify message access
    await this.messageService.getMessageById(user, messageId);

    const block = await this.prisma.agent_message_block.create({
      data: {
        message_id: messageId,
        type: dto.type,
        order: dto.order,
        content: dto.content,
        metadata: dto.metadata as any,
        status: dto.status || 'completed',
        error: dto.error,
        tool_name: dto.toolName,
        tool_input: dto.toolInput as any,
        tool_output: dto.toolOutput as any,
        chart_type: dto.chartType,
        chart_data: dto.chartData as any,
      },
    });

    // Keep snake_case for internal usage
    return block;
  }

  async getBlockById(
    user: AuthUser,
    blockId: number,
  ): Promise<agent_message_block> {
    const block = await this.prisma.agent_message_block.findUnique({
      where: { block_id: blockId },
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

    // Verify message access
    await this.messageService.getMessageById(user, block.message_id);

    // Keep snake_case for internal usage
    return block;
  }

  async updateBlock(
    user: AuthUser,
    blockId: number,
    dto: UpdateBlockDto,
  ): Promise<agent_message_block> {
    await this.getBlockById(user, blockId); // Check authorization

    const block = await this.prisma.agent_message_block.update({
      where: { block_id: blockId },
      data: {
        type: dto.type,
        content: dto.content,
        metadata: dto.metadata as any,
        status: dto.status,
        error: dto.error,
        tool_name: dto.toolName,
        tool_input: dto.toolInput as any,
        tool_output: dto.toolOutput as any,
        chart_type: dto.chartType,
        chart_data: dto.chartData as any,
      },
    });

    // Keep snake_case for internal usage
    return block;
  }

  async deleteBlock(user: AuthUser, blockId: number): Promise<void> {
    await this.getBlockById(user, blockId); // Check authorization

    await this.prisma.agent_message_block.delete({
      where: { block_id: blockId },
    });
  }
}
