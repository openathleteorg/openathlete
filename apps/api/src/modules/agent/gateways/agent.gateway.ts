import { Server, Socket } from 'socket.io';

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

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MastraAgentService } from '../services/mastra-agent.service';

@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/agent',
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private mastraAgentService: MastraAgentService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { threadId: number; content: string; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { threadId, content, userId } = data;

    try {
      // Fetch user from database
      const dbUser = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { user_id: true, email: true },
      });

      if (!dbUser) {
        console.error('[AgentGateway] User not found:', userId);
        client.emit('message_error', {
          error: 'User not found',
          threadId,
        });
        return;
      }

      const user = dbUser as AuthUser;

      await this.mastraAgentService.processMessageStream(
        user,
        threadId,
        content,
        (chunk) => {
          client.emit('message_chunk', chunk);
        },
      );

      client.emit('message_complete', {
        threadId,
      });
    } catch (error) {
      console.error('[AgentGateway] Error processing message:', error);
      client.emit('message_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        threadId,
      });
    }
  }

  @SubscribeMessage('join_thread')
  handleJoinThread(
    @MessageBody() data: { threadId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`thread:${data.threadId}`);
    client.emit('joined_thread', { threadId: data.threadId });
  }

  @SubscribeMessage('leave_thread')
  handleLeaveThread(
    @MessageBody() data: { threadId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`thread:${data.threadId}`);
    client.emit('left_thread', { threadId: data.threadId });
  }

  // Broadcast to all clients in a thread
  broadcastToThread(threadId: number, event: string, data: any) {
    this.server.to(`thread:${threadId}`).emit(event, data);
  }
}
