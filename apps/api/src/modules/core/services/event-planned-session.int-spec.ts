import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENT_TYPE } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
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

// The fixture's run (event 3002, activity 3501) is linked to the training of
// event 3001, whose workout warms up then repeats an interval 5 times
const RUN_EVENT_ID = 3002;
const TRAINING_EVENT_ID = 3001;

describe('an activity read on its own (PostgreSQL)', () => {
  let prisma: PrismaService;
  let events: EventService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    events = new EventService(
      prisma,
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

  it('carries the training it was linked to, with its workout', async () => {
    await prisma.eventTraining.update({
      where: { eventId: TRAINING_EVENT_ID },
      data: { goalDuration: 3600 },
    });

    const run = await events.getEventById(athlete, RUN_EVENT_ID);

    expect(run).toMatchObject({
      plannedSession: {
        type: EVENT_TYPE.TRAINING,
        eventId: TRAINING_EVENT_ID,
        goalDuration: 3600,
        goalDistance: null,
      },
    });
    const steps = run.plannedSession!.workout!.steps;
    expect(steps.map((step) => step.stepType)).toEqual(['WARMUP', 'REPEAT']);
    expect(steps[1].repeatBlock).toMatchObject({ repetitions: 5 });
    expect(steps[1].repeatBlock!.childSteps[0].targets).toHaveLength(1);
  });

  it('falls back to the race it was linked to', async () => {
    await prisma.eventTraining.updateMany({
      data: { relatedActivityId: null },
    });

    const run = await events.getEventById(athlete, RUN_EVENT_ID);

    expect(run.plannedSession).toMatchObject({
      type: EVENT_TYPE.COMPETITION,
      eventId: 3003,
    });
    expect(run.plannedSession!.workout).toBeUndefined();
  });

  it('carries no plan when nothing is linked', async () => {
    await prisma.eventTraining.updateMany({
      data: { relatedActivityId: null },
    });
    await prisma.eventCompetition.updateMany({
      data: { relatedActivityId: null },
    });

    const run = await events.getEventById(athlete, RUN_EVENT_ID);

    expect(run).not.toHaveProperty('plannedSession');
  });

  describe('GPS track', () => {
    it('gives it as GPX, and nothing without one', async () => {
      await expect(events.getEventGpx(athlete, RUN_EVENT_ID)).rejects.toThrow(
        'No GPS track',
      );

      // As the imports store it: compressed, latlng only with a valid point
      await prisma.eventActivity.update({
        where: { eventId: RUN_EVENT_ID },
        data: {
          stream: {
            time: [{ s: 0, i: 3 }],
            latlng: [[47.6, 11.2], [], [47.61, 11.21]],
            altitude: [{ r: 3, v: 640 }],
          },
        },
      });
      const gpx = await events.getEventGpx(athlete, RUN_EVENT_ID);
      expect(gpx.fileName).toMatch(/^\d{4}-\d{2}-\d{2}-Run\.gpx$/);
      expect(gpx.content.match(/<trkseg>/g)).toHaveLength(2);
      expect(gpx.content).toContain('<ele>640.0</ele>');
      expect(gpx.content).not.toContain('<src>');
    });

    it('names Garmin and the device as the source of a Garmin activity', async () => {
      await prisma.eventActivity.update({
        where: { eventId: RUN_EVENT_ID },
        data: {
          provider: 'GARMIN',
          deviceName: 'Forerunner 965',
          stream: {
            time: [0, 1],
            latlng: [
              [47.6, 11.2],
              [47.61, 11.21],
            ],
          },
        },
      });
      const gpx = await events.getEventGpx(athlete, RUN_EVENT_ID);
      expect(gpx.content).toMatch(
        /<name>Run<\/name>\n\s*<src>Garmin Forerunner 965<\/src>\n\s*<type>/,
      );
    });

    it("is not given for another athlete's activity", async () => {
      const stranger = {
        userId: 999999,
        email: 'stranger@example.com',
        athlete: { athleteId: 999999 },
        coachAthletes: [],
      } as unknown as AuthUser;
      await expect(events.getEventGpx(stranger, RUN_EVENT_ID)).rejects.toThrow(
        'Event not found',
      );
    });
  });
});
