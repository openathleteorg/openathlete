import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  CreateTrainingPlanTemplateDto,
  SPORT_TYPE,
  TRAINING_PLAN_CONFLICT_MODE,
  TrainingPlanContent,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  applyTrainingPlanSchema,
  createTrainingPlanTemplateSchema,
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
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventService } from './event.service';
import { TrainingPlanLibraryService } from './training-plan-library.service';
import { TrainingPlanService } from './training-plan.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const BERLIN = 'Europe/Berlin';
// Plans applied in the future, whatever year the tests run in: 2030 or a
// later year with the same calendar (28 years on), so weekdays and the
// switch to summer time stay where the expectations put them
const Y =
  2030 +
  28 * Math.ceil(Math.max(0, new Date().getUTCFullYear() + 2 - 2030) / 28);

/** Two weeks: Tuesday intervals with a % FTP target, a Sunday long run, a note */
const content: TrainingPlanContent = {
  cycles: [
    {
      name: 'Build',
      description: '',
      phase: null,
      color: '#ff0000',
      weeks: [
        {
          weekNumber: 1,
          theme: 'VO2',
          sessions: [
            {
              dayOfWeek: 2,
              startTime: '18:30',
              name: 'Intervals',
              sport: SPORT_TYPE.RUNNING,
              description: '5 × 3 min',
              goalDuration: 3600,
              goalRpe: 8,
              workout: {
                steps: [
                  {
                    stepType: WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
                    durationType: WORKOUT_DURATION_TYPE.TIME,
                    durationValue: 180,
                    targets: [
                      {
                        targetType: WORKOUT_TARGET_TYPE.POWER,
                        targetMin: 105,
                        targetMax: 115,
                        metricType: 'FTP_RUNNING',
                      },
                    ],
                  },
                ],
              },
            },
            {
              dayOfWeek: 0,
              name: 'Long run',
              sport: SPORT_TYPE.TRAIL_RUNNING,
              description: '',
              goalDuration: 7200,
            },
          ],
        },
      ],
    },
    {
      name: 'Rest',
      description: '',
      phase: null,
      weeks: [
        {
          weekNumber: 2,
          sessions: [
            {
              dayOfWeek: 3,
              kind: 'NOTE',
              name: 'Check the shoes',
              sport: SPORT_TYPE.OTHER,
              description: 'Before the race',
            },
          ],
        },
      ],
    },
  ],
};

