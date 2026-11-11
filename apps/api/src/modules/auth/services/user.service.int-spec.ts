import { ConflictException } from '@nestjs/common';

import { Prisma } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { UserService } from './user.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

describe('UserService.createAccount (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: UserService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const config = {
      get: (key: string) =>
        ({
          HASH_PEPPER: 'test-pepper-at-least-32-characters-long',
          APP_URL: 'http://localhost',
        })[key],
    };
    service = new UserService(
      prisma,
      config as never,
      { emit: jest.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", athlete RESTART IDENTITY CASCADE',
    );
  });

  const account = {
    email: 'Racer@Example.com',
    password: 'Race-Condition-1',
    firstName: 'Race',
    lastName: 'Condition',
  };

  it('creates one account when two sign-ups race, and rejects the other with 409', async () => {
    const results = await Promise.allSettled([
      service.createAccount(account),
      service.createAccount(account),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [rejected] = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(rejected.reason).toBeInstanceOf(ConflictException);
    await expect(
      prisma.user.count({ where: { email: 'racer@example.com' } }),
    ).resolves.toBe(1);
  });
});

describe('UserService.completeOnboarding (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: UserService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const config = {
      get: (key: string) =>
        ({
          HASH_PEPPER: 'test-pepper-at-least-32-characters-long',
          APP_URL: 'http://localhost',
        })[key],
    };
    service = new UserService(
      prisma,
      config as never,
      { emit: jest.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", athlete RESTART IDENTITY CASCADE',
    );
  });

  it('stores how the user heard of OpenAthlete', async () => {
    const { userId } = await service.createAccount({
      email: 'newcomer@example.com',
      password: 'Newcomer-Passw0rd',
      firstName: 'New',
      lastName: 'Comer',
    });

    await service.completeOnboarding({ userId } as never, {
      roles: ['ATHLETE'],
      acquisitionSource: 'AI_ASSISTANT',
    });

    await expect(
      prisma.user.findUniqueOrThrow({
        where: { userId },
        select: { acquisitionSource: true, onboardingCompleted: true },
      }),
    ).resolves.toEqual({
      acquisitionSource: 'AI_ASSISTANT',
      onboardingCompleted: true,
    });
  });

  it('records the signup attribution once, and not after the onboarding', async () => {
    const { userId } = await service.createAccount({
      email: 'visitor@example.com',
      password: 'Visitor-Passw0rd',
      firstName: 'Vis',
      lastName: 'Itor',
    });
    const attribution = () =>
      prisma.user
        .findUniqueOrThrow({
          where: { userId },
          select: { signupAttribution: true },
        })
        .then((user) => user.signupAttribution);

    await service.recordSignupAttribution(userId, {
      utmSource: 'reddit',
      landingPage: '/fr/coaches',
    });
    await service.recordSignupAttribution(userId, { utmSource: 'youtube' });
    await expect(attribution()).resolves.toEqual({
      utmSource: 'reddit',
      landingPage: '/fr/coaches',
    });

    await prisma.user.update({
      where: { userId },
      data: { signupAttribution: Prisma.DbNull, onboardingCompleted: true },
    });
    await service.recordSignupAttribution(userId, { utmSource: 'youtube' });
    await expect(attribution()).resolves.toBeNull();
  });
});
