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

  /** The 50 min, 9 km run, warm-up and cool-down included */
  const run = () =>
    prisma.event.create({
      data: {
        name: 'Run',
        type: 'ACTIVITY',
        startDate: new Date('2026-03-10T14:00:00Z'),
        endDate: new Date('2026-03-10T14:50:00Z'),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport: 'RUNNING',
            distance: 9000,
            elevationGain: 20,
            movingTime: 3000,
            averageSpeed: 3,
            maxSpeed: 5,
            externalId: 'ext-run',
          },
        },
      },
      include: { activity: true },
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

    await processor.run({
      eventId: activity.eventId,
      eventActivityId: activity.activity!.eventActivityId,
    });

    expect(await linkedActivityOf(session.training!.eventTrainingId)).toBe(
      activity.activity!.eventActivityId,
    );
  });
});
