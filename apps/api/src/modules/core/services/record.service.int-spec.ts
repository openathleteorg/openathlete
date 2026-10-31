import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { RecordService } from './record.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('RecordService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: RecordService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
  } as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    // Reading one's own records needs no ability
    service = new RecordService(prisma, {} as CaslAbilityFactory);
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

  it('keeps the best record of each period, with its activity', async () => {
    // The fixture's run (event 3002, "Run", activity 3501)
    const record = (date: string, value: number) =>
      prisma.record.create({
        data: {
          type: 'SPEED',
          distance: 1000,
          value,
          date: new Date(date),
          athleteId: DELETED_ATHLETE_ID,
          eventActivityId: 3501,
        },
      });
    await prisma.record.deleteMany();
    await record('2025-06-01', 240);
    await record('2026-03-01', 250);
    await record('2026-04-01', 245);
    await prisma.record.create({
      data: {
        type: 'POWER',
        duration: 300,
        value: 280,
        date: new Date('2026-04-01'),
        athleteId: DELETED_ATHLETE_ID,
        eventActivityId: 3501,
      },
    });

    const allTime = await service.getRecords(athlete, { sport: 'RUNNING' });
    expect(
      allTime.map((r) => [r.type, r.distance, r.duration, r.value]),
    ).toEqual(
      expect.arrayContaining([
        ['SPEED', 1000, null, 240],
        ['POWER', null, 300, 280],
      ]),
    );
    expect(allTime).toHaveLength(2);
    expect(allTime[0]).toMatchObject({ eventId: 3002, activityName: 'Run' });

    const season = await service.getRecords(athlete, {
      sport: 'RUNNING',
      from: new Date('2026-01-01'),
      to: new Date('2027-01-01'),
    });
    expect(season.find((r) => r.type === 'SPEED')?.value).toBe(245);
    expect(await service.getRecords(athlete, { sport: 'CYCLING' })).toEqual([]);
  });

  it('lists the sports with records, the most frequent first', async () => {
    // Two rides next to the fixture's run
    for (const id of [1, 2]) {
      const event = await prisma.event.create({
        data: {
          name: `Ride ${id}`,
          type: 'ACTIVITY',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-01'),
          athleteId: DELETED_ATHLETE_ID,
          activity: {
            create: {
              sport: 'CYCLING',
              distance: 20000,
              elevationGain: 0,
              movingTime: 2400,
              averageSpeed: 8,
              maxSpeed: 12,
              externalId: `ride-${id}`,
            },
          },
        },
        include: { activity: true },
      });
      await prisma.record.create({
        data: {
          type: 'SPEED',
          distance: 1000,
          value: 120,
          date: event.startDate,
          athleteId: DELETED_ATHLETE_ID,
          eventActivityId: event.activity!.eventActivityId,
        },
      });
    }

    expect(await service.getRecordSports(athlete)).toEqual([
      'CYCLING',
      'RUNNING',
    ]);
  });

  describe('exclusions', () => {
    const owner = {
      ...athlete,
      coachAthletes: [],
    } as unknown as AuthUser;
    const stranger = {
      userId: 999,
      email: 'stranger@example.com',
      coachAthletes: [],
    } as unknown as AuthUser;

    /** Two runs: the fixture's and a slower one, each with a pace and a heart rate record. */
    async function seed() {
      await prisma.recordExclusion.deleteMany();
      await prisma.record.deleteMany();
      const event = await prisma.event.create({
        data: {
          name: 'Slower run',
          type: 'ACTIVITY',
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-02-01'),
          athleteId: DELETED_ATHLETE_ID,
          activity: {
            create: {
              sport: 'RUNNING',
              distance: 5000,
              elevationGain: 0,
              movingTime: 1500,
              averageSpeed: 3,
              maxSpeed: 4,
              externalId: 'slower-run',
            },
          },
        },
        include: { activity: true },
      });
      const slower = event.activity!.eventActivityId;
      const records = (
        eventActivityId: number,
        date: string,
        pace: number,
        heartRate: number,
      ) =>
        prisma.record.createMany({
          data: [
            { type: 'SPEED' as const, distance: 1000, value: pace },
            { type: 'SPEED' as const, distance: 5000, value: pace * 5 },
            { type: 'HEARTRATE' as const, duration: 60, value: heartRate },
          ].map((record) => ({
            ...record,
            date: new Date(date),
            athleteId: DELETED_ATHLETE_ID,
            eventActivityId,
          })),
        });
      await records(3501, '2026-01-06', 100, 210);
      await records(slower, '2025-02-01', 240, 180);
      return slower;
    }

    const best = async () =>
      Object.fromEntries(
        (await service.getRecords(athlete, { sport: 'RUNNING' })).map((r) => [
          `${r.type}:${r.distance ?? r.duration}`,
          r.value,
        ]),
      );

    beforeEach(() => {
      service = new RecordService(prisma, new CaslAbilityFactory());
    });

    it('leaves out one effort, a record type or a whole activity', async () => {
      await seed();
      expect(await best()).toEqual({
        'SPEED:1000': 100,
        'SPEED:5000': 500,
        'HEARTRATE:60': 210,
      });

      const effort = await service.createExclusion(owner, {
        eventActivityId: 3501,
        type: 'SPEED' as never,
        distance: 1000,
      });
      expect(await best()).toEqual({
        'SPEED:1000': 240,
        'SPEED:5000': 500,
        'HEARTRATE:60': 210,
      });

      const metric = await service.createExclusion(owner, {
        eventActivityId: 3501,
        type: 'SPEED' as never,
      });
      expect(await best()).toEqual({
        'SPEED:1000': 240,
        'SPEED:5000': 1200,
        'HEARTRATE:60': 210,
      });

      await service.createExclusion(owner, { eventActivityId: 3501 });
      expect((await best())['HEARTRATE:60']).toBe(180);

      await service.deleteExclusion(owner, effort.recordExclusionId);
      await service.deleteExclusion(owner, metric.recordExclusionId);
      expect(
        await service.getExclusions(athlete, { sport: 'RUNNING' }),
      ).toHaveLength(1);
    });

    it('survives the records being computed again', async () => {
      await seed();
      await service.createExclusion(owner, { eventActivityId: 3501 });
      await prisma.record.deleteMany({ where: { eventActivityId: 3501 } });
      await prisma.record.create({
        data: {
          type: 'SPEED',
          distance: 1000,
          value: 100,
          date: new Date('2026-01-06'),
          athleteId: DELETED_ATHLETE_ID,
          eventActivityId: 3501,
        },
      });
      expect((await best())['SPEED:1000']).toBe(240);
    });

    it('does not repeat an exclusion', async () => {
      await seed();
      const input = {
        eventActivityId: 3501,
        type: 'SPEED' as never,
        distance: 1000,
      };
      const first = await service.createExclusion(owner, input);
      const second = await service.createExclusion(owner, input);
      expect(second.recordExclusionId).toBe(first.recordExclusionId);
    });

    it("refuses another athlete's activity", async () => {
      await seed();
      await expect(
        service.createExclusion(stranger, { eventActivityId: 3501 }),
      ).rejects.toThrow('Not allowed');
      const { recordExclusionId } = await service.createExclusion(owner, {
        eventActivityId: 3501,
      });
      await expect(
        service.deleteExclusion(stranger, recordExclusionId),
      ).rejects.toThrow('Not allowed');
    });

    it('reads the years and podium, without what is excluded', async () => {
      await seed();
      const kilometre = async () => {
        const history = await service.getHistory(athlete, { sport: 'RUNNING' });
        const atKilometre = (r: { type: string; distance: number | null }) =>
          r.type === 'SPEED' && r.distance === 1000;
        return {
          years: history.years
            .filter(atKilometre)
            .map((r) => [r.year, r.value]),
          podium: history.podium.filter(atKilometre).map((r) => r.value),
        };
      };

      expect(await kilometre()).toEqual({
        years: [
          [2025, 240],
          [2026, 100],
        ],
        podium: [100, 240],
      });

      await service.createExclusion(owner, { eventActivityId: 3501 });
      expect(await kilometre()).toEqual({
        years: [[2025, 240]],
        podium: [240],
      });
    });

    it('lists every effort, the excluded ones marked', async () => {
      await seed();
      const { recordExclusionId } = await service.createExclusion(owner, {
        eventActivityId: 3501,
        type: 'SPEED' as never,
      });
      const efforts = await service.getEfforts(athlete, {
        sport: 'RUNNING' as never,
        type: 'SPEED' as never,
        distance: 1000,
      });
      expect(efforts.map((e) => [e.value, e.exclusionId])).toEqual([
        [100, recordExclusionId],
        [240, null],
      ]);
    });
  });
});
