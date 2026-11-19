import {
  DELETED_ATHLETE_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingMatchProcessor } from './training-match.processor';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('training match with structured workouts (PostgreSQL)', () => {
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

  /** Lap-button warm-up, 6 × (400 m, 60 s rest), lap-button cool-down */
  const intervalSession = () =>
    prisma.event.create({
      data: {
        name: '6 × 400 m',
        type: 'TRAINING',
        startDate: new Date('2026-03-10T16:00:00Z'),
        endDate: new Date('2026-03-10T17:00:00Z'),
        athleteId: DELETED_ATHLETE_ID,
        training: {
          create: {
            sport: 'RUNNING',
            // The workout's total, as the app fills it in: the intervals only
            goalDuration: 1081,
            workout: {
              create: {
                steps: {
                  create: [
                    {
                      orderIndex: 0,
                      stepType: 'WARMUP',
                      durationType: 'LAP_BUTTON',
                    },
                    {
                      orderIndex: 1,
                      stepType: 'REPEAT',
                      durationType: 'OPEN',
                      repeatBlock: {
                        create: {
                          repetitions: 6,
                          childSteps: {
                            create: [
                              {
                                orderIndex: 0,
                                stepType: 'INTERVAL_ACTIVE',
                                durationType: 'DISTANCE',
                                durationValue: 400,
                              },
                              {
                                orderIndex: 1,
                                stepType: 'INTERVAL_REST',
                                durationType: 'TIME',
                                durationValue: 60,
                              },
                            ],
                          },
                        },
                      },
                    },
                    {
                      orderIndex: 2,
                      stepType: 'COOLDOWN',
                      durationType: 'LAP_BUTTON',
                    },
                  ],
                },
              },
            },
          },
        },
      },
      include: { training: true },
    });

  const longRun = () =>
    prisma.event.create({
      data: {
        name: 'Long run',
        type: 'TRAINING',
        startDate: new Date('2026-03-10T12:00:00Z'),
        endDate: new Date('2026-03-10T13:30:00Z'),
        athleteId: DELETED_ATHLETE_ID,
        training: {
          create: { sport: 'RUNNING', goalDuration: 5400, goalDistance: 16000 },
        },
      },
      include: { training: true },
    });

  /** A run of the athlete's day, 50 min and 9 km by default */
  const run = (movingTime = 3000, distance = 9000, startTime = '14:00') =>
    prisma.event.create({
      data: {
        name: 'Run',
        type: 'ACTIVITY',
        startDate: new Date(`2026-03-10T${startTime}:00Z`),
        endDate: new Date(`2026-03-10T${startTime}:00Z`),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport: 'RUNNING',
            distance,
            elevationGain: 20,
            movingTime,
            averageSpeed: 3,
            maxSpeed: 5,
            externalId: `ext-run-${startTime}`,
          },
        },
      },
      include: { activity: true },
    });

  const match = (event: Awaited<ReturnType<typeof run>>) =>
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

  it('links a run to an interval session whose warm-up and cool-down end on lap', async () => {
    const session = await intervalSession();
    const activity = await run();

    await match(activity);

    expect(await linkedActivityOf(session.training!.eventTrainingId)).toBe(
      activity.activity!.eventActivityId,
    );
  });

  it('gives an 85 min run to the long run, not to the lap-step intervals', async () => {
    const intervals = await intervalSession();
    const long = await longRun();
    const activity = await run(5100, 15000);

    await match(activity);

    expect(await linkedActivityOf(long.training!.eventTrainingId)).toBe(
      activity.activity!.eventActivityId,
    );
    expect(
      await linkedActivityOf(intervals.training!.eventTrainingId),
    ).toBeNull();
  });

  it('keeps the session from a short warm-up jog for the real run', async () => {
    const long = await longRun();
    const jog = await run(600, 2000, '11:30');
    const activity = await run(5100, 15000, '12:00');

    await match(jog);
    expect(await linkedActivityOf(long.training!.eventTrainingId)).toBeNull();

    await match(activity);
    expect(await linkedActivityOf(long.training!.eventTrainingId)).toBe(
      activity.activity!.eventActivityId,
    );
  });
});
