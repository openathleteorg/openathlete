import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  EXERCISE_SIDE,
  McpScope,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  mapWorkoutDtoToPrisma,
  strengthSteps,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { CustomExerciseService } from 'src/modules/core/services/custom-exercise.service';
import { CycleService } from 'src/modules/core/services/cycle.service';
import { EventBatchService } from 'src/modules/core/services/event-batch.service';
import { EventBulkService } from 'src/modules/core/services/event-bulk.service';
import { EventSeriesService } from 'src/modules/core/services/event-series.service';
import { EventService } from 'src/modules/core/services/event.service';
import { MetricService } from 'src/modules/core/services/metric.service';
import { RecordService } from 'src/modules/core/services/record.service';
import { StatisticsService } from 'src/modules/core/services/statistics.service';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { TrainingZoneService } from 'src/modules/core/services/training-zone.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { McpServerFactory } from './mcp-server.factory';
import { WORKOUT_STEPS_INCLUDE } from './presenters';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

/** A user who neither coaches nor is coached by the fixture's users */
const STRANGER_USER_ID = 1003;
const STRANGER_ATHLETE_ID = 2003;

type ToolResult = {
  isError?: boolean;
  content: { type: string; text: string }[];
  structuredContent?: Record<string, unknown>;
};

describe('MCP tools (PostgreSQL)', () => {
  let prisma: PrismaService;
  let factory: McpServerFactory;
  let events: EventService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [{ athleteId: COACH_ATHLETE_ID }],
  } as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    events = new EventService(
      prisma,
      abilities,
      new EventEmitter2(),
      {} as never,
      {} as never,
      { deleteExportsForWorkout: jest.fn() } as never,
      {} as never,
    );
    const bulk = new EventBulkService(prisma, abilities, events);
    factory = new McpServerFactory(
      prisma,
      abilities,
      events,
      bulk,
      new EventBatchService(prisma, abilities, events, bulk),
      new EventSeriesService(prisma, abilities, events, bulk),
      new CycleService(prisma, abilities),
      new MetricService(prisma, abilities),
      new TrainingLoadService(prisma, abilities),
      new TrainingZoneService(prisma, abilities),
      new RecordService(prisma, abilities),
      new StatisticsService(
        prisma,
        abilities,
        new TrainingLoadService(prisma, abilities),
      ),
      new CustomExerciseService(prisma),
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
    await prisma.user.updateMany({ data: { timeZone: 'Europe/Paris' } });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "user" (user_id, email, password, first_name, last_name, updated_at) VALUES (${STRANGER_USER_ID}, 'stranger@example.com', 'x', 'Str', 'Anger', now())`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO athlete (athlete_id, user_id, updated_at) VALUES (${STRANGER_ATHLETE_ID}, ${STRANGER_USER_ID}, now())`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO training_zone (training_zone_id, name, description, index, type, color, athlete_id, updated_at) VALUES (2203, 'Theirs', '', 0, 'HEARTRATE', '#000', ${STRANGER_ATHLETE_ID}, now())`,
    );
  });

  /** An MCP client connected to a server built for `user` */
  async function connect(
    user: AuthUser,
    scopes: McpScope[] = ['read', 'write'],
  ) {
    const server = factory.create({ user, scopes, grantId: 1 });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(clientSide);
    const call = async (name: string, args: Record<string, unknown> = {}) =>
      (await client.callTool({ name, arguments: args })) as ToolResult;
    return { client, call };
  }

  const data = <T = Record<string, unknown>>(result: ToolResult) => {
    if (result.isError) throw new Error(result.content[0].text);
    return result.structuredContent as T;
  };
  const errorOf = (result: ToolResult) => {
    expect(result.isError).toBe(true);
    return result.content[0].text;
  };

  it('offers write tools only to agents allowed to write', async () => {
    const reader = await connect(athlete, ['read']);
    const names = (await reader.client.listTools()).tools.map(
      (tool) => tool.name,
    );
    expect(names).toContain('get_calendar');
    expect(names).not.toContain('plan_sessions');

    const writer = await connect(athlete);
    const tools = (await writer.client.listTools()).tools;
    expect(tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        'plan_sessions',
        'delete_sessions',
        'create_period',
      ]),
    );
    // Every tool documents its output and how it behaves
    for (const tool of tools) {
      expect(tool.outputSchema).toBeDefined();
      expect(tool.annotations?.readOnlyHint).toBe(
        ![
          'plan_sessions',
          'update_session',
          'move_sessions',
          'copy_sessions',
          'copy_sessions_to_athletes',
          'repeat_session',
          'delete_sessions',
          'create_period',
          'update_period',
          'delete_period',
          'log_metrics',
          'update_training_zone',
        ].includes(tool.name),
      );
      // ChatGPT's app review requires every tool to say whether it destroys data
      expect(typeof tool.annotations?.destructiveHint).toBe('boolean');
    }
  });

  it('plans sessions at local times, with their structured workouts', async () => {
    const { call } = await connect(athlete);
    const result = data<{ items: Record<string, unknown>[] }>(
      await call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-27',
            time: '18:30',
            name: 'Threshold',
            sport: 'RUNNING',
            rpe: 8,
            description: 'Steady effort',
            workoutSteps: [
              {
                kind: 'warmup',
                durationSeconds: 900,
                targets: [{ type: 'zone', zoneId: 2201 }],
              },
              {
                kind: 'repeat',
                times: 3,
                steps: [
                  {
                    kind: 'work',
                    durationSeconds: 600,
                    targets: [{ type: 'pace', min: '4:10', max: '4:00' }],
                  },
                  { kind: 'recovery', durationSeconds: 120 },
                ],
              },
              { kind: 'cooldown', durationSeconds: 600 },
            ],
          },
          {
            type: 'race',
            date: '2026-11-15',
            name: '10 km',
            sport: 'RUNNING',
            distanceKm: 10,
            priority: 'A',
          },
          { type: 'note', date: '2026-10-28', name: 'Rest well' },
        ],
      }),
    );

    expect(
      result.items.map((item) => [item.type, item.date, item.start]),
    ).toEqual([
      // After the end of summer time: UTC+1
      ['training', '2026-10-27', '2026-10-27T18:30+01:00'],
      ['note', '2026-10-28', '2026-10-28T12:00+01:00'],
      ['race', '2026-11-15', '2026-11-15T12:00+01:00'],
    ]);
    expect(result.items[0]).toMatchObject({
      // 15 + 3 × 12 + 10 minutes
      plannedMinutes: 61,
      plannedRpe: 8,
      workout:
        'warmup 15min @ Z1 (heartrate) · 3×(work 10min @ 4:10-4:00/km, recovery 2min) · cooldown 10min',
    });

    const stored = await prisma.event.findFirstOrThrow({
      where: { name: 'Threshold' },
      include: {
        training: {
          include: {
            workout: {
              include: {
                steps: {
                  include: {
                    targets: true,
                    repeatBlock: {
                      include: { childSteps: { include: { targets: true } } },
                    },
                  },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    expect(stored.startDate.toISOString()).toBe('2026-10-27T17:30:00.000Z');
    expect(stored.training).toMatchObject({ goalDuration: 3660, goalRpe: 0.8 });
    const [warmup, repeat] = stored.training!.workout!.steps;
    expect(warmup.targets[0]).toMatchObject({
      targetType: 'ZONE',
      targetValue: 2201,
    });
    expect(repeat.repeatBlock?.repetitions).toBe(3);
    const pace = repeat.repeatBlock!.childSteps.find(
      (step) => step.stepType === 'INTERVAL_ACTIVE',
    )!.targets[0];
    expect(pace.targetMin).toBeCloseTo(1000 / 250);
    expect(pace.targetMax).toBeCloseTo(1000 / 240);

    // The session reads back in the format it was written
    const session = data<{ workoutSteps: unknown[] }>(
      await call('get_session', { eventId: stored.eventId }),
    );
    expect(session.workoutSteps[1]).toEqual({
      kind: 'repeat',
      times: 3,
      steps: [
        {
          kind: 'work',
          durationSeconds: 600,
          targets: [{ type: 'pace', min: '4:10', max: '4:00' }],
        },
        { kind: 'recovery', durationSeconds: 120 },
      ],
    });
  });

  it('reads capacities with the figures of the statistics page', async () => {
    const { call } = await connect(athlete);
    const result = data<{
      verticalSpeedBySlope: unknown[];
      heartRateByOutput: { unit: string };
    }>(await call('get_capacities', { sport: 'RUNNING' }));
    expect(result.verticalSpeedBySlope).toEqual([]);
    expect(result.heartRateByOutput.unit).toBe('km/h');
  });

  it('saves nothing when one session is wrong, and says what is', async () => {
    const { call } = await connect(athlete);
    const before = await prisma.event.count();
    const message = errorOf(
      await call('plan_sessions', {
        sessions: [
          { date: '2026-10-27', name: 'Fine', sport: 'RUNNING' },
          {
            date: '2026-10-28',
            name: 'Foreign zone',
            sport: 'RUNNING',
            workoutSteps: [
              { kind: 'steady', targets: [{ type: 'zone', zoneId: 2203 }] },
            ],
          },
          { date: '2026-10-29', name: 'No sport' },
        ],
      }),
    );
    expect(message).toContain('sessions[1]: zone 2203');
    expect(message).toContain('sessions[2]: sport is required');
    expect(message).toContain('Nothing was saved');
    expect(await prisma.event.count()).toBe(before);
  });

  it("works on a coached athlete's calendar, never on a stranger's", async () => {
    const coach = {
      userId: COACH_USER_ID,
      email: 'coach@example.com',
      athlete: { athleteId: COACH_ATHLETE_ID },
      coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
    } as AuthUser;
    const { call } = await connect(coach);

    const athletes = data<{
      athletes: { athleteId: number; isYou: boolean }[];
    }>(await call('list_athletes'));
    expect(
      athletes.athletes.map((entry) => [entry.athleteId, entry.isYou]),
    ).toEqual([
      [COACH_ATHLETE_ID, true],
      [DELETED_ATHLETE_ID, false],
    ]);

    const planned = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        athleteId: DELETED_ATHLETE_ID,
        sessions: [
          { date: '2026-10-27', name: 'From the coach', sport: 'CYCLING' },
        ],
      }),
    );
    expect(
      (
        await prisma.event.findUniqueOrThrow({
          where: { eventId: planned.items[0].eventId },
        })
      ).athleteId,
    ).toBe(DELETED_ATHLETE_ID);

    expect(
      errorOf(
        await call('get_calendar', {
          athleteId: STRANGER_ATHLETE_ID,
          from: '2026-10-01',
          to: '2026-10-31',
        }),
      ),
    ).toContain(`No access to athlete ${STRANGER_ATHLETE_ID}`);
    expect(
      errorOf(
        await call('plan_sessions', {
          athleteId: STRANGER_ATHLETE_ID,
          sessions: [
            { date: '2026-10-27', name: 'Intrusion', sport: 'RUNNING' },
          ],
        }),
      ),
    ).toContain('No access');
    const strangers = await prisma.event.create({
      data: {
        name: 'Private',
        type: 'NOTE',
        startDate: new Date(),
        endDate: new Date(),
        athleteId: STRANGER_ATHLETE_ID,
        note: { create: { description: 'x' } },
      },
    });
    expect(
      errorOf(await call('get_session', { eventId: strangers.eventId })),
    ).toContain('not found');
    expect(
      errorOf(await call('delete_sessions', { eventIds: [strangers.eventId] })),
    ).toContain('not found');
    expect(
      errorOf(
        await call('update_training_zone', { zoneId: 2203, min: 1, max: 2 }),
      ),
    ).toContain('not found');
  });

  it("copies a coach's sessions to their athletes, saying what each lacks", async () => {
    const coach = {
      userId: COACH_USER_ID,
      email: 'coach@example.com',
      athlete: { athleteId: COACH_ATHLETE_ID },
      coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
    } as AuthUser;
    const { call } = await connect(coach);
    const planned = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        sessions: [
          { date: '2026-12-01', time: '07:00', name: 'Easy', sport: 'RUNNING' },
          { date: '2026-12-03', time: '07:00', name: 'Long', sport: 'RUNNING' },
        ],
      }),
    );

    const copied = data<{
      batchId: string;
      created: number;
      athletes: { athleteId: number }[];
    }>(
      await call('copy_sessions_to_athletes', {
        eventIds: planned.items.map((item) => item.eventId),
        athleteIds: [DELETED_ATHLETE_ID],
        date: '2026-12-08',
        time: '18:00',
      }),
    );
    expect(copied.created).toBe(2);
    expect(copied.batchId).toBeTruthy();
    expect(copied.athletes.map((row) => row.athleteId)).toEqual([
      DELETED_ATHLETE_ID,
    ]);
    const theirs = await prisma.event.findMany({
      where: { athleteId: DELETED_ATHLETE_ID, name: { in: ['Easy', 'Long'] } },
      orderBy: { startDate: 'asc' },
    });
    // Two days apart, as planned, at the time asked in Paris
    expect(theirs.map((event) => event.startDate.toISOString())).toEqual([
      '2026-12-08T17:00:00.000Z',
      '2026-12-10T17:00:00.000Z',
    ]);

    expect(
      errorOf(
        await call('copy_sessions_to_athletes', {
          eventIds: [planned.items[0].eventId],
          athleteIds: [STRANGER_ATHLETE_ID],
          date: '2026-12-08',
        }),
      ),
    ).not.toBe('');
    expect(
      await prisma.event.count({ where: { athleteId: STRANGER_ATHLETE_ID } }),
    ).toBe(0);
  });

  it('keeps history: done sessions and activities are not deleted', async () => {
    const { call } = await connect(athlete);
    expect(
      errorOf(await call('delete_sessions', { eventIds: [3001] })),
    ).toContain('done sessions are kept');
    expect(
      errorOf(await call('delete_sessions', { eventIds: [3002] })),
    ).toContain('recorded activities cannot be changed');
    // Nor the events behind workout templates
    expect(
      errorOf(await call('delete_sessions', { eventIds: [3005] })),
    ).toContain('not found');
    expect(
      await prisma.event.count({
        where: { eventId: { in: [3001, 3002, 3005] } },
      }),
    ).toBe(3);
  });

  it('moves, repeats and edits a session and the following ones', async () => {
    const { call } = await connect(athlete);
    const [easy] = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-06',
            time: '07:00',
            name: 'Easy',
            sport: 'RUNNING',
            durationMinutes: 45,
          },
        ],
      }),
    ).items;

    const moved = data<{ items: { start: string }[] }>(
      await call('move_sessions', { eventIds: [easy.eventId], days: 1 }),
    );
    expect(moved.items[0].start).toBe('2026-10-07T07:00+02:00');

    const occurrences = data<{ items: { eventId: number; start: string }[] }>(
      await call('repeat_session', {
        eventId: easy.eventId,
        until: '2026-10-28',
      }),
    ).items;
    // Same local time after the end of summer time
    expect(occurrences.map((item) => item.start)).toEqual([
      '2026-10-14T07:00+02:00',
      '2026-10-21T07:00+02:00',
      '2026-10-28T07:00+01:00',
    ]);

    const edited = data<{ items: { name: string; start: string }[] }>(
      await call('update_session', {
        eventId: occurrences[1].eventId,
        scope: 'following',
        name: 'Easy evening',
        time: '19:00',
      }),
    ).items;
    expect(edited.map((item) => [item.name, item.start])).toEqual([
      ['Easy evening', '2026-10-21T19:00+02:00'],
      ['Easy evening', '2026-10-28T19:00+01:00'],
    ]);

    expect(
      data(
        await call('delete_sessions', {
          eventIds: [occurrences[0].eventId],
          scope: 'following',
        }),
      ),
    ).toEqual({ deleted: 3 });
    expect(
      await prisma.event.count({ where: { name: { startsWith: 'Easy' } } }),
    ).toBe(1);
  });

  it('keeps a duration set apart from the workout when the steps change', async () => {
    const { call } = await connect(athlete);
    const steps = (minutes: number) => [
      { kind: 'steady', durationSeconds: minutes * 60 },
    ];
    const [byHand, following] = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-08',
            name: 'Swim 45',
            sport: 'SWIMMING',
            durationMinutes: 45,
            workoutSteps: steps(24),
          },
          {
            date: '2026-10-09',
            name: 'Swim steps',
            sport: 'SWIMMING',
            workoutSteps: steps(24),
          },
        ],
      }),
    ).items;

    for (const session of [byHand, following]) {
      await call('update_session', {
        eventId: session.eventId,
        workoutSteps: steps(30),
      });
    }
    const goalOf = async (eventId: number) =>
      (await prisma.eventTraining.findUniqueOrThrow({ where: { eventId } }))
        .goalDuration;
    expect(await goalOf(byHand.eventId)).toBe(45 * 60);
    expect(await goalOf(following.eventId)).toBe(30 * 60);
  });

  it('reads a strength session, writes it back unchanged', async () => {
    const { call } = await connect(athlete);
    const squat = {
      exerciseRef: 'c:barbell-full-squat',
      name: 'Barbell full squat',
      tempo: '3-1-X-0',
      side: null,
      notes: null,
    };
    const steps = strengthSteps([
      {
        kind: 'exercise',
        exercise: {
          ...squat,
          sets: [1, 2, 3].map(() => ({
            work: { type: WORKOUT_DURATION_TYPE.REPS as const, value: 5 },
            load: 61.2349,
            rpe: 8,
            rest: 90,
          })),
        },
      },
      {
        kind: 'group',
        group: WORKOUT_REPEAT_KIND.EMOM,
        name: 'Finisher',
        rounds: 8,
        intervalSeconds: 60,
        timeCapSeconds: null,
        roundRest: null,
        exercises: ['c:burpee', 'c:pull-up'].map((ref) => ({
          ...squat,
          exerciseRef: ref,
          tempo: null,
          side: EXERCISE_SIDE.EACH,
          sets: [
            {
              work: { type: WORKOUT_DURATION_TYPE.REPS as const, value: 6 },
              load: null,
              rpe: null,
              rest: null,
            },
          ],
        })),
      },
      // A pyramid: sets that differ, each with its rest
      {
        kind: 'exercise',
        exercise: {
          ...squat,
          exerciseRef: 'c:barbell-bench-press',
          name: 'Bench press',
          tempo: null,
          sets: [
            [10, 60],
            [8, 70],
            [6, 80],
          ].map(([value, load]) => ({
            work: { type: WORKOUT_DURATION_TYPE.REPS as const, value },
            load,
            rpe: null,
            rest: 120,
          })),
        },
      },
      // A superset with a rest between its exercises and between rounds
      {
        kind: 'group',
        group: WORKOUT_REPEAT_KIND.SUPERSET,
        name: null,
        rounds: 4,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 60,
        exercises: [
          ['c:pull-up', 8, 15],
          ['c:push-up', 15, null],
        ].map(([ref, value, rest]) => ({
          ...squat,
          exerciseRef: ref as string,
          tempo: null,
          sets: [
            {
              work: {
                type: WORKOUT_DURATION_TYPE.REPS as const,
                value: value as number,
              },
              load: null,
              rpe: null,
              rest: rest as number | null,
            },
          ],
        })),
      },
    ]);
    const { eventId } = await prisma.event.create({
      data: {
        name: 'Strength',
        type: 'TRAINING',
        startDate: new Date('2026-10-12T16:00:00Z'),
        endDate: new Date('2026-10-12T17:00:00Z'),
        athleteId: DELETED_ATHLETE_ID,
        training: {
          create: {
            sport: 'STRENGTH',
            workout: { create: mapWorkoutDtoToPrisma({ steps }) },
          },
        },
      },
    });
    // Without ids, targets in no set order: what is stored, not where
    const rowsOf = async () => {
      const { workout } = await prisma.eventTraining.findUniqueOrThrow({
        where: { eventId },
        select: { workout: { include: WORKOUT_STEPS_INCLUDE } },
      });
      const clean = (value: unknown, key = ''): unknown => {
        if (Array.isArray(value)) {
          const items = value.map((entry) => clean(entry));
          // Steps keep their order; targets have none
          return key === 'targets'
            ? items.sort((a, b) =>
                JSON.stringify(a).localeCompare(JSON.stringify(b)),
              )
            : items;
        }
        if (value && typeof value === 'object' && !(value instanceof Date)) {
          return Object.fromEntries(
            Object.entries(value)
              .filter(([name]) => !/Id$|^(createdAt|updatedAt)$/.test(name))
              .map(([name, entry]) => [name, clean(entry, name)]),
          );
        }
        return value;
      };
      return clean(workout?.steps);
    };
    const before = await rowsOf();

    const { workoutSteps } = data<{ workoutSteps: unknown[] }>(
      await call('get_session', { eventId }),
    );
    expect(workoutSteps.map((item) => (item as { kind: string }).kind)).toEqual(
      ['exercise', 'group', 'exercise', 'group'],
    );
    data(await call('update_session', { eventId, workoutSteps }));

    expect(await rowsOf()).toEqual(before);
  });

  /** Custom exercises of the athlete, their coach and a stranger */
  async function customExercises() {
    const make = async (userId: number, name: string) =>
      `u:${
        (
          await prisma.customExercise.create({
            data: { name, userId, bodyPart: 'chest', instructions: 'Press' },
          })
        ).customExerciseId
      }`;
    return {
      own: await make(DELETED_USER_ID, 'Own press'),
      coachs: await make(COACH_USER_ID, 'Coach press'),
      strangers: await make(STRANGER_USER_ID, 'Stranger press'),
    };
  }

  /** What a session stores for its exercises: ref and name of each step */
  async function storedExercises(eventId: number) {
    const { workout } = await prisma.eventTraining.findUniqueOrThrow({
      where: { eventId },
      select: { workout: { include: WORKOUT_STEPS_INCLUDE } },
    });
    return (workout?.steps ?? []).map((step) => [step.exerciseRef, step.name]);
  }

  const set = { work: { type: 'REPS', value: 5 } };
  const strength = (...refs: string[]) =>
    refs.map((exerciseRef) => ({
      kind: 'exercise',
      exercise: { exerciseRef, sets: [set] },
    }));

  it('lists the exercise library to read-only agents, with the custom exercises they may read', async () => {
    const mine = await customExercises();
    const reader = await connect(athlete, ['read']);
    const tools = (await reader.client.listTools()).tools;
    for (const name of ['list_exercises', 'get_exercise']) {
      expect(
        tools.find((tool) => tool.name === name)?.annotations,
      ).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    }

    const listed = data<{
      count: number;
      exercises: { exerciseRef: string; name: string; custom?: boolean }[];
    }>(await reader.call('list_exercises', { query: 'press', limit: 100 }));
    const custom = listed.exercises.filter((exercise) => exercise.custom);
    expect(custom.map((exercise) => exercise.exerciseRef).sort()).toEqual(
      [mine.own, mine.coachs].sort(),
    );
    // Custom exercises come first, then the catalog
    expect(listed.exercises.slice(0, 2).every((entry) => entry.custom)).toBe(
      true,
    );
    expect(listed.exercises.map((entry) => entry.exerciseRef)).not.toContain(
      mine.strangers,
    );
    expect(listed.count).toBeGreaterThan(2);

    const coach = await connect(
      {
        userId: COACH_USER_ID,
        email: 'coach@example.com',
        athlete: { athleteId: COACH_ATHLETE_ID },
        coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
      } as AuthUser,
      ['read'],
    );
    const coachList = data<{ exercises: { exerciseRef: string }[] }>(
      await coach.call('list_exercises', { query: 'press', limit: 100 }),
    );
    const seen = coachList.exercises.map((entry) => entry.exerciseRef);
    expect(seen).toEqual(expect.arrayContaining([mine.own, mine.coachs]));
    expect(seen).not.toContain(mine.strangers);

    const detail = data<Record<string, unknown>>(
      await reader.call('get_exercise', { exerciseRef: mine.coachs }),
    );
    expect(detail).toMatchObject({
      name: 'Coach press',
      instructions: 'Press',
      custom: true,
    });
    expect(
      errorOf(
        await reader.call('get_exercise', { exerciseRef: mine.strangers }),
      ),
    ).toBe(
      `unknown exerciseRef "${mine.strangers}": use list_exercises for valid refs`,
    );
    expect(
      data(await reader.call('get_exercise', { exerciseRef: 'c:burpee' })),
    ).toMatchObject({ name: 'Burpee' });
  });

  it('does not share custom exercises between two athletes of one coach', async () => {
    const SIBLING_USER_ID = 1004;
    const SIBLING_ATHLETE_ID = 2004;
    // The fixture links both ways (the athlete also "coaches" their coach):
    // keep one row, coach -> athlete, so that each half of the lookup is
    // needed to see the other's exercises
    await prisma.coachAthlete.deleteMany({
      where: { userId: DELETED_USER_ID },
    });
    await prisma.$executeRawUnsafe(
      `INSERT INTO "user" (user_id, email, password, first_name, last_name, updated_at) VALUES (${SIBLING_USER_ID}, 'sibling@example.com', 'x', 'Sib', 'Ling', now())`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO athlete (athlete_id, user_id, updated_at) VALUES (${SIBLING_ATHLETE_ID}, ${SIBLING_USER_ID}, now())`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO coach_athlete (user_id, athlete_id, updated_at) VALUES (${COACH_USER_ID}, ${SIBLING_ATHLETE_ID}, now())`,
    );
    const mine = await customExercises();
    const siblings = `u:${
      (
        await prisma.customExercise.create({
          data: {
            name: 'Sibling press',
            userId: SIBLING_USER_ID,
            bodyPart: 'chest',
            instructions: 'Press',
          },
        })
      ).customExerciseId
    }`;

    const refsOf = async (user: AuthUser) => {
      const { call } = await connect(user, ['read']);
      return data<{ exercises: { exerciseRef: string }[] }>(
        await call('list_exercises', { query: 'press', limit: 100 }),
      ).exercises.map((entry) => entry.exerciseRef);
    };

    // The athlete reads their coach's, not their coach's other athlete's
    const asAthlete = await refsOf(athlete);
    expect(asAthlete).toEqual(expect.arrayContaining([mine.own, mine.coachs]));
    expect(asAthlete).not.toContain(siblings);
    expect(asAthlete).not.toContain(mine.strangers);

    const reader = await connect(athlete, ['read']);
    expect(
      errorOf(await reader.call('get_exercise', { exerciseRef: siblings })),
    ).toBe(
      `unknown exerciseRef "${siblings}": use list_exercises for valid refs`,
    );

    const writer = await connect(athlete);
    const before = await prisma.event.count();
    expect(
      errorOf(
        await writer.call('plan_sessions', {
          sessions: [
            {
              date: '2026-10-27',
              name: 'Press',
              sport: 'STRENGTH',
              workoutSteps: strength(siblings),
            },
          ],
        }),
      ),
    ).toContain(`unknown exerciseRef "${siblings}"`);
    expect(await prisma.event.count()).toBe(before);

    // The coach reads their own athletes': both
    const asCoach = await refsOf({
      userId: COACH_USER_ID,
      email: 'coach@example.com',
      athlete: { athleteId: COACH_ATHLETE_ID },
      coachAthletes: [
        { athleteId: DELETED_ATHLETE_ID },
        { athleteId: SIBLING_ATHLETE_ID },
      ],
    } as AuthUser);
    expect(asCoach).toEqual(
      expect.arrayContaining([mine.own, mine.coachs, siblings]),
    );
    expect(asCoach).not.toContain(mine.strangers);
  });

  it('refuses an empty exerciseRef, saving and changing nothing', async () => {
    const { call } = await connect(athlete);
    const refused = async (promise: Promise<ToolResult>) => {
      // Refused by the input schema: an error result, or a protocol error
      const result = await promise.catch(() => undefined);
      if (result) expect(result.isError).toBe(true);
    };

    const before = await prisma.event.count();
    await refused(
      call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-27',
            name: 'Empty',
            sport: 'STRENGTH',
            workoutSteps: strength(''),
          },
        ],
      }),
    );
    expect(await prisma.event.count()).toBe(before);

    const planned = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-27',
            name: 'Strength',
            sport: 'STRENGTH',
            workoutSteps: strength('c:burpee'),
          },
        ],
      }),
    );
    const { eventId } = planned.items[0];
    const stored = await storedExercises(eventId);
    await refused(
      call('update_session', { eventId, workoutSteps: strength('') }),
    );
    await refused(
      call('update_session', {
        eventId,
        workoutSteps: [{ kind: 'work', reps: 5, exerciseRef: '' }],
      }),
    );
    expect(await storedExercises(eventId)).toEqual(stored);
    expect(await prisma.event.count()).toBe(before + 1);
  });

  it('reports a bad zone and a bad exercise together, and loads custom exercises once', async () => {
    const { own } = await customExercises();
    const list = jest.spyOn(CustomExerciseService.prototype, 'list');
    try {
      const { call } = await connect(athlete);
      const before = await prisma.event.count();
      const message = errorOf(
        await call('plan_sessions', {
          sessions: [
            {
              date: '2026-10-27',
              name: 'Both wrong',
              sport: 'STRENGTH',
              workoutSteps: [
                {
                  kind: 'work',
                  durationSeconds: 60,
                  targets: [{ type: 'zone', zoneId: 999999 }],
                },
                ...strength('c:back-squatt'),
              ],
            },
            {
              date: '2026-10-28',
              name: 'Fine',
              sport: 'STRENGTH',
              workoutSteps: strength(own),
            },
            {
              date: '2026-10-29',
              name: 'Fine too',
              sport: 'STRENGTH',
              workoutSteps: strength(own, 'u:98765'),
            },
          ],
        }),
      );
      expect(message).toContain(
        'sessions[0]: zone 999999 is not one of the athlete',
      );
      expect(message).toContain(
        'sessions[0]: unknown exerciseRef "c:back-squatt"',
      );
      expect(message).toContain('sessions[2]: unknown exerciseRef "u:98765"');
      expect(message).not.toContain('sessions[1]');
      expect(await prisma.event.count()).toBe(before);
      expect(list).toHaveBeenCalledTimes(1);
    } finally {
      list.mockRestore();
    }
  });

  it('names flat steps that have a ref', async () => {
    const { call } = await connect(athlete);
    const planned = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-27',
            name: 'Flat',
            sport: 'STRENGTH',
            workoutSteps: [{ kind: 'work', reps: 5, exerciseRef: 'c:burpee' }],
          },
        ],
      }),
    );
    expect(await storedExercises(planned.items[0].eventId)).toEqual([
      ['c:burpee', 'Burpee'],
    ]);
  });

  it('refuses unknown exercises when planning, saving nothing', async () => {
    const { strangers } = await customExercises();
    const { call } = await connect(athlete);
    const before = await prisma.event.count();
    const message = errorOf(
      await call('plan_sessions', {
        sessions: [
          { date: '2026-10-27', name: 'Fine', sport: 'STRENGTH' },
          {
            date: '2026-10-28',
            name: 'Typo',
            sport: 'STRENGTH',
            workoutSteps: strength('c:burpee', 'c:back-squatt', strangers),
          },
        ],
      }),
    );
    expect(message).toContain(
      `sessions[1]: unknown exerciseRef "c:back-squatt", "${strangers}": use list_exercises for valid refs`,
    );
    expect(message).toContain('Nothing was saved');
    expect(await prisma.event.count()).toBe(before);
  });

  it('fills exercise names from the catalog and custom exercises, and keeps a given one', async () => {
    const { own } = await customExercises();
    const { call } = await connect(athlete);
    const planned = data<{ items: { eventId: number }[] }>(
      await call('plan_sessions', {
        sessions: [
          {
            date: '2026-10-27',
            name: 'Strength',
            sport: 'STRENGTH',
            workoutSteps: [
              ...strength('c:burpee', own),
              {
                kind: 'exercise',
                exercise: {
                  exerciseRef: 'c:pull-up',
                  name: 'Strict pull-up',
                  sets: [set],
                },
              },
            ],
          },
        ],
      }),
    );
    expect(await storedExercises(planned.items[0].eventId)).toEqual([
      ['c:burpee', 'Burpee'],
      [own, 'Own press'],
      ['c:pull-up', 'Strict pull-up'],
    ]);
  });

  it('keeps exercises a session already stores when it is changed, but no new unknown ones', async () => {
    const { strangers } = await customExercises();
    // Planned when this exercise still existed, or written by another coach
    const gone = 'u:98765';
    const steps = strengthSteps(
      [gone, strangers].map((exerciseRef) => ({
        kind: 'exercise' as const,
        exercise: {
          exerciseRef,
          name: 'Kept name',
          sets: [
            {
              work: { type: WORKOUT_DURATION_TYPE.REPS as const, value: 5 },
              load: null,
              rpe: null,
              rest: null,
            },
          ],
          tempo: null,
          side: null,
          notes: null,
        },
      })),
    );
    const { eventId } = await prisma.event.create({
      data: {
        name: 'Strength',
        type: 'TRAINING',
        startDate: new Date('2026-10-12T16:00:00Z'),
        endDate: new Date('2026-10-12T17:00:00Z'),
        athleteId: DELETED_ATHLETE_ID,
        training: {
          create: {
            sport: 'STRENGTH',
            workout: { create: mapWorkoutDtoToPrisma({ steps }) },
          },
        },
      },
    });
    const { call } = await connect(athlete);
    const { workoutSteps } = data<{ workoutSteps: unknown[] }>(
      await call('get_session', { eventId }),
    );
    data(await call('update_session', { eventId, workoutSteps }));
    expect(await storedExercises(eventId)).toEqual([
      [gone, 'Kept name'],
      [strangers, 'Kept name'],
    ]);

    expect(
      errorOf(
        await call('update_session', {
          eventId,
          workoutSteps: strength(gone, 'u:98766'),
        }),
      ),
    ).toBe('unknown exerciseRef "u:98766": use list_exercises for valid refs');
    expect(await storedExercises(eventId)).toHaveLength(2);

    // A kept ref sent without a name keeps the name stored, not "u:98765"
    data(
      await call('update_session', { eventId, workoutSteps: strength(gone) }),
    );
    expect(await storedExercises(eventId)).toEqual([[gone, 'Kept name']]);
  });

  it('still lets the app and REST store a well-formed ref the catalog lacks', async () => {
    const created = await events.createEvent(athlete, {
      type: 'TRAINING',
      name: 'Strength',
      sport: 'STRENGTH',
      description: '',
      startDate: new Date('2026-10-12T16:00:00Z'),
      endDate: new Date('2026-10-12T17:00:00Z'),
      athleteId: DELETED_ATHLETE_ID,
      workout: {
        steps: [
          {
            stepType: 'INTERVAL_ACTIVE',
            name: 'Mystery',
            exerciseRef: 'c:no-such-exercise',
            durationType: 'REPS',
            durationValue: 5,
            targets: [],
          },
        ],
      },
    } as never);
    expect(await storedExercises(created.eventId)).toEqual([
      ['c:no-such-exercise', 'Mystery'],
    ]);
  });

  it('records an illness and lists the sessions to adapt', async () => {
    const { call } = await connect(athlete);
    await call('plan_sessions', {
      sessions: [
        { date: '2026-10-12', name: 'Before', sport: 'RUNNING' },
        { date: '2026-10-13', name: 'During', sport: 'RUNNING' },
        {
          date: '2026-10-15',
          time: '21:00',
          name: 'Last day',
          sport: 'RUNNING',
        },
        { date: '2026-10-16', name: 'After', sport: 'RUNNING' },
      ],
    });
    const period = data<{
      periodId: number;
      sessionsInside: { name: string }[];
    }>(
      await call('create_period', {
        kind: 'illness',
        startDate: '2026-10-13',
        endDate: '2026-10-15',
        description: 'Fever',
      }),
    );
    expect(period).toMatchObject({
      name: 'Illness',
      kind: 'illness',
      startDate: '2026-10-13',
      endDate: '2026-10-15',
    });
    expect(period.sessionsInside.map((session) => session.name)).toEqual([
      'During',
      'Last day',
    ]);
    const stored = await prisma.cycle.findUniqueOrThrow({
      where: { cycleId: period.periodId },
    });
    expect(stored.kind).toBe('ILLNESS');

    const shorter = data<{ endDate: string; sessionsInside: unknown[] }>(
      await call('update_period', {
        periodId: period.periodId,
        endDate: '2026-10-13',
      }),
    );
    expect(shorter).toMatchObject({
      endDate: '2026-10-13',
      sessionsInside: [{ name: 'During' }],
    });
  });

  it('colours periods with the palette of the web app', async () => {
    const { call } = await connect(athlete);
    const block = data<{ periodId: number; color: string }>(
      await call('create_period', {
        kind: 'training',
        startDate: '2026-11-02',
        endDate: '2026-11-15',
        name: 'Half marathon block',
        color: 'orange',
      }),
    );
    expect(block.color).toBe('orange');
    const stored = async () =>
      (
        await prisma.cycle.findUniqueOrThrow({
          where: { cycleId: block.periodId },
        })
      ).color;
    expect(await stored()).toBe('#f97316');

    expect(
      data<{ color: string }>(
        await call('update_period', {
          periodId: block.periodId,
          color: 'teal',
        }),
      ).color,
    ).toBe('teal');
    expect(await stored()).toBe('#14b8a6');

    const taper = data<{ color: string }>(
      await call('create_period', {
        kind: 'training',
        startDate: '2026-11-16',
        endDate: '2026-11-29',
      }),
    );
    expect(taper.color).toBe('blue');
    // A colour set through the REST API outside the palette stays as hex
    await prisma.cycle.update({
      where: { cycleId: block.periodId },
      data: { color: '#123ABC' },
    });
    const calendar = data<{ periods: { name: string; color: string }[] }>(
      await call('get_calendar', { from: '2026-11-01', to: '2026-11-30' }),
    );
    expect(calendar.periods).toEqual([
      expect.objectContaining({
        name: 'Half marathon block',
        color: '#123abc',
      }),
      expect.objectContaining({ name: 'Training block', color: 'blue' }),
    ]);
    expect(
      errorOf(
        await call('update_period', {
          periodId: block.periodId,
          color: 'magenta',
        }),
      ),
    ).toContain('color');
  });

  it('records metrics on their day and refuses the future', async () => {
    // Fourteen hours ahead of UTC: a local midday is the day before in UTC
    await prisma.user.update({
      where: { userId: DELETED_USER_ID },
      data: { timeZone: 'Pacific/Kiritimati' },
    });
    const { call } = await connect(athlete);
    const saved = data(
      await call('log_metrics', {
        entries: [
          {
            type: 'HR_REST',
            value: 48,
            date: '2026-10-01',
            notes: 'After a rest day',
          },
        ],
      }),
    );
    expect(saved).toEqual({
      saved: [{ type: 'HR_REST', value: 48, unit: 'bpm', date: '2026-10-01' }],
    });
    const history = data<{ series: { values: unknown[] }[] }>(
      await call('get_metrics', {
        types: ['HR_REST'],
        from: '2026-09-01',
        to: '2026-10-05',
      }),
    );
    expect(history.series[0].values).toEqual([
      { date: '2026-10-01', value: 48, notes: 'After a rest day' },
    ]);
    expect(
      errorOf(
        await call('log_metrics', {
          entries: [{ type: 'WEIGHT', value: 70, date: '2999-01-01' }],
        }),
      ),
    ).toContain('in the future');
  });

  it("reads the questionnaires' answers its user may read", async () => {
    const span = { from: '2026-01-01', to: '2026-01-31' };
    // The athlete reads what they answered to their coach
    const own = data<{ questionnaires: unknown[] }>(
      await (
        await connect(athlete, ['read'])
      ).call('get_questionnaire_answers', span),
    );
    expect(own.questionnaires).toEqual([
      {
        eventId: 3006,
        questionnaire: 'Hooper',
        date: '2026-01-08',
        status: 'answered',
        answers: [{ question: 'Fatigue', answer: '4 on 1-7' }],
      },
    ]);

    // As a coach, the answers to the questionnaires they wrote
    const coached = data<{ questionnaires: unknown[] }>(
      await (
        await connect(athlete, ['read'])
      ).call('get_questionnaire_answers', {
        ...span,
        athleteId: COACH_ATHLETE_ID,
      }),
    );
    expect(coached.questionnaires).toEqual([
      expect.objectContaining({
        eventId: 3007,
        status: 'answered',
        answers: [{ question: 'How was the week?', answer: 'Good week' }],
      }),
      expect.objectContaining({ eventId: 3008, status: 'missed', answers: [] }),
    ]);

    // A coach link the database no longer holds reads nothing
    const former = {
      userId: STRANGER_USER_ID,
      email: 'stranger@example.com',
      athlete: { athleteId: STRANGER_ATHLETE_ID },
      coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
    } as AuthUser;
    const none = data<{ questionnaires: unknown[] }>(
      await (
        await connect(former, ['read'])
      ).call('get_questionnaire_answers', {
        ...span,
        athleteId: DELETED_ATHLETE_ID,
      }),
    );
    expect(none.questionnaires).toEqual([]);
  });

  it('gives the context an agent plans from', async () => {
    const { call } = await connect(athlete);
    const context = data<Record<string, unknown>>(
      await call('get_athlete_context'),
    );
    expect(context).toMatchObject({
      athlete: {
        athleteId: DELETED_ATHLETE_ID,
        timeZone: 'Europe/Paris',
        isYou: true,
      },
      access: { scopes: ['read', 'write'], canWrite: true },
      zones: [
        {
          zoneId: 2201,
          type: 'HEARTRATE',
          unit: 'bpm',
          ranges: [{ min: 100, max: 130 }],
        },
      ],
      metrics: [{ type: 'WEIGHT', value: 70, unit: 'kg' }],
      injuries: [{ location: 'knee', status: 'STABLE' }],
      devices: ['GARMIN'],
    });
  });

  it('rejects malformed input with a message the agent can act on', async () => {
    const { call } = await connect(athlete);
    expect(
      errorOf(
        await call('get_calendar', { from: '2026-10-01', to: '2027-06-01' }),
      ),
    ).toContain('At most 92 days');
    expect(
      errorOf(
        await call('plan_sessions', {
          sessions: [
            {
              date: '2026-10-01',
              name: 'x',
              sport: 'RUNNING',
              workoutSteps: [
                { kind: 'work', targets: [{ type: 'pace', min: '4.30' }] },
              ],
            },
          ],
        }),
      ),
    ).toContain('m:ss');
  });
});
