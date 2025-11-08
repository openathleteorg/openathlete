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

import { WsJwtAuthGuard } from '../guards/ws-jwt-auth.guard';
import { MastraAgentService } from '../services/mastra-agent.service';

// Helper function to get allowed origins (same as main.ts)
const getAllowedOrigins = (): string[] => {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  }
  return process.env.APP_URL
    ? [process.env.APP_URL]
    : ['http://localhost:5173'];
};

// CORS validation function for Socket.IO
// Socket.IO accepts either a function with callback or a function returning boolean
const corsOriginValidator = (
  origin: string | undefined,
  callback?: (err: Error | null, allow?: boolean) => void,
): boolean | void => {
  const allowedOrigins = getAllowedOrigins();

  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    if (callback) {
      return callback(null, true);
    }
    return true;
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    if (callback) {
      return callback(null, true);
    }
    return true;
  }

  // Also check if any allowed origin matches (for subdomain support)
  try {
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      try {
        const allowedUrl = new URL(allowedOrigin);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        return origin === allowedOrigin;
      }
    });

    if (callback) {
      return callback(null, isAllowed);
    }
    return isAllowed;
  } catch {
    // If URL parsing fails, do simple string comparison
    const isAllowed = allowedOrigins.includes(origin);
    if (callback) {
      return callback(null, isAllowed);
    }
    return isAllowed;
  }
};

@WebSocketGateway({
  cors: {
    origin: corsOriginValidator,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  namespace: '/agent',
  transports: ['polling', 'websocket'], // Support both transports for proxy compatibility
  allowEIO3: true, // Allow Engine.IO v3 clients for better compatibility
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private mastraAgentService: MastraAgentService) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { threadId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { threadId, content } = data;

    try {
      // Extract authenticated user from socket (set by WsJwtAuthGuard)
      const user = client.data.user as AuthUser;

      if (!user) {
        console.error('[AgentGateway] User not authenticated');
        client.emit('message_error', {
          error: 'Unauthorized: User not authenticated',
          threadId,
        });
        return;
      }

      await this.mastraAgentService.processMessageStream(
        user,
        threadId,
        content,
        (chunk) => {
          client.emit('message_chunk', chunk);
        },
        (title) => {
          // Notifier tous les clients du thread que le titre a été mis à jour
          this.broadcastToThread(threadId, 'thread_title_updated', {
            threadId,
            title,
          });
          // Également envoyer directement au client qui a envoyé le message
          // pour s'assurer qu'il reçoit l'événement même s'il n'est pas dans la room
          client.emit('thread_title_updated', {
            threadId,
            title,
          });
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

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('join_thread')
  handleJoinThread(
    @MessageBody() data: { threadId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`thread:${data.threadId}`);
    client.emit('joined_thread', { threadId: data.threadId });
  }

  @UseGuards(WsJwtAuthGuard)
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
