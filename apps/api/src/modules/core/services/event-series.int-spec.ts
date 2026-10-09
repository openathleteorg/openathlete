import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventBulkService } from './event-bulk.service';
import { EventSeriesService } from './event-series.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('repeated sessions (PostgreSQL)', () => {
  let prisma: PrismaService;
  let bulk: EventBulkService;
  let series: EventSeriesService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    // Updates and deletions of plain sessions touch no export or messaging
    const events = new EventService(
      prisma,
      abilities,
      new EventEmitter2(),
      {} as never,
      {} as never,
      { deleteExportsForWorkout: jest.fn() } as never,
      {} as never,
    );
    bulk = new EventBulkService(prisma, abilities, events);
    series = new EventSeriesService(prisma, abilities, events, bulk);
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
      data: { timeZone: 'Europe/Paris' },
    });
  });

  /** Tuesday 6 October 2026, 18:00 in Paris */
  const plannedTempo = () =>
    prisma.event.create({
      data: {
        name: 'Tuesday tempo',
        type: 'TRAINING',
        startDate: new Date('2026-10-06T16:00:00Z'),
        endDate: new Date('2026-10-06T17:00:00Z'),
        athleteId: DELETED_ATHLETE_ID,
        training: { create: { sport: 'RUNNING', goalDuration: 3600 } },
      },
    });

  const occurrences = (seriesId: string) =>
    prisma.event.findMany({
      where: { seriesId },
      orderBy: { startDate: 'asc' },
      include: { training: true },
    });

  it('repeats a session every week until a date, at the same local time', async () => {
    const tempo = await plannedTempo();

    // Until Tuesday 3 November, past the end of summer time
    const copies = await series.repeat(athlete, tempo.eventId, {
      everyWeeks: 1,
      until: new Date('2026-11-03T22:59:59Z'),
    });

    expect(copies).toHaveLength(4);
    const { seriesId } = await prisma.event.findUniqueOrThrow({
      where: { eventId: tempo.eventId },
    });
    const all = await occurrences(seriesId!);
    expect(all.map((event) => event.startDate.toISOString())).toEqual([
      '2026-10-06T16:00:00.000Z',
      '2026-10-13T16:00:00.000Z',
      '2026-10-20T16:00:00.000Z',
      // 18:00 in Paris, now UTC+1
      '2026-10-27T17:00:00.000Z',
      '2026-11-03T17:00:00.000Z',
    ]);
  });

  it('refuses a repetition that ends before the next occurrence', async () => {
    const tempo = await plannedTempo();
    await expect(
      series.repeat(athlete, tempo.eventId, {
        everyWeeks: 2,
        until: new Date('2026-10-15T00:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('edits an occurrence and the following ones, not the earlier ones', async () => {
    const tempo = await plannedTempo();
    await series.repeat(athlete, tempo.eventId, {
      everyWeeks: 1,
      until: new Date('2026-10-27T22:00:00Z'),
    });
    const before = await occurrences(
      (
        await prisma.event.findUniqueOrThrow({
          where: { eventId: tempo.eventId },
        })
      ).seriesId!,
    );
    const third = before[2];

    // Wednesday instead of Tuesday, at 7:00 instead of 18:00
    await series.updateFollowing(athlete, third.eventId, {
      type: 'TRAINING',
      name: 'Wednesday tempo',
      startDate: new Date('2026-10-21T05:00:00Z'),
      endDate: new Date('2026-10-21T06:00:00Z'),
    } as never);

    const after = await occurrences(before[0].seriesId!);
    expect(after.map((event) => event.name)).toEqual([
      'Tuesday tempo',
      'Tuesday tempo',
      'Wednesday tempo',
      'Wednesday tempo',
    ]);
    expect(after.map((event) => event.startDate.toISOString())).toEqual([
      '2026-10-06T16:00:00.000Z',
      '2026-10-13T16:00:00.000Z',
      '2026-10-21T05:00:00.000Z',
      // 7:00 in Paris after the end of summer time
      '2026-10-28T06:00:00.000Z',
    ]);
  });

  it('deletes an occurrence and the following ones still to do', async () => {
    const tempo = await plannedTempo();
    await series.repeat(athlete, tempo.eventId, {
      everyWeeks: 1,
      until: new Date('2026-10-27T22:00:00Z'),
    });
    const { seriesId } = await prisma.event.findUniqueOrThrow({
      where: { eventId: tempo.eventId },
    });
    const all = await occurrences(seriesId!);
    // The last one was done: the fixture's run moves to it, and keeps it
    await prisma.eventTraining.update({
      where: { eventTrainingId: 3101 },
      data: { relatedActivityId: null },
    });
    await prisma.eventCompetition.update({
      where: { eventId: 3003 },
      data: { relatedActivityId: null },
    });
    await prisma.eventTraining.update({
      where: { eventId: all[3].eventId },
      data: { relatedActivityId: 3501 },
    });

    const { deleted } = await series.deleteFollowing(athlete, all[1].eventId);

    expect(deleted).toBe(2);
    expect(
      (await occurrences(seriesId!)).map((event) => event.eventId),
    ).toEqual([all[0].eventId, all[3].eventId]);
  });

  it('keeps copies of a week out of the series', async () => {
    const tempo = await plannedTempo();
    await series.repeat(athlete, tempo.eventId, {
      everyWeeks: 1,
      until: new Date('2026-10-13T22:00:00Z'),
    });

    const [copy] = await bulk.duplicate(athlete, {
      eventIds: [tempo.eventId],
      offsetDays: 2,
    });

    const stored = await prisma.event.findUniqueOrThrow({
      where: { eventId: copy.eventId },
    });
    expect(stored.seriesId).toBeNull();
  });
});
