import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import {
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { AthleteService } from 'src/modules/core/services/athlete.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

import { AthleteInvitationService } from './athlete-invitation.service';
import { CoachInvitationService } from './coach-invitation.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('invitation links (PostgreSQL)', () => {
  let prisma: PrismaService;
  let coachInvitations: CoachInvitationService;
  let athleteInvitations: AthleteInvitationService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const deps = [
      prisma,
      { get: () => 'http://localhost' } as unknown as ConfigService<
        ApiEnvSchemaType,
        true
      >,
      { emit: jest.fn() } as unknown as EventEmitter2,
      {
        checkAthleteLimit: jest.fn().mockResolvedValue(true),
      } as unknown as FeatureAccessService,
    ] as const;
    coachInvitations = new CoachInvitationService(...deps);
    athleteInvitations = new AthleteInvitationService(...deps);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
  });

  /** A new account, as a sign-up with the link creates it. */
  const signUp = async (email: string) =>
    (
      await prisma.user.create({
        data: {
          email,
          password: 'hash',
          firstName: 'New',
          lastName: 'User',
          athlete: { create: {} },
        },
      })
    ).userId;

  const coachesOf = (athleteId: number) =>
    prisma.coachAthlete.findMany({ where: { athleteId } });

  describe('a coach invitation', () => {
    beforeEach(() =>
      prisma.coachInvitation.create({
        data: {
          email: 'new-coach@example.com',
          athleteUserId: DELETED_USER_ID,
          token: 'coach-link',
        },
      }),
    );

    it('works once, then is spent', async () => {
      const first = await signUp('new-coach@example.com');
      await coachInvitations.consumeInvitation('coach-link', first);
      expect(await coachInvitations.verifyInvitationToken('coach-link')).toBe(
        null,
      );

      const second = await signUp('someone-else@example.com');
      await expect(
        coachInvitations.consumeInvitation('coach-link', second),
      ).rejects.toThrow('Invalid or expired invitation token');
      expect(
        (await coachesOf(DELETED_ATHLETE_ID)).map((link) => link.userId),
      ).toEqual(expect.not.arrayContaining([second]));
      expect(
        (await coachesOf(DELETED_ATHLETE_ID)).map((link) => link.userId),
      ).toContain(first);
    });

    it('lets only one of two simultaneous sign-ups in', async () => {
      const [a, b] = [
        await signUp('a@example.com'),
        await signUp('b@example.com'),
      ];
      const results = await Promise.allSettled([
        coachInvitations.consumeInvitation('coach-link', a),
        coachInvitations.consumeInvitation('coach-link', b),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const joined = (await coachesOf(DELETED_ATHLETE_ID)).filter((link) =>
        [a, b].includes(link.userId),
      );
      expect(joined).toHaveLength(1);
    });
  });

  it('spends an athlete invitation once, even when two sign-ups race', async () => {
    await prisma.athleteInvitation.create({
      data: {
        email: 'runner@example.com',
        userId: COACH_USER_ID,
        token: 'athlete-link',
      },
    });
    const [a, b] = [
      await signUp('runner@example.com'),
      await signUp('other@example.com'),
    ];
    const results = await Promise.allSettled([
      athleteInvitations.consumeInvitation('athlete-link', a),
      athleteInvitations.consumeInvitation('athlete-link', b),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      await prisma.coachAthlete.count({
        where: { userId: COACH_USER_ID, athlete: { userId: { in: [a, b] } } },
      }),
    ).toBe(1);
  });
});

describe("an athlete's coaches (PostgreSQL)", () => {
  let prisma: PrismaService;
  let athletes: AthleteService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    athletes = new AthleteService(
      prisma,
      new CaslAbilityFactory(),
      {} as AthleteInvitationService,
      {} as CoachInvitationService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('follows the athlete profile, whose id is not the user id', async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
    // Someone else's athlete profile has the id of user 1001, and a coach
    await prisma.user.create({
      data: {
        userId: 3001,
        email: 'other@example.com',
        password: 'hash',
        firstName: 'Other',
        lastName: 'Athlete',
        athlete: { create: { athleteId: DELETED_USER_ID } },
      },
    });
    await prisma.user.create({
      data: {
        userId: 3002,
        email: 'other-coach@example.com',
        password: 'hash',
        firstName: 'Other',
        lastName: 'Coach',
        coachAthletes: { create: { athleteId: DELETED_USER_ID } },
      },
    });

    const coaches = await athletes.getMyCoaches(DELETED_USER_ID);
    // User 1001's own coach, the fixture's 1002, and nobody else's
    expect(coaches).toEqual([
      expect.objectContaining({ userId: COACH_USER_ID }),
    ]);
    expect(Object.keys(coaches[0]).sort()).toEqual([
      'email',
      'firstName',
      'lastName',
      'userId',
    ]);
  });
});
