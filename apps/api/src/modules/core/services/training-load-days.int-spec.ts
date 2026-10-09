import { ForbiddenException } from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadService } from './training-load.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('daily load, form and wellness (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: TrainingLoadService;
  // Not the coach of anyone here: only their own data
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new TrainingLoadService(prisma, new CaslAbilityFactory());
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
    await prisma.athleteMetric.createMany({
      data: [
        // Stored by date: whatever the time zone, the 6th
        {
          athleteId: DELETED_ATHLETE_ID,
          type: 'HR_REST',
          value: 47,
          date: new Date('2026-01-06'),
        },
        {
          athleteId: DELETED_ATHLETE_ID,
          type: 'SLEEP_DURATION',
          value: 7.5,
          date: new Date('2026-01-06'),
        },
      ],
    });
  });

  it('gives each day its form, and its wellness when asked', async () => {
    const days = await service.getDailyForm(
      athlete,
      new Date('2026-01-05T00:00:00Z'),
      new Date('2026-01-07T00:00:00Z'),
      undefined,
      true,
    );
    expect(days.map((day) => day.date)).toEqual([
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
    ]);
    expect(days[0].wellness).toBeUndefined();
    expect(days[1].wellness).toEqual({ HR_REST: 47, SLEEP_DURATION: 7.5 });
    // The fixture's weight is not a wellness measurement
    expect(JSON.stringify(days)).not.toContain('WEIGHT');
  });

  it('leaves wellness out when not asked for', async () => {
    const days = await service.getDailyForm(
      athlete,
      new Date('2026-01-05T00:00:00Z'),
      new Date('2026-01-07T00:00:00Z'),
      undefined,
      false,
    );
    expect(days.every((day) => day.wellness === undefined)).toBe(true);
  });

  it("refuses another athlete's days", async () => {
    await expect(
      service.getDailyForm(
        athlete,
        new Date('2026-01-05T00:00:00Z'),
        new Date('2026-01-07T00:00:00Z'),
        COACH_ATHLETE_ID,
        true,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
