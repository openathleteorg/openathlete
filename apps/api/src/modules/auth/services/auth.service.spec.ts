import { sign, verify } from 'jsonwebtoken';

import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

function setup() {
  const existing = { userId: 7, email: 'runner@example.com' };
  const prisma = {
    user: {
      // Not found before creating, found once the concurrent call created it
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existing),
    },
  };
  const userService = {
    createAccount: jest
      .fn()
      .mockRejectedValue(new ConflictException('User already exists')),
  };
  const config = {
    get: (key: string) =>
      key === 'JWT_SECRET_KEY'
        ? 'test-jwt-secret-at-least-32-characters-long'
        : undefined,
    getOrThrow: () => 'test-jwt-secret-at-least-32-characters-long',
  };
  const firebase = {
    verifyIdToken: jest.fn().mockResolvedValue({
      email: 'Runner@Example.com',
      name: 'Run Ner',
    }),
  };
  const service = new AuthService(
    prisma as never,
    userService as never,
    config as never,
    firebase as never,
  );
  return { service, prisma, userService };
}

describe('AuthService.loginWithFirebase', () => {
  it('logs in the account a concurrent sign-in just created', async () => {
    const { service, userService } = setup();

    const tokens = await service.loginWithFirebase({ idToken: 'token' });

    expect(userService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'runner@example.com' }),
      // The provider sets the address: no need to match an invitation's
      { emailFromProvider: true },
    );
    expect(tokens).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('creates the account in the language of the app', async () => {
    const { service, userService } = setup();
    userService.createAccount.mockReset().mockResolvedValue({ userId: 7 });

    await service.loginWithFirebase({ idToken: 'token', language: 'IT' });

    expect(userService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'runner@example.com', language: 'IT' }),
      { emailFromProvider: true },
    );
  });

  it('still fails when the account cannot be found afterwards', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockReset().mockResolvedValue(null);

    await expect(
      service.loginWithFirebase({ idToken: 'token' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AuthService.refresh', () => {
  const secret = 'test-jwt-secret-at-least-32-characters-long';
  const payload = { userId: 7, email: 'runner@example.com' };

  it.each([
    ['malformed', 'not-a-jwt'],
    ['expired', sign(payload, secret, { expiresIn: -1 })],
    ['wrong signature', sign(payload, 'another-test-signing-secret')],
    [
      'not yet valid',
      sign({ ...payload, nbf: Math.floor(Date.now() / 1000) + 3600 }, secret),
    ],
  ])('returns unauthorized for a %s token', async (_kind, token) => {
    const { service, prisma } = setup();
    await expect(service.refresh(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('refreshes a valid token for an existing user', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockReset().mockResolvedValue(payload);
    const tokens = await service.refresh(
      sign(payload, secret, { expiresIn: '1d' }),
    );
    expect(verify(tokens.accessToken, secret)).toMatchObject(payload);
    expect(verify(tokens.refreshToken, secret)).toMatchObject(payload);
  });

  it('rejects tokens whose account no longer exists', async () => {
    const { service } = setup();
    await expect(service.refresh(sign(payload, secret))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('keeps database failures distinguishable from invalid credentials', async () => {
    const { service, prisma } = setup();
    const error = new Error('Database unavailable');
    prisma.user.findFirst.mockReset().mockRejectedValue(error);
    await expect(service.refresh(sign(payload, secret))).rejects.toBe(error);
  });
});
