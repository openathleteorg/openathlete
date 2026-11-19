import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { RecordService } from './record.service';
import { TrainingLoadService } from './training-load.service';
import { YearReviewService } from './year-review.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// An athlete of their own: the shared fixture already gives its athlete a
// few activities, records and sessions
const USER_ID = 3001;
const ATHLETE_ID = 4001;

describe('YearReviewService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: YearReviewService;
  const athlete = {
    userId: USER_ID,
    email: 'year@example.com',
    athlete: { athleteId: ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;
  const stranger = {
    userId: 999_001,
    email: 'stranger@example.com',
    athlete: null,
    coachAthletes: [],
  } as unknown as AuthUser;
  const endOfYear = new Date('2026-12-20T12:00:00Z');

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    service = new YearReviewService(
      prisma,
      abilities,
      new RecordService(prisma, abilities),
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
    await prisma.user.create({
      data: {
        userId: USER_ID,
        email: 'year@example.com',
        password: 'x',
        firstName: 'Camille',
        lastName: 'Year',
        athlete: { create: { athleteId: ATHLETE_ID } },
      },
    });
  });

  async function activity(
    externalId: string,
    start: string,
    data: { sport?: 'RUNNING' | 'CYCLING'; distance?: number } = {},
  ) {
    const startDate = new Date(start);
    const event = await prisma.event.create({
      data: {
        name: externalId,
        type: 'ACTIVITY',
        startDate,
        endDate: new Date(startDate.getTime() + 3600_000),
        athleteId: ATHLETE_ID,
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
      include: { activity: true },
    });
    return event.activity!;
  }

  const review = (user = athlete, now = endOfYear) =>
    service.getYearReview(user, ATHLETE_ID, 2026, now);

  it('reads the year on the athlete’s calendar', async () => {
    await prisma.user.update({
      where: { userId: USER_ID },
      data: { timeZone: 'Pacific/Auckland' },
    });
    // 1 am on 1 January 2026 in Auckland, then 1 am on 1 January 2027
    await activity('new-year', '2025-12-31T12:00:00Z');
    await activity('next-year', '2026-12-31T12:00:00Z');

    const result = await review(athlete, new Date('2027-01-02T00:00:00Z'));

    expect(result.totals.activities).toBe(1);
    expect(result.days[0]).toBeGreaterThan(0);
    expect(result.hours[1]).toBe(1);
    expect(result.firstName).toBe('Camille');
  });

  it('tells the race of the calendar with the activity run for it', async () => {
    const run = await activity('paris', '2026-04-12T06:45:00Z', {
      distance: 42195,
    });
    await prisma.event.create({
      data: {
        name: 'Marathon de Paris',
        type: 'COMPETITION',
        startDate: new Date('2026-04-12T06:45:00Z'),
        endDate: new Date('2026-04-12T11:00:00Z'),
        athleteId: ATHLETE_ID,
        competition: {
          create: {
            sport: 'RUNNING',
            priority: 'A',
            goalDuration: 12000,
            relatedActivityId: run.eventActivityId,
          },
        },
      },
    });

    expect((await review()).highlight).toMatchObject({
      kind: 'RACE',
      name: 'Marathon de Paris',
      distance: 42195,
      duration: 3600,
      goalDuration: 12000,
    });
  });

  it('compares records with the best before the year, exclusions aside', async () => {
    const before = await activity('2025', '2025-10-05T08:00:00Z');
    const beaten = await activity('2026', '2026-05-01T08:00:00Z');
    const excluded = await activity('gps-glitch', '2026-06-01T08:00:00Z');
    const record = (eventActivityId: number, date: string, value: number) => ({
      type: 'SPEED' as const,
      distance: 10000,
      value,
      date: new Date(date),
      athleteId: ATHLETE_ID,
      eventActivityId,
    });
    await prisma.record.createMany({
      data: [
        record(before.eventActivityId, '2025-10-05T08:00:00Z', 2600),
        record(beaten.eventActivityId, '2026-05-01T08:00:00Z', 2500),
        record(excluded.eventActivityId, '2026-06-01T08:00:00Z', 1500),
      ],
    });
    await prisma.recordExclusion.create({
      data: { eventActivityId: excluded.eventActivityId },
    });

    const { records } = await review();

    expect(records.improved).toBe(1);
    expect(records.highlights).toEqual([
      expect.objectContaining({
        family: 'RUN',
        distance: 10000,
        value: 2500,
        previous: 2600,
      }),
    ]);
  });

  it('counts the planned sessions already due, and those done', async () => {
    const done = await activity('done', '2026-03-02T08:00:00Z');
    const training = (day: number, relatedActivityId?: number) =>
      prisma.event.create({
        data: {
          name: `plan-${day}`,
          type: 'TRAINING',
          startDate: new Date(Date.UTC(2026, 2, day, 8)),
          endDate: new Date(Date.UTC(2026, 2, day, 9)),
          athleteId: ATHLETE_ID,
          training: { create: { sport: 'RUNNING', relatedActivityId } },
        },
      });
    await training(2, done.eventActivityId);
    for (let day = 3; day <= 12; day++) await training(day);

    expect((await review()).plan).toEqual({ planned: 11, done: 1 });
    // Sessions still to come don't count yet
    expect(
      (await review(athlete, new Date('2026-03-08T00:00:00Z'))).plan,
    ).toBeNull();
  });

  it('keeps an athlete’s year to them and their coaches', async () => {
    await expect(review(stranger)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a year that has not started', async () => {
    await expect(
      service.getYearReview(athlete, ATHLETE_ID, 2027, endOfYear),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
