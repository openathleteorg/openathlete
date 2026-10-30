import { ForbiddenException } from '@nestjs/common';

import { SPORT_TYPE } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { StatisticsService } from './statistics.service';
import { TrainingLoadService } from './training-load.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('StatisticsService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: StatisticsService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;
  // Neither the athlete nor one of their coaches
  const stranger = {
    userId: 999_001,
    email: 'stranger@example.com',
    athlete: null,
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    service = new StatisticsService(
      prisma,
      abilities,
      new TrainingLoadService(prisma, abilities),
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

  /** An activity of the athlete, with what a test cares about */
  async function activity(
    externalId: string,
    start: string,
    data: {
      sport?: 'RUNNING' | 'CYCLING';
      distance?: number;
      movingTime?: number;
      averageHeartrate?: number;
      averageGapSpeed?: number;
    } = {},
  ) {
    const startDate = new Date(start);
    return prisma.event.create({
      data: {
        name: externalId,
        type: 'ACTIVITY',
        startDate,
        // An hour of elapsed time, pauses included
        endDate: new Date(startDate.getTime() + 3600_000),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport: 'RUNNING',
            distance: 10000,
            elevationGain: 100,
            movingTime: 3000,
            averageSpeed: 3,
            maxSpeed: 5,
            externalId,
            ...data,
          },
        },
      },
    });
  }

  const period = {
    athleteId: DELETED_ATHLETE_ID,
    from: new Date('2026-03-01T00:00:00Z'),
    to: new Date('2026-03-31T23:59:59Z'),
  };

  it('totals a period by sport, on the time in motion', async () => {
    await activity('run', '2026-03-10T08:00:00Z');
    await activity('ride', '2026-03-11T08:00:00Z', {
      sport: 'CYCLING',
      movingTime: 5000,
    });

    const { totals, sports, compared } = await service.getOverview(
      athlete,
      period,
    );
    expect(totals).toMatchObject({
      movingTime: 8000,
      distance: 20000,
      elevationGain: 200,
      count: 2,
    });
    // The most practised first
    expect(sports.map(({ sport }) => sport)).toEqual(['CYCLING', 'RUNNING']);
    expect(compared).toBeNull();
  });

  it('adds up the TRIMP load of the activities, without its other kinds', async () => {
    const run = await activity('run', '2026-03-10T08:00:00Z');
    const { eventActivityId } = (await prisma.eventActivity.findUnique({
      where: { eventId: run.eventId },
    }))!;
    for (const [type, value] of [
      ['TRIMP', 70],
      ['FOSTER_RPE', 300],
    ] as const) {
      const { trainingLoadCalculationId } =
        await prisma.trainingLoadCalculation.upsert({
          where: {
            athleteId_type: { athleteId: DELETED_ATHLETE_ID, type },
          },
          create: { athleteId: DELETED_ATHLETE_ID, type },
          update: {},
        });
      await prisma.trainingLoadEntry.create({
        data: {
          date: new Date('2026-03-10'),
          value,
          calculationId: trainingLoadCalculationId,
          activityId: eventActivityId,
        },
      });
    }
    const { totals } = await service.getOverview(athlete, period);
    expect(totals.load).toBe(70);
  });

  it('compares a period with another, for one sport', async () => {
    await activity('now', '2026-03-10T08:00:00Z');
    await activity('before', '2026-02-10T08:00:00Z');
    await activity('other sport', '2026-02-11T08:00:00Z', {
      sport: 'CYCLING',
    });

    const { compared } = await service.getOverview(athlete, {
      ...period,
      sport: 'RUNNING' as SPORT_TYPE,
      compareFrom: new Date('2026-02-01T00:00:00Z'),
      compareTo: new Date('2026-02-28T23:59:59Z'),
    });
    expect(compared?.count).toBe(1);
  });

  it('buckets on the calendar of the athlete, empty buckets included', async () => {
    await prisma.user.update({
      where: { userId: DELETED_USER_ID },
      data: { timeZone: 'Pacific/Auckland' },
    });
    // Monday 16 March in Auckland, still Sunday in UTC
    await activity('monday', '2026-03-15T20:00:00Z');

    const { granularity, buckets } = await service.getVolume(
      athlete,
      {
        athleteId: DELETED_ATHLETE_ID,
        from: new Date('2026-02-28T12:00:00Z'),
        to: new Date('2026-05-30T12:00:00Z'),
      },
      new Date('2026-06-15T00:00:00Z'),
    );
    expect(granularity).toBe('week');
    const week = buckets.find(({ period }) => period === '2026-03-16');
    expect(week?.sports).toEqual([
      {
        sport: 'RUNNING',
        movingTime: 3000,
        distance: 10000,
        elevationGain: 100,
        count: 1,
      },
    ]);
    expect(
      buckets.find(({ period }) => period === '2026-03-23')?.sports,
    ).toEqual([]);
    // The period starts on 1 March there, a Sunday: its week is cut
    expect(buckets[0]).toMatchObject({ period: '2026-02-23', partial: true });
  });

  it('adds up the active days on the calendar of the athlete', async () => {
    await prisma.user.update({
      where: { userId: DELETED_USER_ID },
      data: { timeZone: 'Pacific/Auckland' },
    });
    await activity('monday', '2026-03-15T20:00:00Z');
    await activity('monday too', '2026-03-16T02:00:00Z');

    const { days } = await service.getDays(athlete, period);
    expect(days).toEqual([
      {
        date: '2026-03-16',
        movingTime: 6000,
        distance: 20000,
        elevationGain: 200,
        count: 2,
      },
    ]);
  });

  it('weighs averages by the time in motion', async () => {
    await activity('long', '2026-03-10T08:00:00Z', {
      movingTime: 9000,
      distance: 18000,
      averageHeartrate: 140,
      averageGapSpeed: 2,
    });
    await activity('short', '2026-03-11T08:00:00Z', {
      movingTime: 1000,
      distance: 4000,
      averageHeartrate: 180,
    });

    const { buckets } = await service.getTrends(athlete, {
      athleteId: DELETED_ATHLETE_ID,
      from: new Date('2026-01-01T00:00:00Z'),
      to: new Date('2026-12-31T00:00:00Z'),
      sport: 'RUNNING' as SPORT_TYPE,
    });
    const march = buckets.find(({ period }) => period === '2026-03-01');
    expect(march).toMatchObject({
      count: 2,
      distancePerActivity: 11000,
      averageSpeed: 2.2,
      averageHeartrate: 144,
      // Only the activity that has the figure counts
      averageGapSpeed: 2,
    });
    expect(buckets.find(({ period }) => period === '2026-04-01')).toMatchObject(
      { count: 0, averageSpeed: null },
    );
  });

  it('offers the sports of the athlete, the most practised first', async () => {
    await activity('ride', '2026-03-11T08:00:00Z', {
      sport: 'CYCLING',
      movingTime: 90000,
    });
    const { sports, firstActivityDate } = await service.getFilters(
      athlete,
      DELETED_ATHLETE_ID,
    );
    expect(sports).toEqual(['CYCLING', 'RUNNING']);
    // The fixture's run
    expect(firstActivityDate?.toISOString()).toBe('2026-01-06T00:00:00.000Z');
  });

  async function trimp(eventId: number, date: string, value: number) {
    const { eventActivityId } = (await prisma.eventActivity.findUnique({
      where: { eventId },
    }))!;
    const { trainingLoadCalculationId } =
      await prisma.trainingLoadCalculation.upsert({
        where: {
          athleteId_type: { athleteId: DELETED_ATHLETE_ID, type: 'TRIMP' },
        },
        create: { athleteId: DELETED_ATHLETE_ID, type: 'TRIMP' },
        update: {},
      });
    await prisma.trainingLoadEntry.create({
      data: {
        date: new Date(date),
        value,
        calculationId: trainingLoadCalculationId,
        activityId: eventActivityId,
      },
    });
  }

  it('gives weeks of load on long periods, with their last day of form', async () => {
    const run = await activity('run', '2025-03-10T08:00:00Z');
    await trimp(run.eventId, '2025-03-10', 100);
    const long = await service.getLoad(
      athlete,
      {
        athleteId: DELETED_ATHLETE_ID,
        from: new Date('2024-01-01T00:00:00Z'),
        to: new Date('2026-01-01T00:00:00Z'),
      },
      new Date('2026-06-01T00:00:00Z'),
    );
    expect(long.granularity).toBe('week');
    expect(long.points.length).toBeLessThan(110);
    expect(long.points.find(({ date }) => date === '2025-03-10')?.load).toBe(
      100,
    );
  });

  it('runs fitness from the first load of the sport asked for', async () => {
    const run = await activity('run', '2026-01-10T08:00:00Z');
    await trimp(run.eventId, '2026-01-10', 100);
    const ride = await activity('ride', '2026-03-10T08:00:00Z', {
      sport: 'CYCLING',
    });
    await trimp(ride.eventId, '2026-03-10', 50);
    const now = new Date('2026-06-01T00:00:00Z');

    const point = async (sport?: SPORT_TYPE) =>
      (await service.getLoad(athlete, { ...period, sport }, now)).points.find(
        ({ date }) => date === '2026-03-10',
      )!;
    const all = await point();
    const running = await point('RUNNING' as SPORT_TYPE);
    const cycling = await point('CYCLING' as SPORT_TYPE);

    // The January load, read from a period that starts in March
    expect(running.ctl).toBeGreaterThan(0);
    expect(running.load).toBe(0);
    expect(cycling.load).toBe(50);
    expect(running.ctl + cycling.ctl).toBeCloseTo(all.ctl, 0);
  });

  it('marks races, and how much history backs the curve', async () => {
    const race = await activity('race', '2026-03-15T08:00:00Z');
    await prisma.eventActivity.update({
      where: { eventId: race.eventId },
      data: { isRace: true },
    });
    await trimp(race.eventId, '2026-03-15', 80);
    const { races, historyDays } = await service.getLoad(
      athlete,
      period,
      new Date('2026-06-01T00:00:00Z'),
    );
    expect(races).toEqual(['2026-03-15']);
    // From the fixture's load of 6 January to the end of the period
    expect(historyDays).toBe(84);
  });

  it('never reads the recording of an activity', async () => {
    const queries = jest.spyOn(prisma, '$queryRaw');
    await service.getOverview(athlete, period);
    await service.getVolume(athlete, period);
    await service.getTrends(athlete, {
      ...period,
      sport: 'RUNNING' as SPORT_TYPE,
    });
    await service.getFilters(athlete, DELETED_ATHLETE_ID);
    const sql = queries.mock.calls
      .map(([template]) => (template as TemplateStringsArray).join(' '))
      .join(' ');
    queries.mockRestore();
    expect(sql).not.toMatch(/stream|a\.\*|SELECT \*/);
  });

  it('refuses the sections of an athlete the user cannot read', async () => {
    await expect(service.getVolume(stranger, period)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getOverview(stranger, period)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.getFilters(stranger, DELETED_ATHLETE_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
