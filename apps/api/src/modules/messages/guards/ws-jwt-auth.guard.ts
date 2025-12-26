import { Socket } from 'socket.io';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        this.logger.error('WebSocket authentication failed: No token provided');
        throw new WsException('Unauthorized: No token provided');
      }

      let payload: { userId: number; email: string };
      try {
        payload = await this.jwtService.verifyAsync<{
          userId: number;
          email: string;
        }>(token);
      } catch (jwtError: unknown) {
        if (jwtError instanceof TokenExpiredError) {
          this.logger.error('WebSocket authentication failed: JWT token expired');
          throw new WsException('Unauthorized: jwt expired');
        }
        if (jwtError instanceof JsonWebTokenError) {
          const errorMessage =
            jwtError instanceof Error ? jwtError.message : 'Invalid token';
          this.logger.error(`WebSocket authentication failed: Invalid JWT token - ${errorMessage}`);
          throw new WsException('Unauthorized: Invalid token');
        }
        if (jwtError instanceof Error) {
          this.logger.error(`WebSocket authentication failed: JWT verification error - ${jwtError.message}`);
          throw new WsException('Unauthorized: Invalid token');
        }
        throw new WsException('Unauthorized: Invalid token');
      }

      const user = await this.prisma.user.findUnique({
        where: { user_id: payload.userId },
        select: { user_id: true, email: true },
      });

      if (!user) {
        this.logger.error(`WebSocket authentication failed: User not found (userId: ${payload.userId})`);
        throw new WsException('Unauthorized: User not found');
      }

      client.data.user = user;

      return true;
    } catch (error) {
      // If it's already a WsException, rethrow it
      if (error instanceof WsException) {
        throw error;
      }
      this.logger.error(
        `WebSocket authentication failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Try to get token from auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from query params (fallback for some clients)
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof token === 'string') {
      return token;
    }

    return null;
  }
}
