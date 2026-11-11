import { ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

const SECRET = 'test-secret';
const jwt = new JwtService({ secret: SECRET });

const socketWith = (token: string) => ({
  handshake: { headers: {}, auth: { token }, query: {} },
  data: {} as Record<string, unknown>,
});

// Expiry set in the payload, in seconds from now
const tokenExpiringIn = (seconds: number, payload: object) =>
  jwt.signAsync({ ...payload, exp: Math.floor(Date.now() / 1000) + seconds });

const contextFor = (client: ReturnType<typeof socketWith>) =>
  ({
    switchToWs: () => ({ getClient: () => client }),
  }) as unknown as ExecutionContext;

describe('WsJwtAuthGuard', () => {
  const user = { userId: 7, email: 'athlete@example.com' };
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
  } as unknown as PrismaService;
  const guard = new WsJwtAuthGuard(jwt, prisma);

  it('authenticates a socket with a valid token', async () => {
    const client = socketWith(await tokenExpiringIn(3600, user));

    await expect(guard.canActivate(contextFor(client))).resolves.toBe(true);
    expect(client.data.user).toEqual(user);
  });

  // The client tells the expiry from this message to refresh and reconnect
  it('rejects an expired token as a routine condition, not an error', async () => {
    const error = jest.spyOn(Logger.prototype, 'error');
    const debug = jest.spyOn(Logger.prototype, 'debug');
    const client = socketWith(await tokenExpiringIn(-60, user));

    await expect(guard.canActivate(contextFor(client))).rejects.toThrow(
      new WsException('Unauthorized: jwt expired'),
    );
    expect(client.data.user).toBeUndefined();
    expect(error).not.toHaveBeenCalled();
    expect(debug).toHaveBeenCalled();
  });
});
