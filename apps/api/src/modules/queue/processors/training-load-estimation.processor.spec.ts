import { Job } from 'bullmq';

import { MetricType } from '@openathlete/database';

import { TrainingLoadEstimationJobData } from '../services/training-load-estimation.service';
import { TrainingLoadEstimationProcessor } from './training-load-estimation.processor';

jest.mock('src/mastra/agents', () => ({
  trimpEstimationAgent: {},
  trimpEstimationOutputSchema: {},
}));
jest.mock('src/modules/ai', () => ({
  AiModelResolverService: class {},
  AiService: class {},
}));

const job = () =>
  ({
    data: { eventId: 10, eventTrainingId: 20, athleteId: 30 },
  }) as Job<TrainingLoadEstimationJobData>;

function event({
  steps = [],
  estimatedLoad = null,
  goalDuration = null,
  goalRpe = null,
  metrics = [
    { type: MetricType.HR_MAX, value: 190 },
    { type: MetricType.HR_REST, value: 50 },
  ],
}: {
  steps?: object[];
  estimatedLoad?: number | null;
  goalDuration?: number | null;
  goalRpe?: number | null;
  metrics?: Array<{ type: MetricType; value: number }>;
} = {}) {
  return {
    name: 'Workout',
    training: {
      sport: 'RUNNING',
      goalDuration,
      goalRpe,
      goalDistance: null,
      goalElevationGain: null,
      estimatedLoad,
      workout: { steps },
    },
    athlete: {
      user: { gender: 'MALE' },
      metrics,
      trainingZones: [],
    },
  };
}

function setup(foundEvent = event()) {
  const prisma = {
    event: { findUnique: jest.fn().mockResolvedValue(foundEvent) },
    eventTraining: { update: jest.fn().mockResolvedValue({}) },
    athleteMetric: { findMany: jest.fn().mockResolvedValue([]) },
    trainingZone: { findMany: jest.fn().mockResolvedValue([]) },
    eventActivity: { findMany: jest.fn().mockResolvedValue([]) },
    trainingLoadCalculation: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const resolver = { tryResolveForAthlete: jest.fn() };
  const ai = { generateObject: jest.fn() };
  const calendar = {
    notifyTrainingLoadEstimationCompleted: jest.fn(),
    notifyTrainingLoadEstimationFailed: jest.fn(),
  };
  const processor = new TrainingLoadEstimationProcessor(
    prisma as never,
    resolver as never,
    ai as never,
    calendar as never,
  );
  return { processor, prisma, resolver, ai, calendar };
}

describe('TrainingLoadEstimationProcessor', () => {
  it('persists a deterministic estimate without resolving AI', async () => {
    const { processor, prisma, resolver, ai, calendar } = setup(
      event({
        steps: [
          {
            durationType: 'TIME',
            durationValue: 600,
            targets: [{ targetType: 'HEARTRATE', targetValue: 150 }],
          },
        ],
      }),
    );

    await expect(processor.process(job())).resolves.toMatchObject({
      method: 'WORKOUT_HR_TARGETS',
    });
    expect(resolver.tryResolveForAthlete).not.toHaveBeenCalled();
    expect(ai.generateObject).not.toHaveBeenCalled();
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId: 20 },
      data: { estimatedLoad: expect.any(Number) },
    });
    expect(calendar.notifyTrainingLoadEstimationCompleted).toHaveBeenCalledWith(
      10,
      30,
      expect.any(Number),
    );
  });

  it('uses AI only after deterministic estimation is unavailable', async () => {
    const { processor, prisma, resolver, ai } = setup();
    resolver.tryResolveForAthlete.mockResolvedValue({});
    ai.generateObject.mockResolvedValue({ trimp: 73 });

    await expect(processor.process(job())).resolves.toMatchObject({
      trimp: 73,
      method: 'AI_FALLBACK',
    });
    expect(resolver.tryResolveForAthlete).toHaveBeenCalled();
    expect(ai.generateObject).toHaveBeenCalled();
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId: 20 },
      data: { estimatedLoad: 73 },
    });
  });

  it('clears a stale estimate and completes normally when no estimate is available', async () => {
    const { processor, prisma, resolver, calendar } = setup();
    resolver.tryResolveForAthlete.mockResolvedValue(null);

    await expect(processor.process(job())).resolves.toMatchObject({
      trimp: null,
      method: null,
    });
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId: 20 },
      data: { estimatedLoad: null },
    });
    expect(calendar.notifyTrainingLoadEstimationCompleted).toHaveBeenCalledWith(
      10,
      30,
      null,
    );
    expect(calendar.notifyTrainingLoadEstimationFailed).not.toHaveBeenCalled();
  });

  it('clears a previous estimate and notifies the calendar when no estimate is available', async () => {
    const { processor, prisma, resolver, calendar } = setup(
      event({ estimatedLoad: 120 }),
    );
    resolver.tryResolveForAthlete.mockResolvedValue(null);

    await expect(processor.process(job())).resolves.toMatchObject({
      trimp: null,
      method: null,
    });
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId: 20 },
      data: { estimatedLoad: null },
    });
    expect(calendar.notifyTrainingLoadEstimationCompleted).toHaveBeenCalledWith(
      10,
      30,
      null,
    );
    expect(calendar.notifyTrainingLoadEstimationFailed).not.toHaveBeenCalled();
  });

  it('falls back to duration and RPE when structured workout cannot be resolved by AI', async () => {
    const { processor, prisma, resolver, calendar } = setup(
      event({
        steps: [
          {
            durationType: 'DISTANCE',
            durationValue: 1000,
            targets: [{ targetType: 'PACE', targetValue: 300 }],
          },
        ],
        goalDuration: 3600,
        goalRpe: 0.6,
      }),
    );
    resolver.tryResolveForAthlete.mockResolvedValue(null);

    const result = await processor.process(job());
    expect(result).toMatchObject({
      method: 'DURATION_RPE',
    });
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId: 20 },
      data: { estimatedLoad: expect.any(Number) },
    });
    expect(calendar.notifyTrainingLoadEstimationCompleted).toHaveBeenCalledWith(
      10,
      30,
      expect.any(Number),
    );
  });
});
