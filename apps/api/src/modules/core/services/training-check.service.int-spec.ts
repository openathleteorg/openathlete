import { ForbiddenException } from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { RecordService } from './record.service';
import { TrainingCheckService } from './training-check.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const NOW = new Date('2026-06-30T12:00:00Z');
/**
 * A day of the last six weeks (from 19 May), and one of the six before
 * (from 7 April), eight weeks earlier
 */
const lately = (day: number) => `2026-06-${String(day).padStart(2, '0')}`;
const before = (day: number) => `2026-04-${String(day + 7).padStart(2, '0')}`;

describe('TrainingCheckService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: TrainingCheckService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;
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
    service = new TrainingCheckService(
      prisma,
      abilities,
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
  });

  let count = 0;
  /** A run of the athlete, with its profile bands and what a test sets */
  async function run(
    date: string,
    {
      sport = 'TRAIL_RUNNING',
      bands = [],
      ...data
    }: {
      sport?: 'TRAIL_RUNNING' | 'RUNNING' | 'CYCLING';
      bands?: {
        kind: 'FLAT_POWER' | 'FLAT_SPEED';
        bin: number;
        value: number;
      }[];
      movingTime?: number;
      distance?: number;
      elevationGain?: number;
      decouplingPercent?: number;
      intensitySeconds?: number[];
    } = {},
  ) {
    const startDate = new Date(`${date}T08:00:00Z`);
    const event = await prisma.event.create({
      data: {
        name: `run ${++count}`,
        type: 'ACTIVITY',
        startDate,
        endDate: new Date(startDate.getTime() + 3600_000),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport,
            distance: 10000,
            elevationGain: 300,
            movingTime: 3000,
            averageSpeed: 3,
            maxSpeed: 5,
            externalId: `check-${count}`,
            ...data,
          },
        },
      },
      include: { activity: true },
    });
    await prisma.activityProfileBin.createMany({
      data: bands.map((band) => ({
        ...band,
        seconds: 900,
        eventActivityId: event.activity!.eventActivityId,
      })),
    });
    return event.activity!;
  }

  it('leaves every question open without runs', async () => {
    const check = await service.getCheck(athlete, DELETED_ATHLETE_ID, NOW);
    expect(check.split).toEqual(new Date('2026-05-19T12:00:00Z'));
    expect(check.from).toEqual(new Date('2026-04-07T12:00:00Z'));
    expect(check.fitness).toMatchObject({ status: 'OPEN', counts: [0, 0] });
    expect(check.speed).toEqual({
      status: 'OPEN',
      kind: null,
      current: null,
      previous: null,
    });
    expect(check.durability).toMatchObject({ status: 'OPEN', counts: [0, 0] });
  });

  it('reads a lower heart rate at the same power as fitter', async () => {
    for (const [index, day] of [2, 9, 16, 23].entries()) {
      // 300 to 310 W: about 142 lately, 148 before
      await run(lately(day), {
        bands: [
          { kind: 'FLAT_POWER', bin: 30, value: 141 + (index % 2) * 2 },
          { kind: 'FLAT_SPEED', bin: 21, value: 141 },
        ],
      });
      await run(before(day), {
        bands: [
          { kind: 'FLAT_POWER', bin: 30, value: 147 + (index % 2) * 2 },
          { kind: 'FLAT_SPEED', bin: 21, value: 141 },
        ],
      });
    }
    // A ride, and a run older than both windows: neither counts
    await run(lately(5), {
      sport: 'CYCLING',
      bands: [{ kind: 'FLAT_POWER', bin: 30, value: 100 }],
    });
    await run('2026-03-01', {
      bands: [{ kind: 'FLAT_POWER', bin: 30, value: 100 }],
    });

    const { fitness } = await service.getCheck(
      athlete,
      DELETED_ATHLETE_ID,
      NOW,
    );
    expect(fitness).toMatchObject({
      status: 'BETTER',
      basis: 'POWER',
      reference: 305,
      counts: [4, 4],
    });
    expect(fitness.current! - fitness.previous!).toBeCloseTo(-6, 6);
  });

  it('falls back on grade-adjusted speed when few runs have power', async () => {
    for (const day of [2, 9, 16, 23]) {
      await run(lately(day), {
        bands: [{ kind: 'FLAT_SPEED', bin: 21, value: 150 }],
      });
      await run(before(day), {
        bands: [{ kind: 'FLAT_SPEED', bin: 21, value: 150 }],
      });
    }
    await run(lately(24), {
      bands: [
        { kind: 'FLAT_POWER', bin: 30, value: 150 },
        { kind: 'FLAT_SPEED', bin: 21, value: 150 },
      ],
    });
    const { fitness } = await service.getCheck(
      athlete,
      DELETED_ATHLETE_ID,
      NOW,
    );
    expect(fitness).toMatchObject({
      status: 'SAME',
      basis: 'SPEED',
      counts: [5, 4],
    });
    // 10.5 to 11 km/h
    expect(fitness.reference).toBeCloseTo(10.75 / 3.6, 9);
  });

  it('reads less drift on long, steady, flat runs as lasting longer', async () => {
    const long = (decouplingPercent: number) => ({
      movingTime: 5400,
      distance: 18000,
      elevationGain: 120,
      intensitySeconds: [4800, 400, 200],
      decouplingPercent,
    });
    await run(lately(6), long(4));
    await run(lately(20), long(4.4));
    await run(before(6), long(7));
    await run(before(20), long(7.4));
    // Too short, too hard, and a mountain run: not what the drift reads on
    await run(lately(7), { ...long(20), movingTime: 1800 });
    await run(lately(8), { ...long(20), intensitySeconds: [2000, 2000, 1400] });
    await run(lately(9), { ...long(20), elevationGain: 900 });
    const { durability } = await service.getCheck(
      athlete,
      DELETED_ATHLETE_ID,
      NOW,
    );
    expect(durability).toMatchObject({ status: 'BETTER', counts: [2, 2] });
    expect(durability.current).toBeCloseTo(4.2, 9);
    expect(durability.previous).toBeCloseTo(7.2, 9);
  });

  it('compares critical speed between now and six weeks ago', async () => {
    // Best times over 1, 3 and 5 km: about 4.5 m/s held for long
    const bests = async (date: string, seconds: number[]) => {
      const activity = await run(date, { sport: 'RUNNING' });
      await prisma.record.createMany({
        data: [1000, 3000, 5000].map((distance, index) => ({
          type: 'SPEED' as const,
          distance,
          value: seconds[index],
          date: new Date(`${date}T08:00:00Z`),
          athleteId: DELETED_ATHLETE_ID,
          eventActivityId: activity.eventActivityId,
        })),
      });
    };
    // Before the split: the model of six weeks ago rests on these alone
    await bests(before(5), [200, 640, 1085]);
    const open = await service.getCheck(athlete, DELETED_ATHLETE_ID, NOW);
    expect(open.speed.status).toBe('SAME');
    expect(open.speed.kind).toBe('speed');
    expect(open.speed.current).toBeCloseTo(4.52, 1);

    // Every best five percent faster
    await bests(lately(20), [190.5, 609.5, 1033.3]);
    const { speed } = await service.getCheck(athlete, DELETED_ATHLETE_ID, NOW);
    expect(speed.status).toBe('BETTER');
    expect(speed.current! / speed.previous!).toBeCloseTo(1.05, 2);
  });

  it('answers for the athlete asking when none is named', async () => {
    const check = await service.getCheck(athlete, undefined, NOW);
    expect(check.fitness.status).toBe('OPEN');
    // A coach without an athlete of their own names one
    await expect(service.getCheck(stranger, undefined, NOW)).rejects.toThrow(
      'Athlete not found',
    );
  });

  it('refuses an athlete the user cannot read', async () => {
    await expect(
      service.getCheck(stranger, DELETED_ATHLETE_ID, NOW),
    ).rejects.toThrow(ForbiddenException);
  });
});
