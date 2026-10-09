import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  DELETED_ATHLETE_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EquipmentProcessor } from './equipment.processor';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const BACKFILL = readFileSync(
  path.join(
    __dirname,
    '../../../../../../../../libs/database/prisma/schema/migrations/20261009190000_attach_default_equipment/migration.sql',
  ),
  'utf8',
);

describe('default equipment (PostgreSQL)', () => {
  let prisma: PrismaService;
  let processor: EquipmentProcessor;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    processor = new EquipmentProcessor(prisma);
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

  const shoes = (name: string, createdAt: string, isDefault = true) =>
    prisma.equipment.create({
      data: {
        name,
        type: 'SHOE',
        isDefault,
        sports: ['TRAIL_RUNNING'],
        athleteId: DELETED_ATHLETE_ID,
        createdAt: new Date(createdAt),
      },
    });

  const activity = (
    day: string,
    sport: 'TRAIL_RUNNING' | 'CYCLING',
    equipmentId?: number,
  ) =>
    prisma.event.create({
      data: {
        name: 'Run',
        type: 'ACTIVITY',
        startDate: new Date(`${day}T07:00:00Z`),
        endDate: new Date(`${day}T08:00:00Z`),
        athleteId: DELETED_ATHLETE_ID,
        activity: {
          create: {
            sport,
            distance: 12000,
            elevationGain: 400,
            movingTime: 3600,
            averageSpeed: 3.3,
            maxSpeed: 4,
            externalId: `ext-${day}-${sport}-${equipmentId ?? 'none'}`,
            equipmentId,
          },
        },
      },
      include: { activity: true },
    });

  it('attaches the default equipment of the sport to an imported activity', async () => {
    const trail = await shoes('Trail shoes', '2026-01-01');
    const run = await activity('2026-03-01', 'TRAIL_RUNNING');
    const ride = await activity('2026-03-02', 'CYCLING');

    for (const event of [run, ride]) {
      await processor.run({
        eventId: event.eventId,
        eventActivityId: event.activity!.eventActivityId,
      });
    }

    const stored = await prisma.eventActivity.findMany({
      where: { eventId: { in: [run.eventId, ride.eventId] } },
      orderBy: { eventId: 'asc' },
      select: { equipmentId: true },
    });
    expect(stored).toEqual([
      { equipmentId: trail.equipmentId },
      // No default bike
      { equipmentId: null },
    ]);
  });

  it('keeps the equipment an activity already has', async () => {
    await shoes('Trail shoes', '2026-01-01');
    const chosen = await shoes('Old pair', '2025-01-01', false);
    const run = await activity(
      '2026-03-01',
      'TRAIL_RUNNING',
      chosen.equipmentId,
    );

    await processor.run({
      eventId: run.eventId,
      eventActivityId: run.activity!.eventActivityId,
    });

    expect(
      (
        await prisma.eventActivity.findUniqueOrThrow({
          where: { eventActivityId: run.activity!.eventActivityId },
        })
      ).equipmentId,
    ).toBe(chosen.equipmentId);
  });

  it('backfills activities done since the equipment was created', async () => {
    const trail = await shoes('Trail shoes', '2026-02-01');
    const before = await activity('2026-01-15', 'TRAIL_RUNNING');
    const after = await activity('2026-02-10', 'TRAIL_RUNNING');

    await prisma.$executeRawUnsafe(BACKFILL);

    const equipmentOf = async (eventId: number) =>
      (await prisma.eventActivity.findUniqueOrThrow({ where: { eventId } }))
        .equipmentId;
    expect(await equipmentOf(before.eventId)).toBeNull();
    expect(await equipmentOf(after.eventId)).toBe(trail.equipmentId);
  });
});
