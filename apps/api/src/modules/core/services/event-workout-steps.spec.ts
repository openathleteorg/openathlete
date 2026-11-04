import {
  EVENT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '@openathlete/shared';

import { EventService } from './event.service';

jest.mock('@garmin/fitsdk', () => ({}));
jest.mock('src/modules/auth/services/casl-prisma', () => ({
  accessibleBy: () => ({ Event: {} }),
}));

describe('EventService.updateEvent workout steps', () => {
  const eventId = 101;
  const workoutId = 10;

  const event = {
    eventId,
    athleteId: 42,
    type: 'TRAINING',
    startDate: new Date(Date.now() + 86400_000),
    endDate: new Date(Date.now() + 90000_000),
    training: {
      eventTrainingId: 202,
      sport: 'RUNNING',
      goalDuration: null,
      goalRpe: null,
      estimatedLoad: null,
      workout: { workoutId, steps: [] },
    },
  };

  function createService() {
    const prisma = {
      event: {
        findFirst: jest.fn().mockResolvedValue(event),
        update: jest.fn().mockResolvedValue(event),
      },
      eventTemplate: { findUnique: jest.fn().mockResolvedValue(null) },
      workout: {
        findUnique: jest.fn().mockResolvedValue(event.training.workout),
        update: jest.fn().mockResolvedValue({}),
      },
      workoutStep: { deleteMany: jest.fn().mockResolvedValue({}) },
    };
    const service = new EventService(
      prisma as never,
      { getFor: jest.fn().mockResolvedValue({ can: () => true }) } as never,
      { emit: jest.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    jest.spyOn(service, 'getEventById').mockResolvedValue(event as never);
    jest
      .spyOn(service, 'computeAndApplyPlannedTrainingLoad')
      .mockResolvedValue(null);
    return { service, prisma };
  }

  it('replaces the steps in a single write, so a failure keeps the old ones', async () => {
    const { service, prisma } = createService();

    await service.updateEvent({ userId: 1 } as never, eventId, {
      type: EVENT_TYPE.TRAINING,
      workout: {
        steps: [
          {
            stepType: WORKOUT_STEP_TYPE.STEADY,
            durationType: WORKOUT_DURATION_TYPE.DISTANCE,
            durationValue: 1000,
            targets: [
              { targetType: WORKOUT_TARGET_TYPE.PACE, targetValue: 3.5 },
            ],
          },
        ],
      },
    });

    expect(prisma.workoutStep.deleteMany).not.toHaveBeenCalled();
    expect(prisma.workout.update).toHaveBeenCalledTimes(1);
    expect(prisma.workout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workoutId },
        data: {
          steps: {
            deleteMany: {},
            create: [
              expect.objectContaining({
                orderIndex: 0,
                durationValue: 1000,
              }),
            ],
          },
        },
      }),
    );
    // Prisma runs nested operations in key order: creating first would have
    // deleteMany remove the new steps too
    const { data } = prisma.workout.update.mock.calls[0][0];
    expect(Object.keys(data.steps)).toEqual(['deleteMany', 'create']);
  });
});
