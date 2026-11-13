import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventBatchService } from './event-batch.service';
import { EventBulkService } from './event-bulk.service';
import { EventService } from './event.service';

// An ESM package Jest cannot load, pulled in by the FIT import; unused here
jest.mock('@garmin/fitsdk', () => ({}));

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

describe('planning for several athletes (PostgreSQL)', () => {
  let prisma: PrismaService;
  let batches: EventBatchService;

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
    batches = new EventBatchService(
      prisma,
      abilities,
      events,
      new EventBulkService(prisma, abilities, events),
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
  });

  const person = async (name: string, timeZone: string | null) => {
    const user = await prisma.user.create({
      data: {
        email: `${name}@example.com`,
        password: 'hash',
        firstName: name,
        lastName: 'Test',
        timeZone,
        athlete: { create: {} },
      },
      select: { userId: true, athlete: { select: { athleteId: true } } },
    });
    return { userId: user.userId, athleteId: user.athlete!.athleteId };
  };

  const heartRateZone = (athleteId: number, index: number) =>
    prisma.trainingZone.create({
      data: {
        athleteId,
        name: `Z${index + 1}`,
        description: '',
        index,
        type: 'HEARTRATE',
        color: '#000000',
        values: { create: { min: 100 + index * 10, max: 110 + index * 10 } },
      },
      select: { trainingZoneId: true },
    });

  /**
   * A coach with two athletes. Ana, in Paris, has a VMA and heart rate
   * zones; Ben, in New York, has neither, and is ill on the planned day.
   * The coach's template: 10' at 90% VMA, then 20' in their own zone 3.
   */
  const setUp = async () => {
    const coach = await person('coach', 'Europe/Paris');
    const ana = await person('ana', 'Europe/Paris');
    const ben = await person('ben', 'America/New_York');
    const stranger = await person('stranger', null);
    for (const { athleteId } of [ana, ben]) {
      await prisma.coachAthlete.create({
        data: { userId: coach.userId, athleteId },
      });
    }
    // Zones match by rank: the coach's third zone is Ana's third
    await heartRateZone(coach.athleteId, 0);
    await heartRateZone(coach.athleteId, 1);
    const coachZone = await heartRateZone(coach.athleteId, 2);
    for (const index of [0, 1, 2]) await heartRateZone(ana.athleteId, index);
    await prisma.athleteMetric.create({
      data: {
        athleteId: ana.athleteId,
        type: 'VMA',
        date: new Date('2026-01-01'),
        value: 18,
      },
    });
    await prisma.cycle.create({
      data: {
        athleteId: ben.athleteId,
        name: 'Flu',
        kind: 'ILLNESS',
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-03-04T00:00:00Z'),
      },
    });
    // Ana already runs that day
    await prisma.event.create({
      data: {
        athleteId: ana.athleteId,
        name: 'Easy run',
        type: 'TRAINING',
        startDate: new Date('2026-03-02T06:00:00Z'),
        endDate: new Date('2026-03-02T07:00:00Z'),
        training: { create: { sport: 'RUNNING', description: '' } },
      },
    });

    const template = await prisma.eventTemplate.create({
      data: {
        user: { connect: { userId: coach.userId } },
        event: {
          create: {
            name: 'Tempo',
            type: 'TRAINING',
            startDate: new Date('2025-12-31T17:00:00Z'),
            endDate: new Date('2025-12-31T18:30:00Z'),
            training: {
              create: {
                sport: 'RUNNING',
                description: '',
                estimatedLoad: 80,
                workout: {
                  create: {
                    steps: {
                      create: [
                        {
                          orderIndex: 0,
                          stepType: 'STEADY',
                          durationType: 'TIME',
                          durationValue: 600,
                          targets: {
                            create: {
                              targetType: 'PACE',
                              targetValue: 0.9,
                              metricType: 'VMA',
                            },
                          },
                        },
                        {
                          orderIndex: 1,
                          stepType: 'STEADY',
                          durationType: 'TIME',
                          durationValue: 1200,
                          targets: {
                            create: {
                              targetType: 'ZONE',
                              targetValue: coachZone.trainingZoneId,
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      select: { eventTemplateId: true },
    });

    const user = {
      userId: coach.userId,
      email: 'coach@example.com',
      athlete: { athleteId: coach.athleteId },
      coachAthletes: [ana, ben].map(({ athleteId }) => ({ athleteId })),
    } as unknown as AuthUser;
    return { user, coach, ana, ben, stranger, template };
  };

  const dto = (
    eventTemplateId: number,
    athleteIds: number[],
    time: string | undefined = '18:30',
  ) => ({
    source: { kind: 'template' as const, eventTemplateId },
    athleteIds,
    date: '2026-03-02',
    time,
    timeZone: 'Europe/Paris',
  });

  it('warns about each athlete before planning', async () => {
    const { user, ana, ben, template } = await setUp();
    const preview = await batches.preview(
      user,
      dto(template.eventTemplateId, [ana.athleteId, ben.athleteId]),
    );

    expect(preview.eventCount).toBe(1);
    expect(preview.dates).toEqual(['2026-03-02']);
    expect(preview.athletes).toEqual([
      expect.objectContaining({
        athleteId: ana.athleteId,
        missingMetrics: [],
        missingZones: false,
        sameDayEvents: 1,
        unavailable: [],
      }),
      expect.objectContaining({
        athleteId: ben.athleteId,
        missingMetrics: ['VMA'],
        missingZones: true,
        sameDayEvents: 0,
        unavailable: ['ILLNESS'],
      }),
    ]);
  });

  it('plans at the same local time for each athlete, with their own zones', async () => {
    const { user, ana, ben, template } = await setUp();
    const { batchId, eventIds } = await batches.plan(
      user,
      dto(template.eventTemplateId, [ana.athleteId, ben.athleteId]),
    );

    expect(eventIds).toHaveLength(2);
    const copies = await prisma.event.findMany({
      where: { batchId },
      orderBy: { athleteId: 'asc' },
      include: {
        training: {
          include: {
            workout: {
              include: {
                steps: {
                  include: { targets: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    // 18:30 in Paris (UTC+1), and 18:30 in New York (UTC-5), 1h30 each
    expect(copies.map((c) => [c.athleteId, c.startDate, c.endDate])).toEqual([
      [
        ana.athleteId,
        new Date('2026-03-02T17:30:00Z'),
        new Date('2026-03-02T19:00:00Z'),
      ],
      [
        ben.athleteId,
        new Date('2026-03-02T23:30:00Z'),
        new Date('2026-03-03T01:00:00Z'),
      ],
    ]);

    const [anaCopy, benCopy] = copies;
    // The VMA percentage stays relative: each athlete's VMA applies
    expect(anaCopy.training?.workout?.steps[0].targets[0]).toMatchObject({
      targetType: 'PACE',
      targetValue: 0.9,
      metricType: 'VMA',
    });
    // Ana's own zone 3; Ben has none, so the step stays open
    const anaZone3 = await prisma.trainingZone.findFirstOrThrow({
      where: { athleteId: ana.athleteId, index: 2 },
    });
    expect(anaCopy.training?.workout?.steps[1].targets).toEqual([
      expect.objectContaining({
        targetType: 'ZONE',
        targetValue: anaZone3.trainingZoneId,
      }),
    ]);
    expect(benCopy.training?.workout?.steps[1].targets).toEqual([]);
    // The coach's estimate was for the template, not for these athletes
    expect(anaCopy.training?.estimatedLoad).not.toBe(80);
  });

  it('copies days of a calendar, keeping their distance and times', async () => {
    const { user, ana, ben } = await setUp();
    const monday = await prisma.event.create({
      data: {
        athleteId: ana.athleteId,
        name: 'Intervals',
        type: 'TRAINING',
        startDate: new Date('2026-01-05T06:00:00Z'), // 07:00 in Paris
        endDate: new Date('2026-01-05T07:00:00Z'),
        training: { create: { sport: 'RUNNING', description: '' } },
      },
    });
    const thursday = await prisma.event.create({
      data: {
        athleteId: ana.athleteId,
        name: 'Long run',
        type: 'TRAINING',
        startDate: new Date('2026-01-08T17:00:00Z'), // 18:00 in Paris
        endDate: new Date('2026-01-08T19:00:00Z'),
        training: { create: { sport: 'RUNNING', description: '' } },
      },
    });

    const { batchId } = await batches.plan(user, {
      source: { kind: 'events', eventIds: [thursday.eventId, monday.eventId] },
      athleteIds: [ben.athleteId],
      date: '2026-03-09',
      timeZone: 'Europe/Paris',
    });
    const copies = await prisma.event.findMany({
      where: { batchId },
      orderBy: { startDate: 'asc' },
    });
    // 07:00 and 18:00 in New York, three days apart
    expect(copies.map((c) => [c.name, c.startDate])).toEqual([
      ['Intervals', new Date('2026-03-09T11:00:00Z')],
      ['Long run', new Date('2026-03-12T22:00:00Z')],
    ]);
  });

  it('plans for nobody unless it may plan for everybody', async () => {
    const { user, ana, stranger, template } = await setUp();
    await expect(
      batches.plan(
        user,
        dto(template.eventTemplateId, [ana.athleteId, stranger.athleteId]),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      await prisma.event.count({ where: { batchId: { not: null } } }),
    ).toBe(0);
  });

  it('undoes a batch, keeping the sessions already done', async () => {
    const { user, ana, ben, template } = await setUp();
    const { batchId, eventIds } = await batches.plan(
      user,
      dto(template.eventTemplateId, [ana.athleteId, ben.athleteId]),
    );
    // Ana did hers: an activity is linked to it
    const activity = await prisma.event.create({
      data: {
        athleteId: ana.athleteId,
        name: 'Run',
        type: 'ACTIVITY',
        startDate: new Date('2026-03-02T17:35:00Z'),
        endDate: new Date('2026-03-02T19:00:00Z'),
        activity: {
          create: {
            sport: 'RUNNING',
            distance: 15000,
            elevationGain: 0,
            movingTime: 5100,
            averageSpeed: 2.9,
            maxSpeed: 4,
            externalId: 'run',
          },
        },
      },
      select: { activity: { select: { eventActivityId: true } } },
    });
    await prisma.eventTraining.updateMany({
      where: { eventId: eventIds[0] },
      data: { relatedActivityId: activity.activity!.eventActivityId },
    });

    expect(await batches.undo(user, batchId)).toEqual({ deleted: 1, kept: 1 });
    expect(
      await prisma.event.findMany({
        where: { batchId },
        select: { eventId: true },
      }),
    ).toEqual([{ eventId: eventIds[0] }]);
  });
});
