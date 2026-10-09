import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EquipmentService } from './equipment.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's run: event 3002, activity 3501, with the athlete's shoes 2101
const EVENT_ID = 3002;
const ACTIVITY_ID = 3501;
const SHOES_ID = 2101;

describe('editing an activity (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  let equipment: EquipmentService;
  const emitter = new EventEmitter2();
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    // Editing an activity touches none of the messaging or export services
    events = new EventService(
      prisma,
      new CaslAbilityFactory(),
      emitter,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    equipment = new EquipmentService(prisma);
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

  const activity = () =>
    prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: ACTIVITY_ID },
      include: { event: true },
    });

  it('changes the equipment and marks the activity as a race', async () => {
    const bike = await prisma.equipment.create({
      data: { name: 'Bike', type: 'BIKE', athleteId: DELETED_ATHLETE_ID },
    });

    // As the form sends it: every field, dates included
    const { event } = await activity();
    await events.updateEvent(athlete, EVENT_ID, {
      type: EVENT_TYPE.ACTIVITY,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      sport: SPORT_TYPE.RUNNING,
      description: '',
      rpe: null,
      equipmentId: bike.equipmentId,
      isRace: true,
    });
    expect(await activity()).toMatchObject({
      equipmentId: bike.equipmentId,
      isRace: true,
    });

    // The run's 10 km moved from the shoes to the bike
    const totals = await equipment.getMyEquipment(athlete);
    expect(
      Object.fromEntries(totals.map((e) => [e.name, e.totalDistance])),
    ).toEqual({ Bike: 10000, Shoes: 0 });

    await events.updateEvent(athlete, EVENT_ID, {
      type: EVENT_TYPE.ACTIVITY,
      equipmentId: null,
    });
    expect((await activity()).equipmentId).toBeNull();
  });

  it("refuses someone else's equipment", async () => {
    const theirs = await prisma.equipment.create({
      data: { name: 'Theirs', type: 'SHOE', athleteId: COACH_ATHLETE_ID },
    });

    await expect(
      events.updateEvent(athlete, EVENT_ID, {
        type: EVENT_TYPE.ACTIVITY,
        equipmentId: theirs.equipmentId,
      }),
    ).rejects.toThrow(BadRequestException);
    expect((await activity()).equipmentId).toBe(SHOES_ID);
  });

  it('moves the activity with its duration and its records', async () => {
    await prisma.event.update({
      where: { eventId: EVENT_ID },
      data: {
        startDate: new Date('2026-01-06T07:00:00Z'),
        endDate: new Date('2026-01-06T08:00:00Z'),
      },
    });
    const moved = jest.fn();
    emitter.on('activity.imported', moved);

    await events.updateEvent(athlete, EVENT_ID, {
      type: EVENT_TYPE.ACTIVITY,
      startDate: new Date('2026-01-08T18:30:00Z'),
    });

    const { event } = await activity();
    expect(event.startDate.toISOString()).toBe('2026-01-08T18:30:00.000Z');
    expect(event.endDate.toISOString()).toBe('2026-01-08T19:30:00.000Z');
    const record = await prisma.record.findFirstOrThrow({
      where: { eventActivityId: ACTIVITY_ID },
    });
    expect(record.date.toISOString()).toBe('2026-01-08T18:30:00.000Z');
    // The daily training load follows the new date
    expect(moved).toHaveBeenCalled();
    emitter.removeAllListeners('activity.imported');
  });
});
