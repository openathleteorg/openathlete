import { ActivityStream } from '@openathlete/shared';

import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { compressActivityStream } from 'src/modules/core/helpers/activity-stream';
import {
  INTENSITY_VERSION,
  IntensityProcessor,
} from 'src/modules/core/services/pipeline/processors/intensity.processor';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { IntensityBackfillService } from './intensity-backfill.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's activity 3501, on event 3002 of athlete 2001
const ACTIVITY_ID = 3501;
const ATHLETE_ID = 2001;

/** Ten minutes at 120 bpm */
const stream = compressActivityStream({
  time: Array.from({ length: 601 }, (_, i) => i),
  heartrate: Array.from({ length: 601 }, () => 120),
} as ActivityStream);

describe('intensity backfill (PostgreSQL)', () => {
  let prisma: PrismaService;
  let backfill: IntensityBackfillService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    backfill = new IntensityBackfillService(
      prisma,
      new IntensityProcessor(prisma),
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
    await prisma.eventActivity.update({
      where: { eventActivityId: ACTIVITY_ID },
      data: { stream: stream as object },
    });
    await prisma.trainingZoneValue.deleteMany({
      where: { trainingZone: { athleteId: ATHLETE_ID } },
    });
    await prisma.trainingZone.deleteMany({ where: { athleteId: ATHLETE_ID } });
    for (const [index, min] of [100, 140, 170].entries()) {
      await prisma.trainingZone.create({
        data: {
          name: `Zone ${index}`,
          description: '',
          index,
          type: 'HEARTRATE',
          color: '#000000',
          athleteId: ATHLETE_ID,
          values: { create: [{ min, max: min + 29, sports: [] }] },
        },
      });
    }
  });

  it('sorts the recording in the athlete zones', async () => {
    expect(await backfill.run()).toBeGreaterThanOrEqual(1);
    const activity = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: ACTIVITY_ID },
    });
    expect(activity.intensitySeconds).toEqual([600, 0, 0]);
    expect(activity.intensityVersion).toBe(INTENSITY_VERSION);
  });

  it('does nothing once every activity is up to date', async () => {
    await backfill.run();
    expect(await backfill.run()).toBe(0);
  });

  it('reads the recording again once marked out of date', async () => {
    await backfill.run();
    await prisma.trainingZoneValue.updateMany({
      where: { trainingZone: { athleteId: ATHLETE_ID, index: 1 } },
      data: { min: 110 },
    });
    await prisma.eventActivity.update({
      where: { eventActivityId: ACTIVITY_ID },
      data: { intensityVersion: 0 },
    });
    await backfill.run();
    const activity = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: ACTIVITY_ID },
    });
    expect(activity.intensitySeconds).toEqual([0, 600, 0]);
  });
});
