import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  COACH_ATHLETE_ID,
  DELETED_ATHLETE_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's run (event 3002, activity 3501) is linked to the training
// 3001 and to the race 3003 of athlete 2001
const ACTIVITY_EVENT_ID = 3002;
const ACTIVITY_ID = 3501;
const TRAINING_EVENT_ID = 3001;
const RACE_EVENT_ID = 3003;

describe('linking an activity to a session (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  // Athlete 2001, who also coaches athlete 2002
  const user = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [{ athleteId: COACH_ATHLETE_ID }],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    events = new EventService(
      prisma,
      { get: () => undefined } as unknown as ConfigService<
        ApiEnvSchemaType,
        true
      >,
      new CaslAbilityFactory(),
      new EventEmitter2(),
      {} as never,
      {} as never,
      {} as never,
      {} as never,
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

  const plannedSession = (athleteId: number) =>
    prisma.event.create({
      data: {
        name: 'Tempo',
        type: 'TRAINING',
        startDate: new Date('2026-01-07T07:00:00Z'),
        endDate: new Date('2026-01-07T08:00:00Z'),
        athleteId,
        training: { create: { sport: 'RUNNING', goalDuration: 3600 } },
      },
    });

  const linkedSessions = async () => {
    const [trainings, races] = await Promise.all([
      prisma.eventTraining.findMany({
        where: { relatedActivityId: ACTIVITY_ID },
        select: { eventId: true },
      }),
      prisma.eventCompetition.findMany({
        where: { relatedActivityId: ACTIVITY_ID },
        select: { eventId: true },
      }),
    ]);
    return [...trainings, ...races].map(({ eventId }) => eventId).sort();
  };

  it('moves the activity to the session it is dropped on', async () => {
    expect(await linkedSessions()).toEqual([TRAINING_EVENT_ID, RACE_EVENT_ID]);
    const tempo = await plannedSession(DELETED_ATHLETE_ID);

    await events.setRelatedActivity(user, tempo.eventId, ACTIVITY_EVENT_ID);

    expect(await linkedSessions()).toEqual([tempo.eventId]);
  });

  it('links it again to a session it is already linked to', async () => {
    await events.setRelatedActivity(user, TRAINING_EVENT_ID, ACTIVITY_EVENT_ID);
    expect(await linkedSessions()).toEqual([TRAINING_EVENT_ID]);
  });

  it("refuses to link an athlete's activity to another athlete's session", async () => {
    // The user can read both: their own run, and the plan of the athlete
    // they coach
    const coached = await plannedSession(COACH_ATHLETE_ID);

    await expect(
      events.setRelatedActivity(user, coached.eventId, ACTIVITY_EVENT_ID),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await linkedSessions()).toEqual([TRAINING_EVENT_ID, RACE_EVENT_ID]);
  });

  it('unlinks the activity from a session', async () => {
    await events.unsetRelatedActivity(user, TRAINING_EVENT_ID);
    expect(await linkedSessions()).toEqual([RACE_EVENT_ID]);
  });
});
