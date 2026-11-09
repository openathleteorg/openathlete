import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConnectorProvider } from '@openathlete/database';

import { CaslAbilityFactory } from 'src/modules/auth';
import {
  COACH_ATHLETE_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityDuplicateService } from './activity-duplicate.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's run (event 3002, activity 3501, an uploaded file with no
// provider) starts on 2026-01-06 at midnight, lasts 3300 s of moving time
// and is linked to the training 3001 (event_training 3101) and the race 3003
const FIXTURE_ACTIVITY_ID = 3501;
const FIXTURE_TRAINING_ID = 3101;
const MIN = 60_000;

describe('removing duplicate activities (PostgreSQL)', () => {
  let prisma: PrismaService;
  let duplicates: ActivityDuplicateService;
  const notifyWeeklyLoadUpdated = jest.fn();

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const events = new EventService(
      prisma,
      new CaslAbilityFactory(),
      new EventEmitter2(),
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    duplicates = new ActivityDuplicateService(prisma, events, {
      notifyWeeklyLoadUpdated,
    } as never);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    notifyWeeklyLoadUpdated.mockReset();
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
  });

  let externalIds = 0;
  const activity = async ({
    athleteId = DELETED_ATHLETE_ID,
    provider,
    externalId = `ext-${++externalIds}`,
    start,
    minutes,
  }: {
    athleteId?: number;
    provider: ConnectorProvider | null;
    externalId?: string;
    start: string;
    minutes: number;
  }) => {
    const startDate = new Date(start);
    const event = await prisma.event.create({
      data: {
        athleteId,
        name: 'Run',
        type: 'ACTIVITY',
        startDate,
        endDate: new Date(startDate.getTime() + minutes * MIN),
        activity: {
          create: {
            provider,
            externalId,
            sport: 'RUNNING',
            distance: 10000,
            elevationGain: 50,
            movingTime: minutes * 60,
            averageSpeed: 3,
            maxSpeed: 4,
          },
        },
      },
      include: { activity: true },
    });
    return {
      eventId: event.eventId,
      eventActivityId: event.activity!.eventActivityId,
    };
  };

  const remainingEvents = async (eventIds: number[]) =>
    (
      await prisma.event.findMany({
        where: { eventId: { in: eventIds } },
        select: { eventId: true },
        orderBy: { eventId: 'asc' },
      })
    ).map(({ eventId }) => eventId);

  it("deletes Strava's copy of a planned run with its records and load, and keeps the linked one", async () => {
    const strava = await activity({
      provider: ConnectorProvider.STRAVA,
      start: '2026-01-06T00:01:00Z',
      minutes: 55,
    });
    await prisma.record.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        eventActivityId: strava.eventActivityId,
        type: 'SPEED',
        distance: 1000,
        value: 4,
        date: new Date('2026-01-06'),
      },
    });
    await prisma.trainingLoadEntry.create({
      data: {
        calculationId: 3701,
        activityId: strava.eventActivityId,
        date: new Date('2026-01-06'),
        value: 80,
      },
    });
    await prisma.eventActivityWeather.create({
      data: { eventActivityId: strava.eventActivityId, samples: [] },
    });

    await expect(
      duplicates.removeDuplicates(DELETED_ATHLETE_ID),
    ).resolves.toEqual({ groups: 1, removed: 1 });

    expect(await remainingEvents([3002, strava.eventId])).toEqual([3002]);
    expect(
      await prisma.eventActivity.count({
        where: { eventActivityId: strava.eventActivityId },
      }),
    ).toBe(0);
    expect(
      await prisma.record.count({
        where: { eventActivityId: strava.eventActivityId },
      }),
    ).toBe(0);
    expect(
      await prisma.trainingLoadEntry.findMany({
        select: { activityId: true },
      }),
    ).toEqual([{ activityId: FIXTURE_ACTIVITY_ID }]);
    expect(
      await prisma.eventActivityWeather.count({
        where: { eventActivityId: strava.eventActivityId },
      }),
    ).toBe(0);
    // The kept run is untouched, still linked to its session
    expect(
      await prisma.eventTraining.findUnique({
        where: { eventTrainingId: FIXTURE_TRAINING_ID },
        select: { relatedActivityId: true },
      }),
    ).toEqual({ relatedActivityId: FIXTURE_ACTIVITY_ID });
    expect(notifyWeeklyLoadUpdated).toHaveBeenCalledTimes(1);
    expect(notifyWeeklyLoadUpdated).toHaveBeenCalledWith(DELETED_ATHLETE_ID, {
      reason: 'event_deleted',
    });
  });

  it('keeps the commented copy and moves the planned session to it', async () => {
    const coros = await activity({
      provider: ConnectorProvider.COROS,
      start: '2026-02-01T07:00:00Z',
      minutes: 60,
    });
    const strava = await activity({
      provider: ConnectorProvider.STRAVA,
      start: '2026-02-01T07:02:00Z',
      minutes: 58,
    });
    await prisma.messageThread.create({
      data: {
        eventActivityId: coros.eventActivityId,
        messages: {
          create: { content: 'Good pacing', senderId: DELETED_USER_ID },
        },
      },
    });
    const planned = await prisma.event.create({
      data: {
        athleteId: DELETED_ATHLETE_ID,
        name: 'Tempo',
        type: 'TRAINING',
        startDate: new Date('2026-02-01T07:00:00Z'),
        endDate: new Date('2026-02-01T08:00:00Z'),
        training: {
          create: {
            sport: 'RUNNING',
            relatedActivityId: strava.eventActivityId,
          },
        },
      },
      include: { training: true },
    });

    await expect(
      duplicates.removeDuplicates(DELETED_ATHLETE_ID),
    ).resolves.toEqual({ groups: 1, removed: 1 });

    expect(await remainingEvents([coros.eventId, strava.eventId])).toEqual([
      coros.eventId,
    ]);
    expect(
      await prisma.eventTraining.findUnique({
        where: { eventTrainingId: planned.training!.eventTrainingId },
        select: { relatedActivityId: true },
      }),
    ).toEqual({ relatedActivityId: coros.eventActivityId });
  });

  it("prefers the watch's recording over Strava's, and leaves other workouts and athletes alone", async () => {
    const strava = await activity({
      provider: ConnectorProvider.STRAVA,
      start: '2026-03-01T07:00:00Z',
      minutes: 60,
    });
    const garmin = await activity({
      provider: ConnectorProvider.GARMIN,
      start: '2026-03-01T07:01:00Z',
      minutes: 61,
    });
    // Logged by hand at the same time: not a recording, kept
    const handLogged = await activity({
      provider: null,
      externalId: 'manual-0f1e',
      start: '2026-03-01T07:00:00Z',
      minutes: 60,
    });
    // A short commute after the run, from Strava only
    const commute = await activity({
      provider: ConnectorProvider.STRAVA,
      start: '2026-03-01T08:30:00Z',
      minutes: 20,
    });
    // The coached athlete's own copies, not theirs to clean here
    const otherStrava = await activity({
      athleteId: COACH_ATHLETE_ID,
      provider: ConnectorProvider.STRAVA,
      start: '2026-03-01T07:00:00Z',
      minutes: 60,
    });
    const otherGarmin = await activity({
      athleteId: COACH_ATHLETE_ID,
      provider: ConnectorProvider.GARMIN,
      start: '2026-03-01T07:00:00Z',
      minutes: 60,
    });

    await expect(
      duplicates.removeDuplicates(DELETED_ATHLETE_ID),
    ).resolves.toEqual({ groups: 1, removed: 1 });

    const all = [
      strava,
      garmin,
      handLogged,
      commute,
      otherStrava,
      otherGarmin,
    ].map(({ eventId }) => eventId);
    expect(await remainingEvents(all)).toEqual(
      all.filter((eventId) => eventId !== strava.eventId),
    );
  });

  it('finds nothing more to do the second time', async () => {
    await activity({
      provider: ConnectorProvider.STRAVA,
      start: '2026-03-01T07:00:00Z',
      minutes: 60,
    });
    await activity({
      provider: ConnectorProvider.SUUNTO,
      start: '2026-03-01T07:00:30Z',
      minutes: 60,
    });

    await duplicates.removeDuplicates(DELETED_ATHLETE_ID);
    notifyWeeklyLoadUpdated.mockReset();

    await expect(
      duplicates.removeDuplicates(DELETED_ATHLETE_ID),
    ).resolves.toEqual({ groups: 0, removed: 0 });
    expect(notifyWeeklyLoadUpdated).not.toHaveBeenCalled();
  });

  it('finds the saved copy an import would duplicate', async () => {
    const coros = await activity({
      provider: ConnectorProvider.COROS,
      start: '2026-04-01T06:00:00Z',
      minutes: 45,
    });

    await expect(
      duplicates.findDuplicate(DELETED_ATHLETE_ID, {
        source: ConnectorProvider.STRAVA,
        startDate: new Date('2026-04-01T06:02:00Z'),
        endDate: new Date('2026-04-01T06:48:00Z'),
        movingTime: 44 * 60,
      }),
    ).resolves.toEqual(coros);
    // The same source again is its own import's business (by external id)
    await expect(
      duplicates.findDuplicate(DELETED_ATHLETE_ID, {
        source: ConnectorProvider.COROS,
        startDate: new Date('2026-04-01T06:00:00Z'),
        endDate: new Date('2026-04-01T06:45:00Z'),
      }),
    ).resolves.toBeNull();
    // Another athlete's workout at the same time
    await expect(
      duplicates.findDuplicate(COACH_ATHLETE_ID, {
        source: ConnectorProvider.STRAVA,
        startDate: new Date('2026-04-01T06:00:00Z'),
        endDate: new Date('2026-04-01T06:45:00Z'),
      }),
    ).resolves.toBeNull();
  });
});
