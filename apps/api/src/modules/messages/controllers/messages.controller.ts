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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(
    private threadService: MessageThreadService,
    private messageService: MessageService,
    private messagesGateway: MessagesGateway,
  ) {}

  // ==================== Thread Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('threads')
  @ApiOperation({
    summary: 'Create a new message thread',
    description:
      'Creates a new message thread for communication between users. If linked to a training session (eventActivityId), automatically adds the athlete and all their coaches as participants and verifies access. If no title is provided, generates one from participant names or the training session name. The authenticated user must include themselves in participantUserIds. Broadcasts a thread_created event via WebSocket to all participants.',
  })
  @ApiBody({
    description: 'Thread creation data',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          nullable: true,
          description:
            'Thread title (auto-generated from participants or training session name if not provided)',
          example: 'Discussion about Morning Run',
        },
        eventActivityId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the training session to link the thread to (optional). If provided, automatically adds athlete and coaches as participants.',
          example: 123,
        },
        participantUserIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Array of user IDs to include as participants. Must include the authenticated user.',
          example: [1, 2],
          minItems: 1,
        },
      },
      required: ['participantUserIds'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Thread created successfully',
    schema: {
      type: 'object',
      properties: {
        messageThreadId: { type: 'number', example: 1 },
        title: {
          type: 'string',
          nullable: true,
          example: 'Discussion about Morning Run',
        },
        eventActivityId: { type: 'number', nullable: true, example: 123 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              messageThreadParticipantId: { type: 'number' },
              userId: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  userId: { type: 'number' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - user must include themselves as participant',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - no access to the training session',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - training session not found',
  })
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
  @ApiBearerAuth()
  @Get('threads')
  @ApiOperation({
    summary: 'Get all message threads for the authenticated user',
    description:
      'Retrieves all message threads where the authenticated user is a participant. Threads are ordered by most recently updated first. Each thread includes participants, messages, and read receipts.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of threads retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          messageThreadId: { type: 'number', example: 1 },
          title: {
            type: 'string',
            nullable: true,
            example: 'Discussion about Morning Run',
          },
          eventActivityId: { type: 'number', nullable: true, example: 123 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          participants: { type: 'array' },
          messages: { type: 'array' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  async getUserThreads(@JwtUser() user: AuthUser) {
    const threads = await this.threadService.getUserThreads(user);
    return threads.map(keysToCamel);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('threads/:threadId')
  @ApiOperation({
    summary: 'Get a message thread by ID',
    description:
      'Retrieves a specific message thread by ID. Only participants can access the thread. The thread includes all participants, messages (ordered by creation date), and read receipts. Does not automatically mark messages as read - use the mark as read endpoint for that.',
  })
  @ApiParam({
    name: 'threadId',
    type: Number,
    description: 'ID of the thread to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Thread retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messageThreadId: { type: 'number', example: 1 },
        title: {
          type: 'string',
          nullable: true,
          example: 'Discussion about Morning Run',
        },
        eventActivityId: { type: 'number', nullable: true, example: 123 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        participants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              messageThreadParticipantId: { type: 'number' },
              userId: { type: 'number' },
              lastReadAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              user: {
                type: 'object',
                properties: {
                  userId: { type: 'number' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              messageId: { type: 'number' },
              content: { type: 'string' },
              senderId: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              sender: {
                type: 'object',
                properties: {
                  userId: { type: 'number' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                },
              },
              readReceipts: { type: 'array' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a participant in this thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - thread not found',
  })
  async getThreadById(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    const thread = await this.threadService.getThreadById(user, threadId);
    return keysToCamel(thread);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Put('threads/:threadId')
  @ApiOperation({
    summary: 'Update a message thread',
    description:
      'Updates a message thread (currently only the title can be updated). Only participants can update the thread.',
  })
  @ApiParam({
    name: 'threadId',
    type: Number,
    description: 'ID of the thread to update',
    example: 1,
  })
  @ApiBody({
    description: 'Thread update data',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          nullable: true,
          description: 'New thread title',
          example: 'Updated Discussion Title',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Thread updated successfully',
    schema: {
      type: 'object',
      properties: {
        messageThreadId: { type: 'number', example: 1 },
        title: {
          type: 'string',
          nullable: true,
          example: 'Updated Discussion Title',
        },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a participant in this thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - thread not found',
  })
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
  @ApiBearerAuth()
  @Delete('threads/:threadId')
  @ApiOperation({
    summary: 'Delete a message thread',
    description:
      'Permanently deletes a message thread and all its messages. Only participants can delete the thread. This operation cannot be undone.',
  })
  @ApiParam({
    name: 'threadId',
    type: Number,
    description: 'ID of the thread to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Thread deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a participant in this thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - thread not found',
  })
  deleteThread(
    @JwtUser() user: AuthUser,
    @Param('threadId', ParseIntPipe) threadId: number,
  ) {
    return this.threadService.deleteThread(user, threadId);
  }

  // ==================== Message Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('messages')
  @ApiOperation({
    summary: 'Create a new message in a thread',
    description:
      "Creates a new message in an existing thread. Verifies that the user is a participant in the thread. If the thread is linked to a training session, verifies access to the training session. Updates the thread's updated_at timestamp. Message content is limited to 10,000 characters.",
  })
  @ApiBody({
    description: 'Message creation data',
    schema: {
      type: 'object',
      properties: {
        messageThreadId: {
          type: 'number',
          description: 'ID of the thread to post the message in',
          example: 1,
        },
        content: {
          type: 'string',
          description: 'Message content (1-10,000 characters)',
          example: 'Great workout today!',
          minLength: 1,
          maxLength: 10000,
        },
      },
      required: ['messageThreadId', 'content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Message created successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'number', example: 1 },
        messageThreadId: { type: 'number', example: 1 },
        senderId: { type: 'number', example: 1 },
        content: { type: 'string', example: 'Great workout today!' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        sender: {
          type: 'object',
          properties: {
            userId: { type: 'number' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
          },
        },
        readReceipts: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a participant in this thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - thread not found',
  })
  async createMessage(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMessageThreadMessageDtoSchema))
    dto: CreateMessageThreadMessageDto,
  ) {
    const message = await this.messageService.createMessage(user, dto);
    return keysToCamel(message);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('threads/:threadId/messages')
  @ApiOperation({
    summary: 'Get all messages in a thread',
    description:
      'Retrieves all messages in a specific thread, ordered by creation date (oldest first). Only participants can access the messages. Each message includes sender information and read receipts.',
  })
  @ApiParam({
    name: 'threadId',
    type: Number,
    description: 'ID of the thread to retrieve messages from',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of messages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          messageId: { type: 'number', example: 1 },
          messageThreadId: { type: 'number', example: 1 },
          senderId: { type: 'number', example: 1 },
          content: { type: 'string', example: 'Great workout today!' },
          editedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          sender: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
            },
          },
          readReceipts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                messageReadReceiptId: { type: 'number' },
                messageId: { type: 'number' },
                userId: { type: 'number' },
                readAt: { type: 'string', format: 'date-time' },
                user: {
                  type: 'object',
                  properties: {
                    userId: { type: 'number' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a participant in this thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - thread not found',
  })
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
  @ApiBearerAuth()
  @Get('messages/:messageId')
  @ApiOperation({
    summary: 'Get a message by ID',
    description:
      "Retrieves a specific message by ID. Only participants of the message's thread can access it. The message includes sender information and read receipts.",
  })
  @ApiParam({
    name: 'messageId',
    type: Number,
    description: 'ID of the message to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Message retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'number', example: 1 },
        messageThreadId: { type: 'number', example: 1 },
        senderId: { type: 'number', example: 1 },
        content: { type: 'string', example: 'Great workout today!' },
        editedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        sender: {
          type: 'object',
          properties: {
            userId: { type: 'number' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
          },
        },
        readReceipts: { type: 'array' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user cannot access this message',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - message not found',
  })
  async getMessageById(
    @JwtUser() user: AuthUser,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    const message = await this.messageService.getMessageById(user, messageId);
    return keysToCamel(message);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Put('messages/:messageId')
  @ApiOperation({
    summary: 'Update a message',
    description:
      'Updates a message (only the content can be updated). Only the message sender can edit their own messages. Sets the edited_at timestamp when a message is updated. Message content is limited to 10,000 characters.',
  })
  @ApiParam({
    name: 'messageId',
    type: Number,
    description: 'ID of the message to update',
    example: 1,
  })
  @ApiBody({
    description: 'Message update data',
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Updated message content (1-10,000 characters)',
          example: 'Updated message content',
          minLength: 1,
          maxLength: 10000,
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Message updated successfully',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'number', example: 1 },
        content: { type: 'string', example: 'Updated message content' },
        editedAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user can only edit their own messages',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - message not found',
  })
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
  @ApiBearerAuth()
  @Delete('messages/:messageId')
  @ApiOperation({
    summary: 'Delete a message',
    description:
      'Permanently deletes a message. Only the message sender can delete their own messages. This operation cannot be undone.',
  })
  @ApiParam({
    name: 'messageId',
    type: Number,
    description: 'ID of the message to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user can only delete their own messages',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - message not found',
  })
  deleteMessage(
    @JwtUser() user: AuthUser,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.deleteMessage(user, messageId);
  }

  // ==================== Read Receipt Routes ====================

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('threads/:threadId/read')
  @ApiOperation({
    summary: 'Mark messages as read',
    description:
      "Marks messages in a thread as read by the authenticated user. If messageIds is provided, only those specific messages are marked as read. If messageIds is empty or not provided, all unread messages in the thread (except the user's own messages) are marked as read. Also updates the participant's last_read_at timestamp. Read receipts are created for each marked message.",
  })
  @ApiParam({
    name: 'threadId',
    type: Number,
    description: 'ID of the thread containing the messages to mark as read',
    example: 1,
  })
  @ApiBody({
    description: 'Read receipt data',
    schema: {
      type: 'object',
      properties: {
        messageThreadId: {
          type: 'number',
          description: 'ID of the thread (should match threadId in path)',
          example: 1,
        },
        messageIds: {
          type: 'array',
          items: { type: 'number' },
          nullable: true,
          description:
            'Specific message IDs to mark as read. If empty or not provided, all unread messages in the thread are marked as read.',
          example: [1, 2, 3],
        },
      },
      required: ['messageThreadId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not a participant in this thread',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - thread not found',
  })
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
