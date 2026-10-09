import { NotFoundException } from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadService } from './training-load.service';

const athlete: AuthUser = {
  userId: 2,
  email: 'athlete@example.test',
  athlete: { athleteId: 12 },
  coachAthletes: [],
};
const coach: AuthUser = {
  userId: 1,
  email: 'coach@example.test',
  athlete: null,
  coachAthletes: [{ athleteId: 12 }],
};
const stranger: AuthUser = {
  userId: 3,
  email: 'stranger@example.test',
  athlete: { athleteId: 99 },
  coachAthletes: [{ athleteId: 13 }],
};

function setup() {
  const activity = {
    eventId: 50,
    athleteId: 12,
    type: 'ACTIVITY',
    activity: { eventActivityId: 101 },
  };
  const entries = [{ value: 48.6, calculation: { type: 'TRIMP' } }];
  // Stand-in for the database: the stored activity matches when the query
  // names it and, if the query restricts athletes, allows its athlete.
  const findFirst = jest.fn(async ({ where }: { where: unknown }) => {
    const query = JSON.stringify(where);
    const athletes = [...query.matchAll(/"athleteId":(\d+)/g)].map(([, id]) =>
      Number(id),
    );
    return query.includes('"eventId":50') &&
      (!athletes.length || athletes.includes(activity.athleteId))
      ? activity
      : null;
  });
  const prisma = {
    event: { findFirst },
    trainingLoadEntry: { findMany: jest.fn().mockResolvedValue(entries) },
  };
  const service = new TrainingLoadService(
    prisma as unknown as PrismaService,
    new CaslAbilityFactory(),
  );
  return { prisma, service, entries };
}

describe('TrainingLoadService.getActivityTrainingLoads', () => {
  it.each([
    ['the athlete', athlete],
    ['a linked coach', coach],
  ])('returns the saved loads to %s', async (_who, user) => {
    const { prisma, service, entries } = setup();
    await expect(service.getActivityTrainingLoads(user, 50)).resolves.toBe(
      entries,
    );
    expect(prisma.trainingLoadEntry.findMany).toHaveBeenCalledWith({
      where: { activityId: 101 },
      include: { calculation: true },
    });
  });

  it('hides activities of athletes the user is not linked to', async () => {
    const { prisma, service } = setup();
    await expect(
      service.getActivityTrainingLoads(stranger, 50),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.trainingLoadEntry.findMany).not.toHaveBeenCalled();
  });
});

/**
 * Stand-in database for the weekly summary: TRIMP entries keyed by day, the
 * planned events of the range and the athlete's heart rate profile.
 */
function weeklySummaryService({
  loads = {},
  plannedEvents = [],
  heartRate = { HR_MAX: 190, HR_REST: 50 },
  firstActivity = Object.keys(loads).sort()[0],
}: {
  loads?: Record<string, number>;
  plannedEvents?: unknown[];
  heartRate?: Record<string, number>;
  /** Day of the athlete's first activity; by default their first load */
  firstActivity?: string;
}) {
  const prisma = {
    athlete: {
      findFirst: jest.fn().mockResolvedValue({ athleteId: 12 }),
      findUnique: jest.fn().mockResolvedValue({ user: { gender: 'MALE' } }),
    },
    athleteMetric: {
      findFirst: jest.fn(async ({ where }: { where: { type: string } }) =>
        where.type in heartRate ? { value: heartRate[where.type] } : null,
      ),
    },
    trainingLoadEntry: {
      findMany: jest.fn().mockResolvedValue(
        Object.entries(loads).map(([day, value]) => ({
          date: new Date(`${day}T00:00:00Z`),
          value,
        })),
      ),
    },
    event: {
      findMany: jest.fn().mockResolvedValue(plannedEvents),
      findFirst: jest
        .fn()
        .mockResolvedValue(
          firstActivity
            ? { startDate: new Date(`${firstActivity}T08:00:00Z`) }
            : null,
        ),
    },
  };
  const service = new TrainingLoadService(
    prisma as unknown as PrismaService,
    {
      getFor: jest.fn().mockResolvedValue({}),
    } as unknown as CaslAbilityFactory,
  );
  return { prisma, service };
}

