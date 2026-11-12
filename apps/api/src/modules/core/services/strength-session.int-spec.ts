import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { CompleteStrengthSessionDto } from '@openathlete/shared';

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
import { QueueService } from 'src/modules/queue/queue.service';

import { CustomExerciseService } from './custom-exercise.service';
import { EventService } from './event.service';
import { StrengthSessionService } from './strength-session.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// Athlete 2001 (user 1001) is coached by user 1002, and coaches athlete 2002
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
  userId: 999_999,
  email: 'stranger@example.com',
  athlete: null,
  coachAthletes: [],
} as unknown as AuthUser;

const played: CompleteStrengthSessionDto = {
  startedAt: new Date('2026-01-07T18:00:00Z'),
  durationSeconds: 2700,
  rpe: 7,
  comment: 'Dernière série dure',
  log: {
    version: 1,
    sets: [
      {
        key: 'b0.s0',
        exerciseRef: 'c:barbell-full-squat',
        name: 'Squat',
        reps: 5,
        seconds: null,
        load: 80,
        skipped: false,
      },
    ],
    amrapRounds: {},
  },
};

describe('strength sessions and custom exercises (PostgreSQL)', () => {
  let prisma: PrismaService;
  let sessions: StrengthSessionService;
  let exercises: CustomExerciseService;
  const queue = {
    addActivityProcessingJob: jest.fn().mockResolvedValue(undefined),
  };

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
      {} as never,
      {} as never,
    );
    sessions = new StrengthSessionService(
      prisma,
      abilities,
      events,
      queue as unknown as QueueService,
    );
    exercises = new CustomExerciseService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    queue.addActivityProcessingJob.mockClear();
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
  });

  const plannedStrength = (athleteId = DELETED_ATHLETE_ID) =>
    prisma.event.create({
      data: {
        name: 'Force jambes',
        type: 'TRAINING',
        startDate: new Date('2026-01-07T18:00:00Z'),
        endDate: new Date('2026-01-07T19:00:00Z'),
        athleteId,
        training: {
          create: {
            sport: 'STRENGTH',
            workout: {
              create: {
                steps: {
                  create: [
                    {
                      orderIndex: 0,
                      stepType: 'INTERVAL_ACTIVE',
                      durationType: 'REPS',
                      durationValue: 5,
                      name: 'Squat',
                      exerciseRef: 'c:barbell-full-squat',
                      tempo: '3-1-1-0',
                      side: 'EACH',
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

  it('turns the played session into its linked activity, with the sets', async () => {
    const planned = await plannedStrength();

    const activity = await sessions.complete(athlete, planned.eventId, played);

    const stored = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventId: activity.eventId },
      include: { event: true, relatedTraining: true },
    });
    expect(stored).toMatchObject({
      sport: 'STRENGTH',
      movingTime: 2700,
      rpe: 0.7,
      description: 'Dernière série dure',
      strengthLog: played.log,
      event: {
        name: 'Force jambes',
        athleteId: DELETED_ATHLETE_ID,
        startDate: played.startedAt,
        endDate: new Date('2026-01-07T18:45:00Z'),
      },
      relatedTraining: { eventId: planned.eventId },
    });
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(
      stored.eventActivityId,
      activity.eventId,
    );
  });

  it('keeps the strength fields of the planned steps', async () => {
    const planned = await plannedStrength();
    const step = await prisma.workoutStep.findFirstOrThrow({
      where: { workout: { eventTraining: { eventId: planned.eventId } } },
    });
    expect(step).toMatchObject({
      exerciseRef: 'c:barbell-full-squat',
      tempo: '3-1-1-0',
      side: 'EACH',
    });
  });

  it('lets the coach record it, not a stranger', async () => {
    const planned = await plannedStrength();
    await expect(
      sessions.complete(stranger, planned.eventId, played),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      sessions.complete(coach, planned.eventId, played),
    ).resolves.toMatchObject({ type: 'ACTIVITY' });
  });

  it('records a session once', async () => {
    const planned = await plannedStrength();
    await sessions.complete(athlete, planned.eventId, played);
    await expect(
      sessions.complete(athlete, planned.eventId, played),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      await prisma.eventActivity.count({ where: { sport: 'STRENGTH' } }),
    ).toBe(1);
  });

  it('shares custom exercises between a coach and their athletes only', async () => {
    // The fixture gives each user one exercise already
    const pistol = await exercises.create(coach, {
      name: 'Pistol squat on a box',
      instructions: 'Sur une jambe',
      mediaUrl: 'https://example.com/pistol.mp4',
      defaultDurationType: 'REPS' as never,
    });
    expect(pistol).toMatchObject({
      ref: `u:${pistol.customExerciseId}`,
      mine: true,
    });

    expect(await exercises.list(athlete)).toContainEqual(
      expect.objectContaining({ ref: pistol.ref, mine: false }),
    );
    expect(await exercises.list(stranger)).toEqual([]);

    await expect(
      exercises.update(athlete, pistol.customExerciseId, { name: 'Mine now' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      exercises.remove(athlete, pistol.customExerciseId),
    ).rejects.toBeInstanceOf(NotFoundException);

    await exercises.update(coach, pistol.customExerciseId, { name: 'Pistol' });
    await exercises.remove(coach, pistol.customExerciseId);
    expect(
      (await exercises.list(coach)).map((exercise) => exercise.ref),
    ).not.toContain(pistol.ref);
  });
});
