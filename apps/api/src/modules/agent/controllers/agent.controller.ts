import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CreateBlockDto,
  CreateMessageDto,
  CreateThreadDto,
  SendMessageDto,
  UpdateBlockDto,
  UpdateThreadDto,
  createBlockDtoSchema,
  createMessageDtoSchema,
  createThreadDtoSchema,
  keysToCamel,
  sendMessageDtoSchema,
  updateBlockDtoSchema,
  updateThreadDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { BlockService } from '../services/block.service';
import { MastraAgentService } from '../services/mastra-agent.service';
import { MessageService } from '../services/message.service';
import { ThreadService } from '../services/thread.service';

@Controller('agent')
export class AgentController {
  constructor(
    private threadService: ThreadService,
    private messageService: MessageService,
    private blockService: BlockService,
    private mastraAgentService: MastraAgentService,
  ) {}

  // ==================== Thread Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('threads')
  async createThread(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createThreadDtoSchema)) dto: CreateThreadDto,
  ) {
    const thread = await this.threadService.createThread(user, dto);
    return keysToCamel(thread);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('threads')
  async getUserThreads(@JwtUser() user: AuthUser) {
    const threads = await this.threadService.getUserThreads(user);
    return threads.map(keysToCamel);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('threads/:threadId')
  async getThreadById(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    const thread = await this.threadService.getThreadById(user, threadId);
    return keysToCamel(thread);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Put('threads/:threadId')
  async updateThread(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body(new ZodValidationPipe(updateThreadDtoSchema)) dto: UpdateThreadDto,
  ) {
    const thread = await this.threadService.updateThread(user, threadId, dto);
    return keysToCamel(thread);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete('threads/:threadId')
  deleteThread(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    return this.threadService.deleteThread(user, threadId);
  }

  // ==================== Message Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('messages')
  async createMessage(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMessageDtoSchema)) dto: CreateMessageDto,
  ) {
    const message = await this.messageService.createMessage(user, dto);
    return keysToCamel(message);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('threads/:threadId/messages')
  async getThreadMessages(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    const messages = await this.messageService.getThreadMessages(
      user,
      threadId,
    );
    return messages.map(keysToCamel);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('messages/:messageId')
  async getMessageById(
    @JwtUser() user: AuthUser,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    const message = await this.messageService.getMessageById(user, messageId);
    return keysToCamel(message);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete('messages/:messageId')
  deleteMessage(
    @JwtUser() user: AuthUser,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.deleteMessage(user, messageId);
  }

  // ==================== Block Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('messages/:messageId/blocks')
  async createBlock(
    @JwtUser() user: AuthUser,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body(new ZodValidationPipe(createBlockDtoSchema)) dto: CreateBlockDto,
  ) {
    const block = await this.blockService.createBlock(user, messageId, dto);
    return keysToCamel(block);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('blocks/:blockId')
  async getBlockById(
    @JwtUser() user: AuthUser,
    @Param('blockId', ParseIntPipe) blockId: number,
  ) {
    const block = await this.blockService.getBlockById(user, blockId);
    return keysToCamel(block);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Put('blocks/:blockId')
  async updateBlock(
    @JwtUser() user: AuthUser,
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body(new ZodValidationPipe(updateBlockDtoSchema)) dto: UpdateBlockDto,
  ) {
    const block = await this.blockService.updateBlock(user, blockId, dto);
    return keysToCamel(block);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete('blocks/:blockId')
  deleteBlock(
    @JwtUser() user: AuthUser,
    @Param('blockId', ParseIntPipe) blockId: number,
  ) {
    return this.blockService.deleteBlock(user, blockId);
  }

  // ==================== Agent Chat Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('threads/:threadId/chat')
  async sendMessage(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body(new ZodValidationPipe(sendMessageDtoSchema)) dto: SendMessageDto,
  ) {
    // This will be handled by WebSocket for streaming
    // This REST endpoint is for non-streaming requests
    return this.mastraAgentService.processMessage(user, threadId, dto.content);
  }
}
