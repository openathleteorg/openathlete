import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  AthleteCalendarExportService,
  CALENDAR_EXPORT_FORMAT,
} from './athlete-calendar-export.service';
import { EventBulkService } from './event-bulk.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

type ExportedEvent = {
  name: string;
  type: string;
  createdById: number | null;
  createdByMe: boolean;
  createdBy: { firstName: string; lastName: string } | null;
};

describe("a coach's export of an athlete's calendar (PostgreSQL)", () => {
  let prisma: PrismaService;
  let events: EventService;
  let bulk: EventBulkService;
  let exports: AthleteCalendarExportService;

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
      { deleteExportsForWorkout: jest.fn() } as never,
      {} as never,
    );
    bulk = new EventBulkService(prisma, abilities, events);
    exports = new AthleteCalendarExportService(prisma, abilities);
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
  });

  const person = async (name: string, coaching: number[] = []) => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@example.com`,
        password: 'hash',
        firstName: name,
        lastName: 'Test',
        timeZone: 'Europe/Paris',
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    const athleteId = user.athlete!.athleteId;
    for (const coached of coaching) {
      await prisma.coachAthlete.create({
        data: { userId: user.userId, athleteId: coached },
      });
    }
    const auth = {
      userId: user.userId,
      email: `${name}@example.com`,
      athlete: { athleteId },
      coachAthletes: coaching.map((coached) => ({ athleteId: coached })),
    } as unknown as AuthUser;
    return { userId: user.userId, athleteId, auth };
  };

  const session = (athleteId: number, name: string, day: string) => ({
    type: EVENT_TYPE.TRAINING as const,
    athleteId,
    name,
    sport: SPORT_TYPE.RUNNING,
    description: '',
    // In the past: no load estimate to schedule
    startDate: new Date(`${day}T17:00:00Z`),
    endDate: new Date(`${day}T18:00:00Z`),
  });

  const exportOf = async (user: AuthUser, athleteId: number) => {
    let body = '';
    await exports.export(user, athleteId, {
      write: (chunk: string) => (body += chunk),
      end: () => undefined,
    });
    return JSON.parse(body) as {
      format: string;
      athlete: { firstName: string };
      events: ExportedEvent[];
    };
  };

  it('records who planned a session, and exports the planned calendar', async () => {
    const gil = await person('gil');
    const coach = await person('corinne', [gil.athleteId]);

    const planned = await events.createEvent(
      coach.auth,
      session(gil.athleteId, 'Intervals', '2026-03-02'),
    );
    await events.createEvent(
      gil.auth,
      session(gil.athleteId, 'Own jog', '2026-03-03'),
    );
    // A copy is the copier's work
    await bulk.duplicate(gil.auth, {
      eventIds: [planned.eventId],
      offsetDays: 7,
    });
    // Recorded activities are the athlete's own data, not the plan
    await prisma.event.create({
      data: {
        athleteId: gil.athleteId,
        name: 'Morning run',
        type: 'ACTIVITY',
        startDate: new Date('2026-03-02T06:00:00Z'),
        endDate: new Date('2026-03-02T07:00:00Z'),
        activity: {
          create: {
            externalId: 'strava-1',
            sport: 'RUNNING',
            distance: 10000,
            elevationGain: 50,
            movingTime: 3600,
            averageSpeed: 2.8,
            maxSpeed: 4,
          },
        },
      },
    });

    const file = await exportOf(coach.auth, gil.athleteId);

    expect(file.format).toBe(CALENDAR_EXPORT_FORMAT);
    expect(file.athlete.firstName).toBe('gil');
    expect(
      file.events.map(({ name, createdByMe, createdBy }) => ({
        name,
        createdByMe,
        by: createdBy?.firstName,
      })),
    ).toEqual([
      { name: 'Intervals', createdByMe: true, by: 'corinne' },
      { name: 'Own jog', createdByMe: false, by: 'gil' },
      { name: 'Intervals', createdByMe: false, by: 'gil' },
    ]);
  });

  it('refuses an athlete the user does not coach', async () => {
    const gil = await person('gil');
    const stranger = await person('stranger');
    await events.createEvent(
      gil.auth,
      session(gil.athleteId, 'Own jog', '2026-03-03'),
    );

    await expect(exportOf(stranger.auth, gil.athleteId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("keeps a coach's sessions in the calendar once the coach is gone", async () => {
    const gil = await person('gil');
    const coach = await person('corinne', [gil.athleteId]);
    const planned = await events.createEvent(
      coach.auth,
      session(gil.athleteId, 'Intervals', '2026-03-02'),
    );

    await prisma.coachAthlete.deleteMany({ where: { userId: coach.userId } });
    await prisma.athlete.delete({ where: { athleteId: coach.athleteId } });
    await prisma.user.delete({ where: { userId: coach.userId } });

    const kept = await prisma.event.findUniqueOrThrow({
      where: { eventId: planned.eventId },
      select: { createdById: true },
    });
    expect(kept.createdById).toBeNull();
  });
});
