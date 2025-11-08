import { Socket } from 'socket.io';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        console.error('[WsJwtAuthGuard] No token provided');
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync<{
        userId: number;
        email: string;
      }>(token);
      const user = await this.prisma.user.findUnique({
        where: { user_id: payload.userId },
        select: { user_id: true, email: true },
      });

      if (!user) {
        console.error('[WsJwtAuthGuard] User not found:', payload.userId);
        throw new WsException('Unauthorized: User not found');
      }

      client.data.user = user;

      return true;
    } catch (error) {
      console.error(
        '[WsJwtAuthGuard] Authentication failed:',
        error instanceof Error ? error.message : error,
      );
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
