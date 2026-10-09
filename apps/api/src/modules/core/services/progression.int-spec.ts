import { ForbiddenException } from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ProgressionService } from './progression.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('progression (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: ProgressionService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;
  // An athlete of their own, coaching nobody here
  const other = {
    userId: COACH_USER_ID,
    email: 'coach@example.com',
    athlete: { athleteId: COACH_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new ProgressionService(prisma, new CaslAbilityFactory());
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
      where: { userId: DELETED_USER_ID },
      data: { timeZone: 'Europe/Paris' },
    });
  });

  const run = (startDate: string, distance: number, heartRate?: number) =>
    prisma.event.create({
      data: {
        name: 'Run',
        type: 'ACTIVITY',
        startDate: new Date(startDate),
        endDate: new Date(new Date(startDate).getTime() + 3600_000),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport: 'RUNNING',
            distance,
            elevationGain: 100,
            movingTime: 3600,
            averageSpeed: distance / 3600,
            maxSpeed: 4,
            averageHeartrate: heartRate,
            externalId: `run-${startDate}`,
          },
        },
      },
    });

  it('groups a year by month in the athlete time zone', async () => {
    // 00:30 on January 1st in Paris: January, not December
    await run('2025-12-31T23:30:00Z', 10000, 150);
    await run('2026-01-20T07:00:00Z', 12000, 140);

    const { aggregationType, data } = await service.getProgressionData(
      athlete,
      DELETED_ATHLETE_ID,
      new Date('2025-12-31T23:00:00Z'),
      new Date('2026-12-31T22:59:59Z'),
    );

    expect(aggregationType).toBe('month');
    // The fixture's run of January 6th counts too
    expect(data.map((point) => [point.period, point.activityCount])).toEqual([
      ['2026-01-01', 3],
    ]);
    expect(data[0].averageHeartrate).toBe(145);
  });

  it('groups a few weeks by week, from Monday', async () => {
    await run('2026-03-02T07:00:00Z', 8000); // Monday
    await run('2026-03-08T19:00:00Z', 9000); // Sunday
    await run('2026-03-09T07:00:00Z', 10000); // Next Monday

    const { aggregationType, data } = await service.getProgressionData(
      athlete,
      DELETED_ATHLETE_ID,
      new Date('2026-03-01T00:00:00Z'),
      new Date('2026-03-31T00:00:00Z'),
    );

    expect(aggregationType).toBe('week');
    expect(data.map((point) => [point.period, point.totalDistance])).toEqual([
      ['2026-03-02', 17000],
      ['2026-03-09', 10000],
    ]);
  });

  it("refuses another athlete's data", async () => {
    await expect(
      service.getProgressionData(
        other,
        DELETED_ATHLETE_ID,
        new Date('2026-01-01'),
        new Date('2026-12-31'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.getFirstActivityDate(other, DELETED_ATHLETE_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
