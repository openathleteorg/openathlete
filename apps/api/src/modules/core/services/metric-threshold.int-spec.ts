import { ForbiddenException } from '@nestjs/common';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { MetricThresholdScheduler } from 'src/modules/notification/services/metric-threshold.scheduler';
import { PushNotificationService } from 'src/modules/notification/services/push-notification.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { CoachService } from './coach.service';
import { MetricThresholdService } from './metric-threshold.service';
import { TrainingLoadService } from './training-load.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

const DAY_MS = 24 * 3600 * 1000;

describe("watching athletes' metrics (PostgreSQL)", () => {
  let prisma: PrismaService;
  let thresholds: MetricThresholdService;
  let coachService: CoachService;
  const sendPushNotification = jest.fn().mockResolvedValue(true);
  let scheduler: MetricThresholdScheduler;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    thresholds = new MetricThresholdService(prisma);
    // No load in these tests: the form stays empty
    coachService = new CoachService(prisma, {
      getTrainingLoadMetrics: () => Promise.reject(new Error('no load')),
    } as unknown as TrainingLoadService);
    scheduler = new MetricThresholdScheduler(prisma, {
      sendPushNotification,
    } as unknown as PushNotificationService);
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
    return { userId: user.userId, athleteId: user.athlete!.athleteId };
  };

  const setUp = async () => {
    const coach = await person('coach');
    const ana = await person('ana');
    const sam = await person('sam');
    await prisma.coachAthlete.create({
      data: { userId: coach.userId, athleteId: ana.athleteId },
    });
    const user = {
      userId: coach.userId,
      athlete: { athleteId: coach.athleteId },
      coachAthletes: [{ athleteId: ana.athleteId }],
    } as AuthUser;
    return { user, coach, ana, sam };
  };

  /** The day's resting HR, as providers write it: one value a day */
  const restingHr = (athleteId: number, value: number, daysAgo = 0) => {
    const date = new Date(
      new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10),
    );
    return prisma.athleteMetric.upsert({
      where: { athleteId_type_date: { athleteId, type: 'HR_REST', date } },
      create: { athleteId, type: 'HR_REST', value, date },
      update: { value },
    });
  };

  it('only lets a coach watch athletes they coach', async () => {
    const { user, sam } = await setUp();
    await expect(
      thresholds.set(user, {
        athleteIds: [sam.athleteId],
        metricType: 'HR_REST',
        max: 60,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('flags a value past the bounds on the dashboard, with its cause', async () => {
    const { user, ana } = await setUp();
    await thresholds.set(user, {
      athleteIds: [ana.athleteId],
      metricType: 'HR_REST',
      max: 58,
    });
    await restingHr(ana.athleteId, 52, 1);
    await restingHr(ana.athleteId, 63);

    const [row] = (await coachService.getCoachDashboard(user)).athletes;
    expect(row.metrics.HR_REST).toMatchObject({ value: 63 });
    expect(row.alerts).toContainEqual(
      expect.objectContaining({
        type: 'threshold',
        metricType: 'HR_REST',
        value: 63,
        max: 58,
        min: null,
      }),
    );
  });

  it('compares with the period before, and averages the RPE', async () => {
    const { user, ana } = await setUp();
    const activity = (daysAgo: number, rpe: number | null) =>
      prisma.event.create({
        data: {
          athleteId: ana.athleteId,
          name: 'Run',
          type: 'ACTIVITY',
          startDate: new Date(Date.now() - daysAgo * DAY_MS),
          endDate: new Date(Date.now() - daysAgo * DAY_MS + 3600_000),
          activity: {
            create: {
              sport: 'RUNNING',
              distance: 10000,
              elevationGain: 0,
              movingTime: 3600,
              averageSpeed: 2.8,
              maxSpeed: 4,
              externalId: `run-${daysAgo}`,
              rpe,
            },
          },
        },
      });
    await activity(2, 4);
    await activity(3, 7);
    await activity(4, null);
    await activity(10, 5); // the week before

    const end = new Date();
    const start = new Date(end.getTime() - 7 * DAY_MS);
    const [row] = (
      await coachService.getCoachDashboard(
        user,
        { start, end },
        { comparePrevious: true },
      )
    ).athletes;
    expect(row.completedSessions).toBe(3);
    expect(row.averageRpe).toBe(5.5);
    expect(row.previous).toMatchObject({
      completedSessions: 1,
      completedTime: 3600,
    });
  });

  it('notifies each new value past the bounds once, never an old one', async () => {
    const { user, coach, ana } = await setUp();
    await restingHr(ana.athleteId, 70); // already there: no notification
    await thresholds.set(user, {
      athleteIds: [ana.athleteId],
      metricType: 'HR_REST',
      max: 58,
    });
    expect(await scheduler.notifyCrossedThresholds()).toBe(0);

    await restingHr(ana.athleteId, 64);
    // The API and the worker run it at once: one notification
    const runs = await Promise.all([
      scheduler.notifyCrossedThresholds(),
      scheduler.notifyCrossedThresholds(),
    ]);
    expect(runs.sort()).toEqual([0, 1]);
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: coach.userId,
        // In the coach's language: French by default
        body: 'FC de repos 64, au-dessus de 58',
      }),
    );

    // Back within bounds: nothing more
    await restingHr(ana.athleteId, 55);
    expect(await scheduler.notifyCrossedThresholds()).toBe(0);
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
  });
});