describe('training plan library (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  let library: TrainingPlanLibraryService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [{ athleteId: COACH_ATHLETE_ID }],
  } as unknown as AuthUser;
  const coach = {
    userId: COACH_USER_ID,
    email: 'coach@example.com',
    athlete: { athleteId: COACH_ATHLETE_ID },
    coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
  } as unknown as AuthUser;
  const stranger = {
    userId: 9999,
    email: 'stranger@example.com',
    athlete: { athleteId: 9999 },
    coachAthletes: [],
  } as unknown as AuthUser;

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
    library = new TrainingPlanLibraryService(prisma, abilities, events);
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
      data: { timeZone: BERLIN },
    });
  });

  const newTemplate = (
    user: AuthUser = athlete,
    overrides: Partial<CreateTrainingPlanTemplateDto> = {},
  ) =>
    library.createTemplate(
      user,
      createTrainingPlanTemplateSchema.parse({
        name: '2-week block',
        content,
        ...overrides,
      }),
    );

  const apply = async (
    templateId: number,
    body: Record<string, unknown>,
    user: AuthUser = athlete,
  ) => {
    const dto = applyTrainingPlanSchema.parse(body);
    const plan = await library.checkApply(user, templateId, dto);
    const { targets, ...options } = dto;
    return library.applyToAthlete(plan, targets[0], options);
  };

  const sessionsOf = (trainingPlanId: number) =>
    prisma.event.findMany({
      where: { trainingPlanId },
      include: {
        training: {
          include: {
            workout: { include: { steps: { include: { targets: true } } } },
          },
        },
        note: true,
        trainingWeek: true,
      },
      orderBy: { startDate: 'asc' },
    });

  it('applies a plan by its start date, at local times, in one block', async () => {
    const template = await newTemplate();
    expect(template.weeks).toBe(2);
    expect(template.sessions).toBe(3);
    expect(template.sport).toBe(SPORT_TYPE.RUNNING);

    // Monday, March 4
    const result = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
    });
    expect(result.sessions).toBe(3);

    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { trainingPlanId: result.trainingPlanId },
      include: {
        cycles: { include: { weeks: true }, orderBy: { startDate: 'asc' } },
      },
    });
    expect(plan).toMatchObject({
      status: 'ACTIVE',
      anchor: 'START',
      weekStartsOn: 1,
      templateId: template.trainingPlanTemplateId,
      // Local midnight in Berlin (UTC+1 in March)
      startDate: new Date(`${Y}-03-03T23:00:00Z`),
    });
    expect(plan.cycles.map((cycle) => cycle.name)).toEqual(['Build', 'Rest']);
    expect(plan.cycles[0].weeks[0]).toMatchObject({
      weekNumber: 1,
      theme: 'VO2',
    });

    const sessions = await sessionsOf(result.trainingPlanId);
    expect(sessions.map((event) => [event.name, event.startDate])).toEqual([
      // Tuesday 18:30 Berlin
      ['Intervals', new Date(`${Y}-03-05T17:30:00Z`)],
      // Sunday 09:00, the default time
      ['Long run', new Date(`${Y}-03-10T08:00:00Z`)],
      // Wednesday of week 2
      ['Check the shoes', new Date(`${Y}-03-13T08:00:00Z`)],
    ]);
    expect(sessions[0].training?.goalRpe).toBeCloseTo(0.8);
    // The percentage target keeps its metric
    expect(sessions[0].training?.workout?.steps[0].targets[0]).toMatchObject({
      targetMin: 105,
      targetMax: 115,
      metricType: 'FTP_RUNNING',
    });
    expect(sessions[2].type).toBe('NOTE');
    expect(sessions[2].note?.description).toBe('Before the race');
    expect(sessions.every((event) => event.trainingWeekId)).toBe(true);
  });

  it('ends a plan on race day, skipping what comes after the race', async () => {
    const template = await newTemplate();
    const race = await prisma.event.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        type: 'COMPETITION',
        name: 'Trail race',
        // Saturday, March 16, 10:00 Berlin
        startDate: new Date(`${Y}-03-16T09:00:00Z`),
        endDate: new Date(`${Y}-03-16T13:00:00Z`),
        competition: { create: { sport: 'TRAIL_RUNNING' } },
      },
    });
    const request = {
      targets: [{ athleteId: DELETED_ATHLETE_ID, raceEventId: race.eventId }],
    };

    const [preview] = await library.previewApply(
      athlete,
      template.trainingPlanTemplateId,
      applyTrainingPlanSchema.parse(request),
    );
    expect(preview).toMatchObject({
      startDate: `${Y}-03-04`,
      endDate: `${Y}-03-16`,
      sessions: 3,
      skipped: 0,
      races: [
        expect.objectContaining({ name: 'Trail race', date: `${Y}-03-16` }),
      ],
    });

    const result = await apply(template.trainingPlanTemplateId, request);
    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { trainingPlanId: result.trainingPlanId },
    });
    expect(plan.anchor).toBe('END');
    expect(plan.endDate).toEqual(new Date(`${Y}-03-16T22:59:59.999Z`));
  });

  it('replaces the trainings still to do, never the done ones', async () => {
    const template = await newTemplate();
    const planned = await prisma.event.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        type: 'TRAINING',
        name: 'Old easy run',
        startDate: new Date(`${Y}-03-06T08:00:00Z`),
        endDate: new Date(`${Y}-03-06T09:00:00Z`),
        training: { create: { sport: 'RUNNING' } },
      },
    });

    const kept = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
    });
    expect(kept.replaced).toBe(0);
    expect(
      await prisma.event.findUnique({ where: { eventId: planned.eventId } }),
    ).not.toBeNull();

    const replaced = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
      conflictMode: TRAINING_PLAN_CONFLICT_MODE.REPLACE,
    });
    // The old run, and the first application's two trainings
    expect(replaced.replaced).toBe(3);
    expect(
      await prisma.event.findUnique({ where: { eventId: planned.eventId } }),
    ).toBeNull();
    expect(await sessionsOf(replaced.trainingPlanId)).toHaveLength(3);
    // The fixture's done training of 2026 is untouched
    expect(
      await prisma.event.findUnique({ where: { eventId: 3001 } }),
    ).not.toBeNull();
  });

  /** Today is this instant: only Date, so Prisma's timers keep running */
  const today = (instant: string) =>
    jest.useFakeTimers({
      now: new Date(instant),
      doNotFake: [
        'nextTick',
        'queueMicrotask',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
        'hrtime',
        'performance',
      ],
    });
  afterEach(() => jest.useRealTimers());

  const missedRun = (startDate: string) =>
    prisma.event.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        type: 'TRAINING',
        name: 'Planned run',
        startDate: new Date(startDate),
        endDate: new Date(new Date(startDate).getTime() + 3600_000),
        training: { create: { sport: SPORT_TYPE.RUNNING, description: '' } },
      },
    });

  it('replaces from today only when the plan started yesterday', async () => {
    // Tuesday noon in Berlin: the plan starts on Monday, yesterday
    today(`${Y}-03-05T11:00:00Z`);
    const template = await newTemplate();
    const missed = await missedRun(`${Y}-03-04T07:00:00Z`);
    const coming = await missedRun(`${Y}-03-06T07:00:00Z`);

    const replaced = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
      conflictMode: TRAINING_PLAN_CONFLICT_MODE.REPLACE,
    });

    expect(replaced.replaced).toBe(1);
    // Yesterday's missed run is history, which coaches read
    expect(
      await prisma.event.findUnique({ where: { eventId: missed.eventId } }),
    ).not.toBeNull();
    expect(
      await prisma.event.findUnique({ where: { eventId: coming.eventId } }),
    ).toBeNull();
  });

  it('keeps the past when a retried job finishes its replacing', async () => {
    today(`${Y}-03-05T11:00:00Z`);
    const template = await newTemplate();
    const dto = applyTrainingPlanSchema.parse({
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
      conflictMode: TRAINING_PLAN_CONFLICT_MODE.REPLACE,
    });
    const plan = await library.checkApply(
      athlete,
      template.trainingPlanTemplateId,
      dto,
    );
    const { targets, ...options } = dto;
    await library.applyToAthlete(plan, targets[0], options, 'job-1');
    const missed = await missedRun(`${Y}-03-04T07:00:00Z`);
    const coming = await missedRun(`${Y}-03-06T07:00:00Z`);

    const retried = await library.applyToAthlete(
      plan,
      targets[0],
      options,
      'job-1',
    );

    expect(retried.replaced).toBe(1);
    expect(
      await prisma.event.findUnique({ where: { eventId: missed.eventId } }),
    ).not.toBeNull();
    expect(
      await prisma.event.findUnique({ where: { eventId: coming.eventId } }),
    ).toBeNull();
  });

  it('leaves a finished block as it was when the plan moves', async () => {
    // Monday: the first week's block (Build) ended yesterday
    today(`${Y}-03-11T09:00:00Z`);
    const template = await newTemplate();
    const { trainingPlanId } = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
    });
    const before = await prisma.cycle.findMany({
      where: { trainingPlanId },
      orderBy: { startDate: 'asc' },
    });

    const moved = await library.shiftApplied(athlete, trainingPlanId, {
      days: 7,
    });

    // Only the note of the second week is still to do
    expect(moved.moved).toBe(1);
    const [build, rest] = await prisma.cycle.findMany({
      where: { trainingPlanId },
      orderBy: { startDate: 'asc' },
    });
    expect(build.startDate).toEqual(before[0].startDate);
    expect(build.endDate).toEqual(before[0].endDate);
    expect(rest.startDate.getTime() - before[1].startDate.getTime()).toBe(
      7 * 24 * 3600_000,
    );
  });

  it('leaves a session changed by hand where it is when the plan moves', async () => {
    const template = await newTemplate();
    const { trainingPlanId } = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
    });
    const [first] = await sessionsOf(trainingPlanId);
    await events.updateEvent(athlete, first.eventId, { name: 'Hills instead' });

    const moved = await library.shiftApplied(athlete, trainingPlanId, {
      days: 7,
    });

    expect(moved.moved).toBe(2);
    const changed = await prisma.event.findUniqueOrThrow({
      where: { eventId: first.eventId },
    });
    expect(changed.startDate).toEqual(first.startDate);
  });

  it('moves the plan whole, at the same local time across the DST change', async () => {
    const template = await newTemplate();
    const { trainingPlanId } = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-18` }],
    });

    const moved = await library.shiftApplied(athlete, trainingPlanId, {
      days: 14,
    });
    expect(moved.moved).toBe(3);

    const sessions = await sessionsOf(trainingPlanId);
    // Tuesday, April 2, 18:30, now summer time (UTC+2)
    expect(sessions[0].startDate).toEqual(new Date(`${Y}-04-02T16:30:00Z`));
    const plan = await prisma.trainingPlan.findUniqueOrThrow({
      where: { trainingPlanId },
    });
    expect(plan.startDate).toEqual(new Date(`${Y}-03-31T22:00:00Z`));

    // The service checks the dates, whatever the request schema allows
    await expect(
      library.shiftApplied(athlete, trainingPlanId, { days: -5000 }),
    ).rejects.toThrow('cannot move into the past');
  });

  it('marks sessions changed by hand', async () => {
    const template = await newTemplate();
    const { trainingPlanId } = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
    });
    const [first] = await sessionsOf(trainingPlanId);
    await events.updateEvent(athlete, first.eventId, { name: 'Hills instead' });

    const [applied] = await library.listApplied(athlete, {
      athleteId: DELETED_ATHLETE_ID,
      includeArchived: false,
    });
    expect(applied).toMatchObject({
      trainingPlanId,
      weeks: 2,
      sessions: 3,
      done: 0,
      modified: 1,
      startDate: `${Y}-03-04`,
      endDate: `${Y}-03-17`,
    });
  });

  it('removes what is still to do, and keeps the past as history', async () => {
    const template = await newTemplate();
    const future = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
    });
    const past = await apply(template.trainingPlanTemplateId, {
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: '2020-03-02' }],
    });

    expect(await library.removeApplied(athlete, future.trainingPlanId)).toEqual(
      {
        trainingPlanId: future.trainingPlanId,
        removed: 3,
        kept: 0,
      },
    );
    expect(
      await prisma.trainingPlan.findUnique({
        where: { trainingPlanId: future.trainingPlanId },
      }),
    ).toBeNull();
    expect(
      await prisma.cycle.count({
        where: { trainingPlanId: future.trainingPlanId },
      }),
    ).toBe(0);

    expect(
      await library.removeApplied(athlete, past.trainingPlanId),
    ).toMatchObject({
      removed: 0,
      kept: 3,
    });
    const archived = await prisma.trainingPlan.findUniqueOrThrow({
      where: { trainingPlanId: past.trainingPlanId },
    });
    expect(archived.status).toBe('ARCHIVED');
    expect(await sessionsOf(past.trainingPlanId)).toHaveLength(3);
  });

  it('saves a calendar range as a plan, and applies it back', async () => {
    // The fixture: training 3001 (Tuesday 2026-01-06, with a workout) and
    // note 3004 (Wednesday) inside block 3902 "Base"
    const saved = await library.createFromCalendar(athlete, {
      name: 'From my calendar',
      description: '',
      goal: '',
      startDate: '2026-01-05',
      endDate: '2026-01-11',
      weekStartsOn: 1,
    });
    expect(saved.weeks).toBe(1);
    expect(saved.content.cycles[0].name).toBe('Base');
    const sessions = saved.content.cycles[0].weeks[0].sessions;
    expect(
      sessions.map((session) => [session.name, session.dayOfWeek]),
    ).toEqual([
      ['Intervals', 2],
      ['Note', 3],
    ]);
    expect(sessions[0].workout?.steps.map((step) => step.stepType)).toEqual([
      'WARMUP',
      'REPEAT',
    ]);
    expect(sessions[1].kind).toBe('NOTE');

    const exported = await library.exportTemplate(
      athlete,
      saved.trainingPlanTemplateId,
    );
    const imported = await library.importTemplate(coach, { file: exported });
    expect(imported.content).toEqual(saved.content);
  });

  it('finishes a retried job without applying the plan twice', async () => {
    const template = await newTemplate();
    const dto = applyTrainingPlanSchema.parse({
      targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
      conflictMode: TRAINING_PLAN_CONFLICT_MODE.REPLACE,
    });
    const plan = await library.checkApply(
      athlete,
      template.trainingPlanTemplateId,
      dto,
    );
    const { targets, ...options } = dto;
    // A session the plan replaces, still there as after a restart between
    // the saved plan and the removals
    const first = await library.applyToAthlete(
      plan,
      targets[0],
      options,
      'job-1',
    );
    const leftover = await prisma.event.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        type: 'TRAINING',
        name: 'Old session',
        startDate: new Date(`${Y}-03-06T08:00:00Z`),
        endDate: new Date(`${Y}-03-06T09:00:00Z`),
        training: { create: { sport: SPORT_TYPE.RUNNING, description: '' } },
      },
    });

    const retried = await library.applyToAthlete(
      plan,
      targets[0],
      options,
      'job-1',
    );
    expect(retried).toEqual({
      athleteId: DELETED_ATHLETE_ID,
      trainingPlanId: first.trainingPlanId,
      sessions: 3,
      replaced: 1,
    });
    expect(
      await prisma.trainingPlan.count({
        where: {
          athleteId: DELETED_ATHLETE_ID,
          templateId: template.trainingPlanTemplateId,
        },
      }),
    ).toBe(1);
    expect(
      await prisma.event.findUnique({ where: { eventId: leftover.eventId } }),
    ).toBeNull();
    expect(await sessionsOf(first.trainingPlanId)).toHaveLength(3);

    // Another job is another application
    const second = await library.applyToAthlete(
      plan,
      targets[0],
      options,
      'job-2',
    );
    expect(second.trainingPlanId).not.toBe(first.trainingPlanId);
  });

  it('keeps plans out of club folders, and refuses website files that are no plan', async () => {
    const club = await prisma.club.create({ data: { name: 'Club' } });
    const folder = await prisma.eventTemplateFolder.create({
      data: {
        name: 'Club folder',
        userId: DELETED_USER_ID,
        clubId: club.clubId,
      },
    });
    await expect(
      newTemplate(athlete, { folderId: folder.eventTemplateFolderId }),
    ).rejects.toThrow('Folder not found');
    await expect(
      newTemplate(athlete, { folderId: 4001 }),
    ).resolves.toMatchObject({ folderId: 4001 });

    const service = new TrainingPlanService(prisma, library);
    await expect(
      service.importSeoPlan(
        athlete,
        {
          plan: {
            name: 'Empty',
            description: '',
            goal: '',
            sportType: SPORT_TYPE.RUNNING,
            distance: 0,
            duration: 1,
          },
          cycles: [
            {
              name: 'Base',
              description: '',
              phase: 'BASE' as never,
              weeks: [],
            },
          ],
        },
        new Date(`${Y}-03-05T23:00:00Z`),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a coach apply their plan to an athlete, and nobody else', async () => {
    const template = await newTemplate(coach);
    const result = await apply(
      template.trainingPlanTemplateId,
      { targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }] },
      coach,
    );
    expect(result.sessions).toBe(3);

    // Someone else's library plan does not exist for the athlete
    await expect(
      library.checkApply(
        athlete,
        template.trainingPlanTemplateId,
        applyTrainingPlanSchema.parse({
          targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
        }),
      ),
    ).rejects.toThrow('Training plan not found');

    await prisma.user.create({
      data: {
        userId: stranger.userId,
        email: stranger.email,
        password: 'x',
        firstName: 'Str',
        lastName: 'Anger',
      },
    });
    const own = await newTemplate(stranger);
    await expect(
      library.checkApply(
        stranger,
        own.trainingPlanTemplateId,
        applyTrainingPlanSchema.parse({
          targets: [{ athleteId: DELETED_ATHLETE_ID, date: `${Y}-03-04` }],
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      library.removeApplied(stranger, result.trainingPlanId),
    ).rejects.toThrow('Training plan not found');
  });

  it('imports the website plans through the same path', async () => {
    const service = new TrainingPlanService(prisma, library);
    const imported = await service.importSeoPlan(
      athlete,
      {
        plan: {
          name: 'Marathon',
          description: '',
          goal: 'Sub 3:30',
          sportType: SPORT_TYPE.RUNNING,
          distance: 42195,
          duration: 1,
        },
        cycles: [
          {
            name: 'Base',
            description: '',
            phase: 'BASE' as never,
            weeks: [
              {
                weekNumber: 1,
                sessions: [
                  {
                    dayOfWeek: 1,
                    name: 'Easy',
                    sport: SPORT_TYPE.RUNNING,
                    description: '',
                  },
                ],
              },
            ],
          },
        ],
      },
      // Wednesday, March 6, local midnight in Berlin as the app sends it
      new Date(`${Y}-03-05T23:00:00Z`),
    );
    expect(imported?.anchor).toBe('START');
    // Weeks start on the chosen Wednesday: Monday ends the week
    const [session] = await sessionsOf(imported!.trainingPlanId);
    expect(session.startDate).toEqual(new Date(`${Y}-03-11T08:00:00Z`));
  });
});
