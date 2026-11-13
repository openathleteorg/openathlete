import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import {
  COACH_USER_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

import { CoachJoinLinkService } from './coach-join-link.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('coach join link (PostgreSQL)', () => {
  let prisma: PrismaService;
  let joinLinks: CoachJoinLinkService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    joinLinks = new CoachJoinLinkService(
      prisma,
      { get: () => 'http://localhost' } as unknown as ConfigService<
        ApiEnvSchemaType,
        true
      >,
      {
        checkAthleteLimit: jest.fn().mockResolvedValue(true),
      } as unknown as FeatureAccessService,
    );
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
    await prisma.user.update({
      where: { userId: COACH_USER_ID },
      data: { roles: ['ATHLETE', 'COACH'] },
    });
  });

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

  const linksTo = (athleteUserId: number) =>
    prisma.coachAthlete.count({
      where: { userId: COACH_USER_ID, athlete: { userId: athleteUserId } },
    });

  it('links a double submit once', async () => {
    const { token } = await joinLinks.getOrCreateLink(COACH_USER_ID);
    const athleteUserId = await signUp('runner@example.com');

    const results = await Promise.all([
      joinLinks.accept(athleteUserId, token),
      joinLinks.accept(athleteUserId, token),
    ]);
    expect(results.map((r) => r.alreadyLinked).sort()).toEqual([false, true]);
    expect(await linksTo(athleteUserId)).toBe(1);
  });

  it('serves many athletes with one link, until the coach rotates it', async () => {
    const { token } = await joinLinks.getOrCreateLink(COACH_USER_ID);
    const [a, b] = [
      await signUp('a@example.com'),
      await signUp('b@example.com'),
    ];
    await joinLinks.accept(a, token);
    await joinLinks.accept(b, token);
    expect(await linksTo(a)).toBe(1);
    expect(await linksTo(b)).toBe(1);

    const rotated = await joinLinks.rotateLink(COACH_USER_ID);
    expect(rotated.token).not.toBe(token);
    const c = await signUp('c@example.com');
    await expect(joinLinks.accept(c, token)).rejects.toThrow(
      'Unknown join link',
    );
    await joinLinks.accept(c, rotated.token);
    expect(await linksTo(c)).toBe(1);
    // An already coached athlete opening the link again changes nothing
    expect(await joinLinks.accept(DELETED_USER_ID, rotated.token)).toEqual({
      coachName: 'Co A.',
      alreadyLinked: true,
    });
    expect(await linksTo(DELETED_USER_ID)).toBe(1);
  });
});
