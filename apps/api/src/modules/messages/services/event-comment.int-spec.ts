import { BadRequestException, NotFoundException } from '@nestjs/common';

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

import { EventCommentService } from './event-comment.service';
import { MessageThreadService } from './message-thread.service';
import { MessageService } from './message.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// The fixture's planned session, its activity, a race and a note
const TRAINING = 3001;
const ACTIVITY = 3002;
const NOTE = 3004;

describe('comments on sessions and activities (PostgreSQL)', () => {
  let prisma: PrismaService;
  let comments: EventCommentService;
  const athlete = {
    userId: DELETED_USER_ID,
    email: 'athlete@example.com',
    athlete: { athleteId: DELETED_ATHLETE_ID },
    coachAthletes: [],
  } as unknown as AuthUser;
  // Coaches the athlete
  const coach = {
    userId: COACH_USER_ID,
    email: 'coach@example.com',
    athlete: { athleteId: COACH_ATHLETE_ID },
    coachAthletes: [{ athleteId: DELETED_ATHLETE_ID }],
  } as unknown as AuthUser;
  const stranger = {
    userId: 999,
    email: 'stranger@example.com',
    athlete: null,
    coachAthletes: [],
  } as unknown as AuthUser;
  const range = [
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-31T00:00:00Z'),
  ] as const;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const threads = new MessageThreadService(prisma);
    comments = new EventCommentService(
      prisma,
      new CaslAbilityFactory(),
      new MessageService(prisma, threads),
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

  it('starts a thread on the first comment of a planned session, with the coach in it', async () => {
    expect(await comments.list(athlete, TRAINING)).toEqual({
      comments: [],
      unread: 0,
    });

    await comments.add(athlete, TRAINING, 'Legs felt heavy on the warm-up');

    const training = await prisma.eventTraining.findUniqueOrThrow({
      where: { eventId: TRAINING },
      include: { messageThread: { include: { participants: true } } },
    });
    expect(
      training.messageThread?.participants.map((p) => p.userId).sort(),
    ).toEqual([DELETED_USER_ID, COACH_USER_ID].sort());

    // Unread for the coach, not for its author
    const forCoach = await comments.list(coach, TRAINING);
    expect(forCoach).toMatchObject({
      unread: 1,
      comments: [
        {
          content: 'Legs felt heavy on the warm-up',
          mine: false,
          sender: { userId: DELETED_USER_ID },
        },
      ],
    });
    expect((await comments.list(athlete, TRAINING)).unread).toBe(0);
  });

  it('counts comments and unread ones per event over a range', async () => {
    await comments.add(athlete, TRAINING, 'Done, but shorter');
    await comments.add(athlete, ACTIVITY, 'Knee ok');
    await comments.add(coach, ACTIVITY, 'Great pacing');

    const byEvent = (list: { eventId: number }[]) =>
      [...list].sort((a, b) => a.eventId - b.eventId);
    expect(
      byEvent(
        await comments.counts(coach, range[0], range[1], DELETED_ATHLETE_ID),
      ),
    ).toEqual([
      { eventId: TRAINING, count: 1, unread: 1 },
      // Replying marks the thread read for the coach
      { eventId: ACTIVITY, count: 2, unread: 0 },
    ]);
    expect(byEvent(await comments.counts(athlete, range[0], range[1]))).toEqual(
      [
        { eventId: TRAINING, count: 1, unread: 0 },
        { eventId: ACTIVITY, count: 2, unread: 1 },
      ],
    );

    await comments.markRead(athlete, ACTIVITY);
    expect(
      (await comments.counts(athlete, range[0], range[1])).find(
        (entry) => entry.eventId === ACTIVITY,
      )?.unread,
    ).toBe(0);
  });

  it('lets a coach who arrived after the first comment join the thread', async () => {
    await prisma.coachAthlete.deleteMany({ where: { userId: COACH_USER_ID } });
    await comments.add(athlete, TRAINING, 'Before my coach');
    await prisma.coachAthlete.create({
      data: { userId: COACH_USER_ID, athleteId: DELETED_ATHLETE_ID },
    });

    await comments.add(coach, TRAINING, 'Welcome');
    expect(
      (await comments.list(athlete, TRAINING)).comments.map((c) => c.content),
    ).toEqual(['Before my coach', 'Welcome']);
  });

  it('refuses events the user cannot see, and notes', async () => {
    await expect(comments.add(stranger, TRAINING, 'Hi')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(comments.list(stranger, TRAINING)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(comments.add(athlete, NOTE, 'Hi')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
