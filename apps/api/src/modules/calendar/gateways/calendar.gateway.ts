import { Server, Socket } from 'socket.io';

import { OnModuleInit, UseGuards } from '@nestjs/common';
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

import { WsJwtAuthGuard } from '../../agent/guards/ws-jwt-auth.guard';
import { WebSocketRedisService } from '../../websocket/websocket-redis.service';

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
const corsOriginValidator = (
  origin: string | undefined,
  callback?: (err: Error | null, allow?: boolean) => void,
): boolean | void => {
  const allowedOrigins = getAllowedOrigins();

  if (!origin) {
    if (callback) {
      return callback(null, true);
    }
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    if (callback) {
      return callback(null, true);
    }
    return true;
  }

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
  namespace: '/calendar',
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  // Improved connection stability settings
  pingTimeout: 60000, // 60 seconds - time to wait for pong response
  pingInterval: 25000, // 25 seconds - interval between pings
  // Allow reconnection with exponential backoff
  connectTimeout: 45000, // 45 seconds - connection timeout
})
export class CalendarGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  // Map to track user sockets: userId -> Set of socket IDs
  private userSockets = new Map<number, Set<string>>();

  constructor(private webSocketRedisService: WebSocketRedisService) {}

  onModuleInit() {
    const adapter = this.webSocketRedisService.getAdapter();
    if (adapter && this.server) {
      const mainServer = (this.server as unknown as { server: Server }).server;
      if (mainServer && typeof mainServer.adapter === 'function') {
        mainServer.adapter(adapter);
      }
    }
  }

  handleConnection(_: Socket) {
    // Authentication happens on first message, not on connection
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as AuthUser | undefined;
    if (user?.user_id) {
      const sockets = this.userSockets.get(user.user_id);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(user.user_id);
        }
      }
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { athleteId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user as AuthUser;
      if (!user) {
        client.emit('error', { error: 'Unauthorized' });
        return;
      }

      // Track user socket
      if (!this.userSockets.has(user.user_id)) {
        this.userSockets.set(user.user_id, new Set());
      }
      this.userSockets.get(user.user_id)!.add(client.id);

      // Join room for athlete-specific updates
      const athleteId = data.athleteId ?? user.athlete?.athlete_id;
      if (athleteId) {
        client.join(`athlete:${athleteId}`);
        client.emit('subscribed', { athleteId });
      } else {
        client.emit('subscribed', {});
      }
    } catch (error) {
      console.error('[CalendarGateway] Error in handleSubscribe:', error);
      client.emit('error', {
        error: 'Failed to subscribe',
      });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { athleteId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const athleteId = data.athleteId;
    if (athleteId) {
      client.leave(`athlete:${athleteId}`);
      client.emit('unsubscribed', { athleteId });
    }
  }

  // Broadcast to all clients subscribed to an athlete
  broadcastToAthlete(
    athleteId: number,
    event: string,
    data: Record<string, unknown>,
  ) {
    this.server.to(`athlete:${athleteId}`).emit(event, data);
  }

  // Broadcast to all clients subscribed to a user
  broadcastToUser(
    userId: number,
    event: string,
    data: Record<string, unknown>,
  ) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
