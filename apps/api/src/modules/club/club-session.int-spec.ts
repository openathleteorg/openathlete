import { EventEmitter2 } from '@nestjs/event-emitter';

import { ClubRole } from '@openathlete/database';

import { addDaysToDateKey, formatZoned } from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { EventBulkService } from 'src/modules/core/services/event-bulk.service';
import { EventService } from 'src/modules/core/services/event.service';
import { PushNotificationService } from 'src/modules/notification';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ClubSessionService, occurrenceDays } from './club-session.service';
import { ClubService } from './club.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const TZ = 'Europe/Paris';
const today = () => formatZoned(new Date(), TZ).slice(0, 10);

describe('club sessions (PostgreSQL)', () => {
  let prisma: PrismaService;
  let sessions: ClubSessionService;
  let clubs: ClubService;
  const sendPushNotification = jest.fn().mockResolvedValue(true);

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const abilities = new CaslAbilityFactory();
    const events = new EventService(
      prisma,
      abilities,
      new EventEmitter2(),
      {} as never,
      {} as never,
      { deleteExportsForWorkout: jest.fn() } as never,
      {} as never,
    );
    sessions = new ClubSessionService(
      prisma,
      abilities,
      events,
      new EventBulkService(prisma, abilities, events),
      { sendPushNotification } as unknown as PushNotificationService,
    );
    clubs = new ClubService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    sendPushNotification.mockClear();
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
  });

  const person = async (name: string) => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@example.com`,
        password: 'hash',
        firstName: name,
        lastName: 'Test',
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    return {
      userId: user.userId,
      athleteId: user.athlete!.athleteId,
      // As the API builds it: with their athlete profile
      session: {
        userId: user.userId,
        athlete: { athleteId: user.athlete!.athleteId },
        coachAthletes: [],
      } as unknown as AuthUser,
    };
  };

  /** A club whose Track group holds Ana; Ben is in the club, not the group */
  const setUp = async () => {
    const coach = await person('coach');
    const [ana, ben] = await Promise.all(['ana', 'ben'].map(person));
    const { clubId } = await clubs.create(coach.userId, { name: 'Club' });
    await prisma.clubMember.createMany({
      data: [ana, ben].map(({ userId }) => ({
        clubId,
        userId,
        role: ClubRole.ATHLETE,
      })),
    });
    const track = await prisma.athleteGroup.create({
      data: {
        name: 'Track',
        clubId,
        members: { create: { athleteId: ana.athleteId } },
      },
    });
    return { clubId, coach, ana, ben, groupId: track.athleteGroupId };
  };

  const eventsOf = (athleteId: number) =>
    prisma.event.findMany({
      where: { athleteId },
      orderBy: { startDate: 'asc' },
      select: {
        eventId: true,
        name: true,
        startDate: true,
        clubSessionId: true,
      },
    });

  it('falls weekly from its first day, without called-off days', () => {
    expect(
      occurrenceDays(
        {
          firstDate: new Date('2026-11-03T00:00:00Z'),
          weekly: true,
          untilDate: new Date('2026-11-24T00:00:00Z'),
          canceledDates: [new Date('2026-11-10T00:00:00Z')],
        },
        '2026-11-05',
        '2026-12-31',
      ),
    ).toEqual(['2026-11-17', '2026-11-24']);
  });

  it("puts a weekly session in its group's calendars, four weeks ahead, at the club's time", async () => {
    const { clubId, coach, ana, ben, groupId } = await setUp();
    const created = await sessions.create(coach.session, clubId, {
      title: 'Track Tuesday',
      location: 'Stadium',
      groupId,
      firstDate: today(),
      startTime: '19:00',
      durationMinutes: 90,
      weekly: true,
      timeZone: TZ,
    });

    const anas = await eventsOf(ana.athleteId);
    expect(anas).toHaveLength(5); // today, then 4 weeks
    expect(formatZoned(anas[0].startDate, TZ).slice(11, 16)).toBe('19:00');
    expect(anas.every((e) => e.clubSessionId === created.clubSessionId)).toBe(
      true,
    );
    expect(await eventsOf(ben.athleteId)).toEqual([]);
    expect(created.upcoming[0]).toMatchObject({ invited: 1, going: 0 });

    // Running it again changes nothing
    expect(await sessions.materialize(created.clubSessionId)).toBe(0);
  });

  it('follows the group: a newcomer gets it, a leaver loses what is to come', async () => {
    const { clubId, coach, ana, ben, groupId } = await setUp();
    const { clubSessionId } = await sessions.create(coach.session, clubId, {
      title: 'Track',
      groupId,
      firstDate: today(),
      startTime: '19:00',
      durationMinutes: 60,
      weekly: true,
      timeZone: TZ,
    });
    await prisma.athleteGroupMember.create({
      data: { athleteGroupId: groupId, athleteId: ben.athleteId },
    });
    await prisma.athleteGroupMember.delete({
      where: {
        athleteGroupId_athleteId: {
          athleteGroupId: groupId,
          athleteId: ana.athleteId,
        },
      },
    });

    await sessions.materializeAll();
    expect(await eventsOf(ben.athleteId)).toHaveLength(5);
    expect(await eventsOf(ana.athleteId)).toEqual([]);
    expect(clubSessionId).toBeGreaterThan(0);
  });

  it('calls an occurrence off, and tells the athletes who had it', async () => {
    const { clubId, coach, ana, groupId } = await setUp();
    const { clubSessionId } = await sessions.create(coach.session, clubId, {
      title: 'Track',
      groupId,
      firstDate: today(),
      startTime: '19:00',
      durationMinutes: 60,
      weekly: true,
      timeZone: TZ,
    });
    const nextWeek = addDaysToDateKey(today(), 7);

    const after = await sessions.cancelOccurrence(
      coach.session,
      clubId,
      clubSessionId,
      nextWeek,
    );
    expect(after.upcoming.map((o) => o.date)).not.toContain(nextWeek);
    const days = (await eventsOf(ana.athleteId)).map((e) =>
      formatZoned(e.startDate, TZ).slice(0, 10),
    );
    expect(days).not.toContain(nextWeek);
    expect(days).toHaveLength(4);
    expect(sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ana.userId }),
    );
    // Not brought back by the next run
    await sessions.materialize(clubSessionId);
    expect(await eventsOf(ana.athleteId)).toHaveLength(4);
  });

  it('counts who comes, from the answers in their calendars', async () => {
    const { clubId, coach, ana, groupId } = await setUp();
    const { clubSessionId } = await sessions.create(coach.session, clubId, {
      title: 'Long run',
      location: 'Park gate',
      groupId,
      firstDate: today(),
      startTime: '09:00',
      durationMinutes: 120,
      weekly: false,
      timeZone: TZ,
    });
    const [event] = await eventsOf(ana.athleteId);

    const answered = await sessions.answer(ana.session, event.eventId, true);
    expect(answered).toMatchObject({
      clubName: 'Club',
      location: 'Park gate',
      going: true,
    });
    const [listed] = await sessions.list(coach.session, clubId);
    expect(listed.clubSessionId).toBe(clubSessionId);
    expect(listed.upcoming).toEqual([
      { date: today(), invited: 1, going: 1, notGoing: 0 },
    ]);
  });
});
