import { Socket } from 'socket.io';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
      } catch {
        throw new WsException('Unauthorized: Invalid token');
      }

      const user = await this.prisma.user.findUnique({
        where: { userId: payload.userId },
        select: { userId: true, email: true },
      });

      if (!user) {
        this.logger.error(
          `WebSocket authentication failed: User not found (userId: ${payload.userId})`,
        );
        throw new WsException('Unauthorized: User not found');
      }

      client.data.user = user;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof token === 'string') {
      return token;
    }

    return null;
  }
}
