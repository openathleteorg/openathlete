import { MetricType } from '@openathlete/database';
import {
  EVENT_TYPE,
  UpdateEventDto,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
} from '@openathlete/shared';

import { WorkoutPlannedChangedEvent } from 'src/events';

import { EventService } from './event.service';

jest.mock('@garmin/fitsdk', () => ({}));
jest.mock('src/modules/auth/services/casl-prisma', () => ({
  accessibleBy: () => ({ Event: {} }),
}));

describe('EventService workout export sync', () => {
  const athleteId = 42;
  const eventId = 101;
  const workoutId = 300;
  const startDate = new Date(Date.now() + 2 * 86400_000);
  const endDate = new Date(startDate.getTime() + 3600_000);

  // A training saved without steps: the workout exists but is empty
  const trainingWithoutSteps = {
    eventId,
    athleteId,
    type: 'TRAINING',
    name: 'Intervals',
    startDate,
    endDate,
    athlete: { user: { gender: 'MALE' }, trainingZones: [] },
    training: {
      eventTrainingId: 202,
      sport: 'RUNNING',
      goalDuration: 3600,
      goalRpe: 0.6,
      estimatedLoad: null,
      workout: { workoutId, steps: [] },
    },
  };

  function createService() {
    const prisma = {
      event: {
        findFirst: jest.fn().mockResolvedValue(trainingWithoutSteps),
        findUnique: jest.fn().mockResolvedValue(trainingWithoutSteps),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          ...trainingWithoutSteps,
          startDate: data?.startDate ?? startDate,
          endDate: data?.endDate ?? endDate,
        })),
      },
      eventTemplate: { findUnique: jest.fn().mockResolvedValue(null) },
      eventTraining: { update: jest.fn().mockResolvedValue({}) },
      workout: {
        findUnique: jest.fn().mockResolvedValue({ workoutId }),
        update: jest.fn().mockResolvedValue({ workoutId }),
        create: jest.fn().mockResolvedValue({ workoutId }),
      },
      workoutStep: { deleteMany: jest.fn().mockResolvedValue({}) },
      athleteMetric: {
        findFirst: jest
          .fn()
          .mockImplementation(async ({ where }) =>
            where.type === MetricType.HR_MAX
              ? { type: MetricType.HR_MAX, value: 190 }
              : { type: MetricType.HR_REST, value: 50 },
          ),
      },
    };
    const eventEmitter = { emit: jest.fn() };
    const service = new EventService(
      prisma as never,
      { getFor: jest.fn().mockResolvedValue({ can: () => true }) } as never,
      eventEmitter as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        cancelEstimation: jest.fn().mockResolvedValue(undefined),
        scheduleEstimation: jest.fn().mockResolvedValue(true),
      } as never,
      { notifyTrainingLoadEstimationCompleted: jest.fn() } as never,
    );
    jest
      .spyOn(service, 'getEventById')
      .mockResolvedValue(trainingWithoutSteps as never);

    const syncs = () =>
      eventEmitter.emit.mock.calls
        .filter(([slug]) => slug === WorkoutPlannedChangedEvent.SLUG)
        .map(([, event]) => (event as WorkoutPlannedChangedEvent).payload);

    return { service, syncs };
  }

  it('syncs once when steps are added to a training saved without them', async () => {
    const { service, syncs } = createService();

    // What the event dialog sends: the workout and the dates, always
    await service.updateEvent({ userId: 1 } as never, eventId, {
      type: EVENT_TYPE.TRAINING,
      name: 'Intervals',
      startDate,
      endDate,
      workout: {
        steps: [
          {
            stepType: WORKOUT_STEP_TYPE.STEADY,
            durationType: WORKOUT_DURATION_TYPE.TIME,
            durationValue: 1800,
            targets: [],
          },
        ],
      },
    });

    expect(syncs()).toHaveLength(1);
    expect(syncs()[0]).toMatchObject({ eventId, athleteId, workoutId });
  });

  it('still syncs when only the dates change', async () => {
    const { service, syncs } = createService();
    const movedStart = new Date(startDate.getTime() + 86400_000);

    await service.updateEvent({ userId: 1 } as never, eventId, {
      startDate: movedStart,
      endDate: new Date(movedStart.getTime() + 3600_000),
    } as UpdateEventDto);

    expect(syncs()).toHaveLength(1);
    expect(syncs()[0]).toMatchObject({ eventId, athleteId, workoutId });
  });
});
