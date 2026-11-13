import { ConflictException } from '@nestjs/common';

import { Prisma } from '@openathlete/database';
import { SPORT_TYPE } from '@openathlete/shared';

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

  it('stores the training profile and puts the target race on the calendar', async () => {
    const { userId } = await service.createAccount({
      email: 'racer@example.com',
      password: 'Racer-Passw0rd',
      firstName: 'Ra',
      lastName: 'Cer',
    });
    await prisma.user.update({
      where: { userId },
      data: { timeZone: 'Pacific/Auckland' },
    });

    await service.completeOnboarding({ userId } as never, {
      roles: ['ATHLETE'],
      practicedSports: [SPORT_TYPE.RUNNING, SPORT_TYPE.TRAIL_RUNNING],
      trainingGoal: 'RACE',
      weeklyTrainingHours: 'FROM_6_TO_10',
      targetRace: { distance: 'MARATHON', date: '2027-04-11', name: 'Paris' },
    });

    await expect(
      prisma.user.findUniqueOrThrow({
        where: { userId },
        select: {
          practicedSports: true,
          trainingGoal: true,
          weeklyTrainingHours: true,
          coachTeamSize: true,
        },
      }),
    ).resolves.toEqual({
      practicedSports: ['RUNNING', 'TRAIL_RUNNING'],
      trainingGoal: 'RACE',
      weeklyTrainingHours: 'FROM_6_TO_10',
      coachTeamSize: null,
    });
    const race = await prisma.event.findFirstOrThrow({
      where: { athlete: { userId }, type: 'COMPETITION' },
      include: { competition: true },
    });
    expect(race.name).toBe('Paris');
    // Noon in Auckland on the day of the race (UTC+12 in April)
    expect(race.startDate.toISOString()).toBe('2027-04-11T00:00:00.000Z');
    expect(race.competition).toMatchObject({
      sport: 'RUNNING',
      goalDistance: 42195,
      priority: 'A',
    });
  });

  it('puts no race on the calendar of a coach who only coaches', async () => {
    const { userId } = await service.createAccount({
      email: 'coach@example.com',
      password: 'Coach-Passw0rd',
      firstName: 'Co',
      lastName: 'Ach',
    });

    await service.completeOnboarding({ userId } as never, {
      roles: ['COACH'],
      coachTeamSize: 'FROM_6_TO_20',
      targetRace: { distance: '10K', date: '2027-04-11' },
    });

    await expect(
      prisma.event.count({ where: { athlete: { userId } } }),
    ).resolves.toBe(0);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { userId },
        select: { coachTeamSize: true },
      }),
    ).resolves.toEqual({ coachTeamSize: 'FROM_6_TO_20' });
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
