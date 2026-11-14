import { CaslAbilityFactory } from 'src/modules/auth';
import {
  DELETED_ATHLETE_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadService } from './training-load.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's run (activity 3501 of event 3002) has a TRIMP entry of 80
const ACTIVITY_ID = 3501;

describe('recalculating TRIMP after the heart rate profile changes (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: TrainingLoadService;

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
    await prisma.eventActivity.update({
      where: { eventActivityId: ACTIVITY_ID },
      data: { averageHeartrate: 150 },
    });
  });

  const trimpOfTheRun = async () =>
    (
      await prisma.trainingLoadEntry.findFirstOrThrow({
        where: {
          activityId: ACTIVITY_ID,
          calculation: { athleteId: DELETED_ATHLETE_ID, type: 'TRIMP' },
        },
      })
    ).value;

  const logHeartRate = (type: 'HR_MAX' | 'HR_REST', value: number) =>
    prisma.athleteMetric.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        type,
        value,
        date: new Date('2026-11-14T00:00:00Z'),
      },
    });

  it('keeps the loads while HR max or resting HR is missing', async () => {
    await logHeartRate('HR_MAX', 183);
    expect(await service.recalculateAthleteTrimp(DELETED_ATHLETE_ID)).toEqual({
      processed: 0,
      errors: 0,
      skipped: 'no HR max or resting HR',
    });
    expect(await trimpOfTheRun()).toBe(80);
  });

  it('computes every activity again with the new values', async () => {
    await logHeartRate('HR_MAX', 183);
    await logHeartRate('HR_REST', 50);
    expect(await service.recalculateAthleteTrimp(DELETED_ATHLETE_ID)).toEqual({
      processed: 1,
      errors: 0,
    });
    const first = await trimpOfTheRun();
    expect(first).not.toBe(80);
    expect(first).toBeGreaterThan(0);

    // A lower HR max makes the same run harder
    await prisma.athleteMetric.updateMany({
      where: { athleteId: DELETED_ATHLETE_ID, type: 'HR_MAX' },
      data: { value: 170 },
    });
    await service.recalculateAthleteTrimp(DELETED_ATHLETE_ID);
    expect(await trimpOfTheRun()).toBeGreaterThan(first);
    // Overwritten, not added
    expect(
      await prisma.trainingLoadEntry.count({
        where: { activityId: ACTIVITY_ID, calculation: { type: 'TRIMP' } },
      }),
    ).toBe(1);
  });
});
