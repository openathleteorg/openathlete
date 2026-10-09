import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { TrainingEvent } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  COACH_USER_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventBulkService } from './event-bulk.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// Athlete 2001's plan in the fixture: the training 3001 (with workout 3201,
// linked to the run 3002), the race 3003 and the note 3004
const TRAINING_ID = 3001;
const ACTIVITY_ID = 3002;
const RACE_ID = 3003;
const NOTE_ID = 3004;

describe('copying and moving planned events (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  let bulk: EventBulkService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [{ athleteId: COACH_ATHLETE_ID }],
  } as unknown as AuthUser;
  const coach = {
    userId: COACH_USER_ID,
    email: 'coach@example.com',
    athlete: { athleteId: COACH_ATHLETE_ID },
    coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
  } as unknown as AuthUser;
  const stranger = {
    userId: 9999,
    email: 'stranger@example.com',
    athlete: { athleteId: 9999 },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    events = new EventService(
      prisma,
      abilities,
      new EventEmitter2(),
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    bulk = new EventBulkService(prisma, abilities, events);
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

  const eventCount = () => prisma.event.count();

  it('copies a week a week later, with its workout and without its activity', async () => {
    const copies = await bulk.duplicate(athlete, {
      eventIds: [TRAINING_ID, NOTE_ID],
      offsetDays: 7,
    });

    expect(copies).toHaveLength(2);
    // The mapped event is typed loosely: read it as the web app does
    const training = copies.find(
      (event) => event.type === 'TRAINING',
    ) as unknown as TrainingEvent;
    expect(training.startDate).toEqual(new Date('2026-01-13T00:00:00Z'));
    expect(training.relatedActivity).toBeFalsy();
    // The fixture's workout: a warm-up, then 5 × an interval
    const steps = training.workout?.steps ?? [];
    expect(steps.map((step) => step.stepType)).toEqual(['WARMUP', 'REPEAT']);
    expect(steps[1].repeatBlock).toMatchObject({ repetitions: 5 });
    expect(steps[1].repeatBlock?.childSteps).toHaveLength(1);
    // A new workout, not the original's
    expect(training.workout?.workoutId).not.toBe(3201);
    // The originals stay where they were
    const original = await prisma.event.findUniqueOrThrow({
      where: { eventId: TRAINING_ID },
      include: { training: true },
    });
    expect(original.startDate).toEqual(new Date('2026-01-06T00:00:00Z'));
    expect(original.training?.relatedActivityId).toBe(3501);
  });

  it("moves at the same local time in the athlete's time zone", async () => {
    await prisma.user.update({
      where: { userId: DELETED_USER_ID },
      data: { timeZone: 'Europe/Paris' },
    });
    // Saturday 24 October 2026, 7:00 in Paris; summer time ends the next night
    await prisma.event.update({
      where: { eventId: NOTE_ID },
      data: {
        startDate: new Date('2026-10-24T05:00:00Z'),
        endDate: new Date('2026-10-24T06:00:00Z'),
      },
    });

    const [moved] = await bulk.move(athlete, {
      eventIds: [NOTE_ID],
      offsetDays: 7,
    });

    expect(moved.startDate).toEqual(new Date('2026-10-31T06:00:00Z'));
    expect(moved.endDate).toEqual(new Date('2026-10-31T07:00:00Z'));
  });

  it('changes nothing when one event cannot be moved', async () => {
    const before = await eventCount();
    // An activity never moves
    await expect(
      bulk.move(athlete, {
        eventIds: [NOTE_ID, ACTIVITY_ID],
        offsetDays: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      bulk.duplicate(athlete, {
        eventIds: [NOTE_ID, ACTIVITY_ID],
        offsetDays: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(await eventCount()).toBe(before);
    const note = await prisma.event.findUniqueOrThrow({
      where: { eventId: NOTE_ID },
    });
    expect(note.startDate).toEqual(new Date('2026-01-07T00:00:00Z'));
  });

  it("lets a coach move their athlete's plan, and nobody else", async () => {
    const [race] = await bulk.move(coach, {
      eventIds: [RACE_ID],
      offsetDays: -1,
    });
    expect(race.startDate).toEqual(new Date('2026-04-30T00:00:00Z'));

    await expect(
      bulk.move(stranger, { eventIds: [RACE_ID], offsetDays: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('leaves the comment thread of a session to the original', async () => {
    // The fixture's thread 3802 belongs to no activity
    await prisma.eventTraining.update({
      where: { eventId: TRAINING_ID },
      data: { messageThreadId: 3802 },
    });

    const [copy] = await bulk.duplicate(athlete, {
      eventIds: [TRAINING_ID],
      offsetDays: 1,
    });
    const single = await events.duplicateEvent(athlete, TRAINING_ID);

    for (const eventId of [copy.eventId, single.eventId]) {
      const training = await prisma.eventTraining.findUniqueOrThrow({
        where: { eventId },
      });
      expect(training.messageThreadId).toBeNull();
    }
  });
});
