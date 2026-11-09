import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

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
    'prisma/schema/migrations/20261103120000_remap_foreign_zone_targets/migration.sql',
  ),
  'utf8',
);

// The fixture: athlete 2001 (coached by the user of athlete 2002) has a
// running training (event 3001) whose workout has a top level step (3301)
// and a step inside a repeat block (3303), and one heart rate zone (2201).
const ATHLETE = 2001;
const COACH_ATHLETE = 2002;
const TOP_STEP = 3301;
const REPEAT_CHILD_STEP = 3303;

describe('remap_foreign_zone_targets migration (PostgreSQL)', () => {
  let prisma: PrismaService;
  const now = 'CURRENT_TIMESTAMP';

  const addZone = async (
    id: number,
    athleteId: number,
    index: number,
    type: 'HEARTRATE' | 'POWER',
    sports: string[] = [],
  ) => {
    await prisma.$executeRawUnsafe(
      `INSERT INTO training_zone (training_zone_id, name, description, "index", type, color, athlete_id, updated_at)
       VALUES (${id}, 'Z${index + 1}', '', ${index}, '${type}', '#000', ${athleteId}, ${now})`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO training_zone_value (min, max, sports, training_zone_id, updated_at)
       VALUES (0, 1, ARRAY[${sports.map((s) => `'${s}'`).join(',')}]::sport_type[], ${id}, ${now})`,
    );
  };

  const addTarget = async (stepId: number, zoneId: number) =>
    (
      await prisma.workoutStepTarget.create({
        data: { targetType: 'ZONE', targetValue: zoneId, stepId },
      })
    ).workoutStepTargetId;

  const zoneOf = async (targetId: number) =>
    (
      await prisma.workoutStepTarget.findUniqueOrThrow({
        where: { workoutStepTargetId: targetId },
      })
    ).targetValue;

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
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
    // The fixture's zone stays the athlete's first heart rate zone: 2201,
    // index 1. Four more heart rate zones, then the coach's five.
    for (const index of [2, 3, 4, 5])
      await addZone(2201 + index - 1, ATHLETE, index, 'HEARTRATE');
    for (const index of [0, 1, 2, 3, 4])
      await addZone(5100 + index, COACH_ATHLETE, index, 'HEARTRATE');
  });

  it("points the coach's zones to the athlete's zones at the same position", async () => {
    const top = await addTarget(TOP_STEP, 5101);
    const nested = await addTarget(REPEAT_CHILD_STEP, 5104);

    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(2);

    expect(await zoneOf(top)).toBe(2202);
    expect(await zoneOf(nested)).toBe(2205);
  });

  it('ranks zones among those of the session sport', async () => {
    // The coach's power zones: two for cycling first, then two for running
    await addZone(5200, COACH_ATHLETE, 0, 'POWER', ['CYCLING']);
    await addZone(5201, COACH_ATHLETE, 1, 'POWER', ['CYCLING']);
    await addZone(5202, COACH_ATHLETE, 2, 'POWER', ['RUNNING']);
    await addZone(5203, COACH_ATHLETE, 3, 'POWER', ['RUNNING']);
    await addZone(2300, ATHLETE, 0, 'POWER', []);
    await addZone(2301, ATHLETE, 1, 'POWER', []);
    const target = await addTarget(TOP_STEP, 5203);

    await prisma.$executeRawUnsafe(migrationSql);

    expect(await zoneOf(target)).toBe(2301);
  });

  it("leaves the athlete's own zones, unknown ids, zones without equivalent and templates", async () => {
    await addZone(5300, COACH_ATHLETE, 0, 'POWER');
    const own = await addTarget(TOP_STEP, 2203);
    const unknown = await addTarget(TOP_STEP, -2);
    const noEquivalent = await addTarget(TOP_STEP, 5300);
    // A template: the same session without an athlete
    await prisma.$executeRawUnsafe(
      `INSERT INTO event (event_id, start_date, end_date, name, type, updated_at) VALUES (3900, '2026-01-06', '2026-01-06', 'Template', 'TRAINING', ${now})`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO event_training (event_training_id, event_id, sport) VALUES (3910, 3900, 'RUNNING')`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO workout (workout_id, event_training_id, updated_at) VALUES (3920, 3910, ${now})`,
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO workout_step (workout_step_id, workout_id, order_index, step_type, duration_type, updated_at) VALUES (3930, 3920, 0, 'STEADY', 'TIME', ${now})`,
    );
    const template = await addTarget(3930, 5101);

    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(0);

    expect(await zoneOf(own)).toBe(2203);
    expect(await zoneOf(unknown)).toBe(-2);
    expect(await zoneOf(noEquivalent)).toBe(5300);
    expect(await zoneOf(template)).toBe(5101);
  });

  it('changes nothing when it runs again', async () => {
    const target = await addTarget(TOP_STEP, 5100);

    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(1);
    expect(await prisma.$executeRawUnsafe(migrationSql)).toBe(0);
    expect(await zoneOf(target)).toBe(2201);
  });
});
