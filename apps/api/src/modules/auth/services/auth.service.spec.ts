import { ConflictException } from '@nestjs/common';

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
    );
    expect(tokens).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('still fails when the account cannot be found afterwards', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockReset().mockResolvedValue(null);

    await expect(
      service.loginWithFirebase({ idToken: 'token' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
