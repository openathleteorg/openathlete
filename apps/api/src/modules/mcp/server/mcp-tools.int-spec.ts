import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { EventEmitter2 } from '@nestjs/event-emitter';

import { McpScope } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { CycleService } from 'src/modules/core/services/cycle.service';
import { EventBulkService } from 'src/modules/core/services/event-bulk.service';
import { EventSeriesService } from 'src/modules/core/services/event-series.service';
import { EventService } from 'src/modules/core/services/event.service';
import { MetricService } from 'src/modules/core/services/metric.service';
import { RecordService } from 'src/modules/core/services/record.service';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { TrainingZoneService } from 'src/modules/core/services/training-zone.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { McpServerFactory } from './mcp-server.factory';

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
    const events = new EventService(
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
      new EventSeriesService(prisma, abilities, events, bulk),
      new CycleService(prisma, abilities),
      new MetricService(prisma, abilities),
      new TrainingLoadService(prisma, abilities),
      new TrainingZoneService(prisma, abilities),
      new RecordService(prisma, abilities),
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
          'repeat_session',
          'delete_sessions',
          'create_period',
          'update_period',
          'delete_period',
          'log_metrics',
          'update_training_zone',
        ].includes(tool.name),
      );
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
