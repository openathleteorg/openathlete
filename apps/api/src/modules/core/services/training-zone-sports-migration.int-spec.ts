import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { SportType } from '@openathlete/database';

import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const migrationSql = readFileSync(
  join(
    dirname(require.resolve('@openathlete/database/package.json')),
    'prisma/schema/migrations/20261009120000_complete_all_sports_zone_values/migration.sql',
  ),
  'utf8',
);

// The fixture's heart rate zone, of athlete 2001
const ZONE_ID = 2201;

const ALL_SPORTS = Object.values(SportType);
const without = (...sports: SportType[]) =>
  ALL_SPORTS.filter((sport) => !sports.includes(sport));

// The whole sport_type enum of each earlier release
const MARCH_2025: SportType[] = [
  'RUNNING',
  'TRAIL_RUNNING',
  'CYCLING',
  'SWIMMING',
  'ROCK_CLIMBING',
  'HIKING',
  'OTHER',
];
const OCTOBER_2025: SportType[] = [
  ...MARCH_2025,
  'STRENGTH',
  'CROSSFIT',
  'YOGA',
];
const NOVEMBER_2025 = without(
  'MOBILITY',
  'TRIATHLON',
  'DUATHLON',
  'AQUATHLON',
  'AQUABIKE',
);
// December 2025's enum, which the Mobility migration already completed
const ALL_BUT_MOBILITY = without('MOBILITY');

/** Unlike the enum's order, to show the order doesn't matter. */
const shuffled = (sports: SportType[]) => [...sports].sort().reverse();

describe('complete_all_sports_zone_values migration (PostgreSQL)', () => {
  let prisma: PrismaService;

  const seed = async (sports: SportType[]) =>
    (
      await prisma.trainingZoneValue.create({
        data: { min: 120, max: 140, sports, trainingZoneId: ZONE_ID },
      })
    ).trainingZoneValueId;

  const sportsOf = async () =>
    new Map(
      (await prisma.trainingZoneValue.findMany()).map((value) => [
        value.trainingZoneValueId,
        value.sports,
      ]),
    );

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
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
    // Includes a value of zone 2201 without any sports list (NULL)
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
  });

  it('gives every current sport to values saved with a former complete list', async () => {
    expect(
      [MARCH_2025, OCTOBER_2025, NOVEMBER_2025].map((sports) => sports.length),
    ).toEqual([7, 10, 52]);
    const formerComplete = [
      await seed(shuffled(MARCH_2025)),
      await seed(shuffled(OCTOBER_2025)),
      await seed(shuffled(NOVEMBER_2025)),
    ];
    const before = await sportsOf();

    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(3);

    const after = await sportsOf();
    for (const id of formerComplete)
      expect([...(after.get(id) ?? [])].sort()).toEqual([...ALL_SPORTS].sort());
    for (const [id, sports] of before)
      if (!formerComplete.includes(id)) expect(after.get(id)).toEqual(sports);
  });

  it('keeps every other selection as it was', async () => {
    const kept = [
      await seed(['RUNNING', 'TRAIL_RUNNING']),
      // One sport more or less than a former complete list
      await seed([...MARCH_2025, 'YOGA']),
      await seed(NOVEMBER_2025.filter((sport) => sport !== 'GOLF')),
      // Saved after the Mobility migration, so it may be a choice
      await seed(shuffled(ALL_BUT_MOBILITY)),
      await seed(shuffled(ALL_SPORTS)),
      await seed([]),
    ];
    const before = await sportsOf();
    expect(before.size).toBe(kept.length + 1);

    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(0);

    expect(await sportsOf()).toEqual(before);
  });

  it('changes nothing when it runs again', async () => {
    await seed(shuffled(MARCH_2025));
    await seed(shuffled(NOVEMBER_2025));
    await seed(['CYCLING']);
    await prisma.$executeRawUnsafe(migrationSql);
    const once = await sportsOf();

    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(0);

    expect(await sportsOf()).toEqual(once);
  });
});
