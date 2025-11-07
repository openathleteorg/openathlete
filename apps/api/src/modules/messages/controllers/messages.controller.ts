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

import type {
  CreateMessageThreadDto,
  CreateMessageThreadMessageDto,
  MarkMessagesAsReadDto,
  UpdateMessageThreadDto,
  UpdateMessageThreadMessageDto,
} from '@openathlete/shared';
import {
  createMessageThreadDtoSchema,
  createMessageThreadMessageDtoSchema,
  keysToCamel,
  markMessagesAsReadDtoSchema,
  updateMessageThreadDtoSchema,
  updateMessageThreadMessageDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { MessagesGateway } from '../gateways/messages.gateway';
import { MessageThreadService } from '../services/message-thread.service';
import { MessageService } from '../services/message.service';

@Controller('messages')
export class MessagesController {
  constructor(
    private threadService: MessageThreadService,
    private messageService: MessageService,
    private messagesGateway: MessagesGateway,
  ) {}

  // ==================== Thread Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('threads')
  async createThread(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMessageThreadDtoSchema))
    dto: CreateMessageThreadDto,
  ) {
    const thread = await this.threadService.createThread(user, dto);

    const threadWithParticipants = thread as typeof thread & {
      participants: Array<{ user_id: number }>;
    };
    const participantUserIds = threadWithParticipants.participants.map(
      (p) => p.user_id,
    );
    this.messagesGateway.broadcastToUsers(
      'thread_created',
      {
        messageThreadId: thread.message_thread_id,
      },
      participantUserIds,
    );

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
    @Body(new ZodValidationPipe(updateMessageThreadDtoSchema))
    dto: UpdateMessageThreadDto,
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
    @Body(new ZodValidationPipe(createMessageThreadMessageDtoSchema))
    dto: CreateMessageThreadMessageDto,
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
  @Put('messages/:messageId')
  async updateMessage(
    @JwtUser() user: AuthUser,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body(new ZodValidationPipe(updateMessageThreadMessageDtoSchema))
    dto: UpdateMessageThreadMessageDto,
  ) {
    const message = await this.messageService.updateMessage(
      user,
      messageId,
      dto,
    );
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

  // ==================== Read Receipt Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('threads/:threadId/read')
  async markMessagesAsRead(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body(new ZodValidationPipe(markMessagesAsReadDtoSchema))
    dto: MarkMessagesAsReadDto,
  ) {
    await this.messageService.markMessagesAsRead(user, {
      ...dto,
      messageThreadId: threadId,
    });
    return { success: true };
  }
}