describe('TrainingLoadService weekly ACWR', () => {
  /** Weekly summaries for TRIMP entries keyed by day (one per week here). */
  async function weeks(
    loads: Record<string, number>,
    from: string,
    to: string,
    firstActivity?: string,
  ) {
    const { service } = weeklySummaryService({
      loads,
      ...(firstActivity && { firstActivity }),
    });
    const summaries = await service.getWeeklyTrimpSummary(
      athlete,
      new Date(`${from}T00:00:00Z`),
      new Date(`${to}T00:00:00Z`),
    );
    return Object.fromEntries(
      summaries.map((week) => [
        week.weekStart.toISOString().slice(0, 10),
        { acwr: week.acwr, status: week.acwrStatus },
      ]),
    );
  }

  it('waits for three weeks of load and ignores the empty weeks before them', async () => {
    // A new athlete: no data before 17 August
    const result = await weeks(
      {
        '2026-08-17': 721,
        '2026-08-24': 483,
        '2026-08-31': 236,
        '2026-09-07': 1053,
      },
      '2026-08-17',
      '2026-09-07',
    );
    expect(result['2026-08-17']).toEqual({
      acwr: undefined,
      status: undefined,
    });
    expect(result['2026-08-24']).toEqual({
      acwr: undefined,
      status: undefined,
    });
    expect(result['2026-08-31']).toEqual({
      acwr: undefined,
      status: undefined,
    });
    // CTL over 721, 483 and 236, the latest weighing most: 419
    expect(result['2026-09-07']).toEqual({ acwr: 2.51, status: 'high_risk' });
  });

  it('gives an ACWR of 1 for steady training', async () => {
    const steady = Object.fromEntries(
      [
        '2026-08-03',
        '2026-08-10',
        '2026-08-17',
        '2026-08-24',
        '2026-08-31',
        '2026-09-07',
        '2026-09-14',
      ].map((day) => [day, 300]),
    );
    const result = await weeks(steady, '2026-09-14', '2026-09-14');
    expect(result['2026-09-14']).toEqual({ acwr: 1, status: 'optimal' });
  });

  it('counts empty weeks after the first activity as rest', async () => {
    // Training since June, then two weeks off five and six weeks ago
    const result = await weeks(
      {
        '2026-06-01': 400,
        '2026-08-17': 400,
        '2026-08-24': 400,
        '2026-08-31': 400,
        '2026-09-07': 400,
        '2026-09-14': 400,
      },
      '2026-09-14',
      '2026-09-14',
    );
    // The two weeks of rest lower the chronic load: the return weighs more
    // than steady training would (an ACWR of 1)
    expect(result['2026-09-14'].acwr).toBeGreaterThan(1.3);
  });

  it('ignores the weeks before the first activity, even with old data around', async () => {
    // Same loads, but the athlete's first activity is in mid-August
    const result = await weeks(
      {
        '2026-08-17': 400,
        '2026-08-24': 400,
        '2026-08-31': 400,
        '2026-09-07': 400,
        '2026-09-14': 400,
      },
      '2026-09-14',
      '2026-09-14',
      '2026-08-17',
    );
    expect(result['2026-09-14']).toEqual({ acwr: 1, status: 'optimal' });
  });

  it('still flags a return after a break within the chronic weeks', async () => {
    const result = await weeks(
      {
        '2026-08-03': 400,
        '2026-08-10': 400,
        '2026-08-17': 400,
        '2026-09-14': 400,
      },
      '2026-09-14',
      '2026-09-14',
    );
    expect(result['2026-09-14'].status).toBe('high_risk');
  });
});

describe('TrainingLoadService weekly planned load', () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date('2026-10-14T10:00:00Z') });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  const session = (
    day: string,
    fields: {
      goalDuration?: number | null;
      goalRpe?: number | null;
      estimatedLoad?: number | null;
      relatedActivityId?: number | null;
    },
    type: 'training' | 'competition' = 'training',
  ) => {
    const goals = {
      goalDuration: fields.goalDuration ?? null,
      goalRpe: fields.goalRpe ?? null,
      relatedActivityId: fields.relatedActivityId ?? null,
    };
    return {
      startDate: new Date(`${day}T07:00:00Z`),
      training:
        type === 'training'
          ? { ...goals, estimatedLoad: fields.estimatedLoad ?? null }
          : null,
      competition: type === 'competition' ? goals : null,
    };
  };

  async function week(
    plannedEvents: unknown[],
    heartRate?: Record<string, number>,
  ) {
    const { service, prisma } = weeklySummaryService({
      plannedEvents,
      heartRate,
    });
    const summaries = await service.getWeeklyTrimpSummary(
      athlete,
      new Date('2026-10-19T00:00:00Z'),
      new Date('2026-10-19T00:00:00Z'),
    );
    return { summary: summaries[0], prisma };
  }

  it('estimates sessions and races without any AI estimate', async () => {
    const { summary, prisma } = await week([
      session('2026-10-20', { goalDuration: 3600, goalRpe: 0.5 }),
      session(
        '2026-10-25',
        { goalDuration: 5400, goalRpe: 0.9 },
        'competition',
      ),
    ]);

    // RPE 5/10 for an hour: about 73 TRIMP; the race adds far more
    expect(summary.estimatedLoad).toBeGreaterThan(73 + 150);
    expect(summary.plannedLoad).toBe(summary.estimatedLoad);
    expect(summary.totalLoad).toBe(summary.estimatedLoad);
    // Trainings and races of the range, in one query
    expect(prisma.event.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.event.findMany.mock.calls[0][0].where).toMatchObject({
      athleteId: 12,
      type: { in: ['TRAINING', 'COMPETITION'] },
    });
  });

  it('prefers the AI estimate, and leaves done sessions to the actual load', async () => {
    const { summary } = await week([
      session('2026-10-20', { goalDuration: 3600, estimatedLoad: 120 }),
      session('2026-10-21', {
        goalDuration: 3600,
        estimatedLoad: 80,
        relatedActivityId: 7,
      }),
    ]);
    expect(summary.estimatedLoad).toBe(120);
    expect(summary.plannedLoad).toBe(200);
  });

  it('projects the form at the end of the week', async () => {
    const { summary } = await week([
      session('2026-10-20', { goalDuration: 7200, goalRpe: 0.7 }),
    ]);
    expect(summary.formProjected).toBe(true);
    expect(summary.ctl).toBeGreaterThan(0);
    // A hard session on a blank history: fatigue outweighs fitness
    expect(summary.tsb).toBeLessThan(0);
  });

  it('cannot estimate without a heart rate profile, as for activities', async () => {
    const { summary } = await week(
      [session('2026-10-20', { goalDuration: 3600, goalRpe: 0.5 })],
      {},
    );
    expect(summary.estimatedLoad).toBe(0);
  });
});
