import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  CreateWorkoutStepDto,
  EVENT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's training (event 3001) has workout 3201: a warm-up (3301),
// then a repeat (3302, block 3401) of one interval (3303) with a target
const EVENT_ID = 3001;
const WORKOUT_ID = 3201;

type StepInput = CreateWorkoutStepDto;

const step = (
  stepType: WORKOUT_STEP_TYPE,
  extra: Partial<StepInput> = {},
): StepInput => ({
  stepType,
  durationType: WORKOUT_DURATION_TYPE.TIME,
  durationValue: 600,
  targets: [],
  ...extra,
});

const newSteps = (coolDown: Partial<StepInput> = {}): StepInput[] => [
  step(WORKOUT_STEP_TYPE.WARMUP),
  step(WORKOUT_STEP_TYPE.REPEAT, {
    durationType: WORKOUT_DURATION_TYPE.OPEN,
    durationValue: null,
    repeatBlock: {
      repetitions: 3,
      childSteps: [
        step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, {
          targets: [
            { targetType: WORKOUT_TARGET_TYPE.HEARTRATE, targetValue: 165 },
          ],
        }),
        step(WORKOUT_STEP_TYPE.INTERVAL_REST),
      ],
    },
  }),
  step(WORKOUT_STEP_TYPE.COOLDOWN, coolDown),
];

describe('replacing the steps of a workout (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  const replaceSteps = (steps: StepInput[]) =>
    events.updateEvent(athlete, EVENT_ID, {
      type: EVENT_TYPE.TRAINING,
      workout: { steps },
    });

  const topSteps = () =>
    prisma.workoutStep.findMany({
      where: { workoutId: WORKOUT_ID },
      orderBy: { orderIndex: 'asc' },
      include: {
        targets: true,
        repeatBlock: {
          include: {
            childSteps: {
              include: { targets: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

  // Rows no longer reachable from any workout: the fixture has no other steps
  const orphans = async () => {
    const [row] = await prisma.$queryRaw<
      { steps: bigint; repeats: bigint; targets: bigint }[]
    >`
      WITH top AS (
        SELECT workout_step_id FROM workout_step WHERE workout_id IS NOT NULL
      ), repeats AS (
        SELECT workout_repeat_id FROM workout_repeat
        WHERE step_id IN (SELECT workout_step_id FROM top)
      ), reachable AS (
        SELECT workout_step_id FROM top
        UNION
        SELECT workout_step_id FROM workout_step
        WHERE repeat_parent_id IN (SELECT workout_repeat_id FROM repeats)
      )
      SELECT
        (SELECT count(*) FROM workout_step
          WHERE workout_step_id NOT IN (SELECT workout_step_id FROM reachable)) AS steps,
        (SELECT count(*) FROM workout_repeat
          WHERE workout_repeat_id NOT IN (SELECT workout_repeat_id FROM repeats)) AS repeats,
        (SELECT count(*) FROM workout_step_target
          WHERE step_id NOT IN (SELECT workout_step_id FROM reachable)) AS targets`;
    return {
      steps: Number(row.steps),
      repeats: Number(row.repeats),
      targets: Number(row.targets),
    };
  };

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    events = new EventService(
      prisma,
      new CaslAbilityFactory(),
      new EventEmitter2(),
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        cancelEstimation: jest.fn(),
        scheduleEstimation: jest.fn().mockResolvedValue(false),
      } as never,
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
  });

  it('replaces the old steps, repeat block and targets, in order', async () => {
    await replaceSteps(newSteps());

    const steps = await topSteps();
    expect(steps.map((s) => [s.orderIndex, s.stepType])).toEqual([
      [0, 'WARMUP'],
      [1, 'REPEAT'],
      [2, 'COOLDOWN'],
    ]);
    expect(steps.map((s) => s.workoutStepId)).not.toContain(3301);
    const block = steps[1].repeatBlock!;
    expect(block.workoutRepeatId).not.toBe(3401);
    expect(block.repetitions).toBe(3);
    expect(block.childSteps.map((c) => [c.orderIndex, c.stepType])).toEqual([
      [0, 'INTERVAL_ACTIVE'],
      [1, 'INTERVAL_REST'],
    ]);
    expect(block.childSteps[0].targets).toMatchObject([
      { targetType: 'HEARTRATE', targetValue: 165 },
    ]);

    expect(await prisma.workoutStep.count()).toBe(5);
    expect(await prisma.workoutRepeat.count()).toBe(1);
    expect(await prisma.workoutStepTarget.count()).toBe(1);
    expect(await orphans()).toEqual({ steps: 0, repeats: 0, targets: 0 });
  });

  it('keeps the old steps when creating the new ones fails', async () => {
    // PostgreSQL rejects a NUL character in text, which the schema and Prisma
    // accept: the write fails in the database, after the old steps are
    // deleted and the first new ones created, so only a rollback keeps them
    await expect(
      replaceSteps(newSteps({ notes: 'cool\u0000down' })),
    ).rejects.toThrow();

    const steps = await topSteps();
    expect(steps.map((s) => s.workoutStepId)).toEqual([3301, 3302]);
    expect(steps[1].repeatBlock).toMatchObject({
      workoutRepeatId: 3401,
      repetitions: 5,
    });
    expect(
      steps[1].repeatBlock!.childSteps.map((c) => c.workoutStepId),
    ).toEqual([3303]);
    expect(steps[1].repeatBlock!.childSteps[0].targets).toHaveLength(1);
    expect(await prisma.workoutStep.count()).toBe(3);
    expect(await orphans()).toEqual({ steps: 0, repeats: 0, targets: 0 });
  });
});
