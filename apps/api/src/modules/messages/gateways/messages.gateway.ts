import { Server, Socket } from 'socket.io';
import { z } from 'zod';

import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import type {
  CreateMessageThreadMessageDto,
  MarkMessagesAsReadDto,
  UpdateMessageThreadMessageDto,
} from '@openathlete/shared';
import {
  createMessageThreadMessageDtoSchema,
  markMessagesAsReadDtoSchema,
  updateMessageThreadMessageDtoSchema,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { WsJwtAuthGuard } from '../guards/ws-jwt-auth.guard';
import { WsZodValidationPipe } from '../pipes/ws-zod-validation.pipe';
import { MessageThreadService } from '../services/message-thread.service';
import { MessageService } from '../services/message.service';

@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/messages',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Map to track user sockets: userId -> Set of socket IDs
  private userSockets = new Map<number, Set<string>>();

  constructor(
    private messageService: MessageService,
    private threadService: MessageThreadService,
  ) {}

  handleConnection(client: Socket) {
    // Authentication happens on first message, not on connection
  }

  /**
   * Authenticate user and setup their socket room for direct messaging
   */
  private authenticateAndSetupUser(client: Socket, user: AuthUser) {
    if (!this.userSockets.has(user.user_id)) {
      this.userSockets.set(user.user_id, new Set());
    }
    this.userSockets.get(user.user_id)!.add(client.id);
    client.join(`user:${user.user_id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody(new WsZodValidationPipe(createMessageThreadMessageDtoSchema))
    data: CreateMessageThreadMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { messageThreadId, content } = data;

    try {
      // Extract authenticated user from socket (set by WsJwtAuthGuard)
      const user = client.data.user as AuthUser;

      if (!user) {
        console.error('[MessagesGateway] User not authenticated');
        client.emit('message_error', {
          error: 'Unauthorized: User not authenticated',
          messageThreadId,
        });
        return;
      }

      if (!this.userSockets.get(user.user_id)?.has(client.id)) {
        this.authenticateAndSetupUser(client, user);
      }

      const createdMessage = await this.messageService.createMessage(user, {
        messageThreadId,
        content,
      });

      const fullMessage = await this.messageService.getMessageById(
        user,
        createdMessage.message_id,
      );

      const thread = await this.threadService.getThreadById(
        user,
        messageThreadId,
      );
      const threadWithParticipants = thread as typeof thread & {
        participants: Array<{ user_id: number }>;
      };

      const messagePayload = {
        message: {
          messageId: fullMessage.message_id,
          messageThreadId: fullMessage.message_thread_id,
          senderId: fullMessage.sender_id,
          content: fullMessage.content,
          createdAt: fullMessage.created_at.toISOString(),
          updatedAt: fullMessage.updated_at.toISOString(),
          editedAt: fullMessage.edited_at?.toISOString(),
          sender: {
            userId: fullMessage.sender.user_id,
            firstName: fullMessage.sender.first_name,
            lastName: fullMessage.sender.last_name,
            email: fullMessage.sender.email,
          },
          readReceipts: fullMessage.read_receipts?.map((rr) => ({
            messageReadReceiptId: rr.message_read_receipt_id,
            messageId: rr.message_id,
            userId: rr.user_id,
            readAt: rr.read_at.toISOString(),
            user: rr.user
              ? {
                  userId: rr.user.user_id,
                  firstName: rr.user.first_name,
                  lastName: rr.user.last_name,
                  email: rr.user.email,
                }
              : undefined,
          })),
        },
      };

      const participantUserIds = threadWithParticipants.participants.map(
        (p) => p.user_id,
      );
      this.broadcastToUsers('new_message', messagePayload, participantUserIds);
      this.broadcastToThread(messageThreadId, 'new_message', messagePayload);
      this.server.emit('thread_updated', { messageThreadId });

      client.emit('message_sent', {
        messageThreadId,
        messageId: createdMessage.message_id,
      });
    } catch (error) {
      console.error('[MessagesGateway] Error sending message:', error);
      client.emit('message_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageThreadId,
      });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('update_message')
  async handleUpdateMessage(
    @MessageBody(
      new WsZodValidationPipe(
        updateMessageThreadMessageDtoSchema.extend({
          messageId: z.number().int().positive(),
        }),
      ),
    )
    data: UpdateMessageThreadMessageDto & { messageId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { messageId, content } = data;

    try {
      const user = client.data.user as AuthUser;

      if (!user) {
        client.emit('message_error', {
          error: 'Unauthorized: User not authenticated',
        });
        return;
      }

      if (!this.userSockets.get(user.user_id)?.has(client.id)) {
        this.authenticateAndSetupUser(client, user);
      }

      const message = await this.messageService.updateMessage(user, messageId, {
        content,
      });

      const fullMessage = await this.messageService.getMessageById(
        user,
        message.message_id,
      );

      const thread = await this.threadService.getThreadById(
        user,
        message.message_thread_id,
      );
      const threadWithParticipants = thread as typeof thread & {
        participants: Array<{ user_id: number }>;
      };

      const messagePayload = {
        message: {
          messageId: fullMessage.message_id,
          messageThreadId: fullMessage.message_thread_id,
          senderId: fullMessage.sender_id,
          content: fullMessage.content,
          createdAt: fullMessage.created_at.toISOString(),
          updatedAt: fullMessage.updated_at.toISOString(),
          editedAt: fullMessage.edited_at?.toISOString(),
          sender: {
            userId: fullMessage.sender.user_id,
            firstName: fullMessage.sender.first_name,
            lastName: fullMessage.sender.last_name,
            email: fullMessage.sender.email,
          },
          readReceipts: fullMessage.read_receipts?.map((rr) => ({
            messageReadReceiptId: rr.message_read_receipt_id,
            messageId: rr.message_id,
            userId: rr.user_id,
            readAt: rr.read_at.toISOString(),
            user: rr.user
              ? {
                  userId: rr.user.user_id,
                  firstName: rr.user.first_name,
                  lastName: rr.user.last_name,
                  email: rr.user.email,
                }
              : undefined,
          })),
        },
      };

      const participantUserIds = threadWithParticipants.participants.map(
        (p) => p.user_id,
      );
      this.broadcastToUsers(
        'message_updated',
        messagePayload,
        participantUserIds,
      );
      this.broadcastToThread(
        message.message_thread_id,
        'message_updated',
        messagePayload,
      );
      this.server.emit('thread_updated', {
        messageThreadId: message.message_thread_id,
      });

      client.emit('message_updated', {
        messageId: message.message_id,
      });
    } catch (error) {
      console.error('[MessagesGateway] Error updating message:', error);
      client.emit('message_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody(new WsZodValidationPipe(markMessagesAsReadDtoSchema))
    data: MarkMessagesAsReadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { messageThreadId, messageIds } = data;

    try {
      const user = client.data.user as AuthUser;

      if (!user) {
        client.emit('message_error', {
          error: 'Unauthorized: User not authenticated',
        });
        return;
      }

      if (!this.userSockets.get(user.user_id)?.has(client.id)) {
        this.authenticateAndSetupUser(client, user);
      }

      await this.messageService.markMessagesAsRead(user, {
        messageThreadId,
        messageIds,
      });

      const thread = await this.threadService.getThreadById(
        user,
        messageThreadId,
      );
      const threadWithParticipants = thread as typeof thread & {
        participants: Array<{ user_id: number }>;
      };

      const readPayload = {
        userId: user.user_id,
        messageThreadId,
        messageIds: messageIds || [],
      };

      const participantUserIds = threadWithParticipants.participants.map(
        (p) => p.user_id,
      );
      this.broadcastToUsers('messages_read', readPayload, participantUserIds);
      this.broadcastToThread(messageThreadId, 'messages_read', readPayload);
      this.server.emit('thread_updated', { messageThreadId });

      client.emit('marked_as_read', {
        messageThreadId,
      });
    } catch (error) {
      console.error('[MessagesGateway] Error marking as read:', error);
      client.emit('message_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('join_thread')
  async handleJoinThread(
    @MessageBody(
      new WsZodValidationPipe(
        z.object({
          messageThreadId: z.number().int().positive(),
        }),
      ),
    )
    data: { messageThreadId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user as AuthUser;
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      if (!this.userSockets.get(user.user_id)?.has(client.id)) {
        this.authenticateAndSetupUser(client, user);
      }

      await this.threadService.getThreadById(user, data.messageThreadId);
      client.join(`thread:${data.messageThreadId}`);
      client.emit('joined_thread', { messageThreadId: data.messageThreadId });
    } catch (error) {
      console.error('[MessagesGateway] Error joining thread:', error);
      client.emit('error', {
        message:
          error instanceof Error ? error.message : 'Failed to join thread',
      });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leave_thread')
  handleLeaveThread(
    @MessageBody(
      new WsZodValidationPipe(
        z.object({
          messageThreadId: z.number().int().positive(),
        }),
      ),
    )
    data: { messageThreadId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`thread:${data.messageThreadId}`);
    client.emit('left_thread', { messageThreadId: data.messageThreadId });
  }

  /**
   * Broadcast to all clients in a thread room
   */
  private broadcastToThread(messageThreadId: number, event: string, data: any) {
    this.server.to(`thread:${messageThreadId}`).emit(event, data);
  }

  /**
   * Broadcast to specific users by their user IDs
   * Uses tracked sockets directly for reliability, with room fallback
   */
  broadcastToUsers(event: string, data: any, userIds: number[]) {
    for (const userId of userIds) {
      const trackedSockets = this.userSockets.get(userId);
      const socketIds = trackedSockets ? Array.from(trackedSockets) : [];

      // Emit to each tracked socket directly
      for (const socketId of socketIds) {
        let socket: Socket | undefined;

        if (this.server?.sockets?.sockets) {
          socket = this.server.sockets.sockets.get(socketId);
        } else if (
          this.server?.sockets &&
          typeof (this.server.sockets as any).get === 'function'
        ) {
          socket = (this.server.sockets as any).get(socketId);
        }

        if (socket && socket.connected) {
          socket.emit(event, data);
        } else {
          trackedSockets?.delete(socketId);
        }
      }

      // Also emit to room as fallback
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }
}
