import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AthleteService } from './athlete.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture: user 1001 owns athlete 2001 and coaches athlete 2002, owned
// by user 1002, who coaches 2001. Activity 3501 belongs to athlete 2001.
describe('AthleteService.getGarminDataAthleteIds (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: AthleteService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new AthleteService(
      prisma,
      null as never,
      null as never,
      null as never,
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

  it('finds no Garmin data in a connected account that holds none yet', async () => {
    // Athlete 2001 has a Garmin account, but nothing imported from it
    await expect(service.getGarminDataAthleteIds(1001)).resolves.toEqual({
      athleteIds: [],
    });
  });

  it('lists the athletes the user sees whose activities or metrics come from Garmin', async () => {
    await prisma.eventActivity.update({
      where: { eventActivityId: 3501 },
      data: { provider: 'GARMIN', deviceName: 'Forerunner 965' },
    });
    await prisma.athleteMetric.create({
      data: {
        athleteId: 2002,
        type: 'SLEEP_DURATION',
        date: new Date('2026-01-02'),
        value: 28800,
        source: 'GARMIN',
      },
    });

    const own = await service.getGarminDataAthleteIds(1001);
    expect([...own.athleteIds].sort()).toEqual([2001, 2002]);
    // User 1002 owns 2002 and coaches 2001
    const coach = await service.getGarminDataAthleteIds(1002);
    expect([...coach.athleteIds].sort()).toEqual([2001, 2002]);
  });

  it('leaves out values typed in by hand and other providers', async () => {
    await prisma.eventActivity.update({
      where: { eventActivityId: 3501 },
      data: { provider: 'STRAVA' },
    });
    await prisma.athleteMetric.updateMany({ data: { source: null } });

    await expect(service.getGarminDataAthleteIds(1002)).resolves.toEqual({
      athleteIds: [],
    });
  });
});
