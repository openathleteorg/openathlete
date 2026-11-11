import {
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingMatchProcessor } from './training-match.processor';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('training match (PostgreSQL)', () => {
  let prisma: PrismaService;
  let processor: TrainingMatchProcessor;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    processor = new TrainingMatchProcessor(prisma);
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

  const setTimeZone = (timeZone: string | null) =>
    prisma.user.update({
      where: { userId: DELETED_USER_ID },
      data: { timeZone },
    });

  const planned = (startDate: string) =>
    prisma.event.create({
      data: {
        name: 'Easy run',
        type: 'TRAINING',
        startDate: new Date(startDate),
        endDate: new Date(startDate),
        athleteId: DELETED_ATHLETE_ID,
        training: {
          create: { sport: 'RUNNING', goalDistance: 10000, goalDuration: 3600 },
        },
      },
      include: { training: true },
    });

  const activity = (startDate: string) =>
    prisma.event.create({
      data: {
        name: 'Run',
        type: 'ACTIVITY',
        startDate: new Date(startDate),
        endDate: new Date(new Date(startDate).getTime() + 3600 * 1000),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport: 'RUNNING',
            distance: 10000,
            elevationGain: 50,
            movingTime: 3600,
            averageSpeed: 2.8,
            maxSpeed: 4,
            externalId: `ext-${startDate}`,
          },
        },
      },
      include: { activity: true },
    });

  const match = (event: Awaited<ReturnType<typeof activity>>) =>
    processor.run({
      eventId: event.eventId,
      eventActivityId: event.activity!.eventActivityId,
    });

  const linkedActivityOf = async (eventTrainingId: number) =>
    (
      await prisma.eventTraining.findUniqueOrThrow({
        where: { eventTrainingId },
      })
    ).relatedActivityId;

  it("links an evening activity to the session of the athlete's day, not the next UTC day", async () => {
    await setTimeZone('America/Toronto');
    // Monday 9 March and Tuesday 10 March, noon in Toronto (UTC-4)
    const monday = await planned('2026-03-09T16:00:00Z');
    const tuesday = await planned('2026-03-10T16:00:00Z');
    // Monday 21:30 in Toronto, already Tuesday in UTC
    const run = await activity('2026-03-10T01:30:00Z');

    await match(run);

    expect(await linkedActivityOf(monday.training!.eventTrainingId)).toBe(
      run.activity!.eventActivityId,
    );
    expect(
      await linkedActivityOf(tuesday.training!.eventTrainingId),
    ).toBeNull();
  });

  it("never links to a session on another day of the athlete's calendar", async () => {
    await setTimeZone('America/Toronto');
    const tuesday = await planned('2026-03-10T16:00:00Z');
    // Monday 21:30 in Toronto, with nothing planned that day
    const run = await activity('2026-03-10T01:30:00Z');

    await match(run);

    expect(
      await linkedActivityOf(tuesday.training!.eventTrainingId),
    ).toBeNull();
  });

  it('uses UTC days when the athlete has no time zone', async () => {
    await setTimeZone(null);
    const tuesday = await planned('2026-03-10T16:00:00Z');
    const run = await activity('2026-03-10T01:30:00Z');

    await match(run);

    expect(await linkedActivityOf(tuesday.training!.eventTrainingId)).toBe(
      run.activity!.eventActivityId,
    );
  });
});
