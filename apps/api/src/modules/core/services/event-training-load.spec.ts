jest.mock('@garmin/fitsdk', () => ({}));

import { MetricType } from '@openathlete/database';

import { EventService } from './event.service';

describe('EventService.computeAndApplyPlannedTrainingLoad', () => {
  const athleteId = 42;
  const eventId = 101;
  const eventTrainingId = 202;

  function createService({
    event,
    cancelEstimation = jest.fn().mockResolvedValue(undefined),
    scheduleEstimation = jest.fn().mockResolvedValue(undefined),
  }: {
    event: any;
    cancelEstimation?: jest.Mock;
    scheduleEstimation?: jest.Mock;
  }) {
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue(event),
      },
      eventTraining: {
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const calendarWebSocketService = {
      notifyTrainingLoadEstimationCompleted: jest.fn(),
    };
    const trainingLoadEstimationService = {
      cancelEstimation,
      scheduleEstimation,
    };

    const service = new EventService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      trainingLoadEstimationService as any,
      calendarWebSocketService as any,
    );

    return {
      service,
      prisma,
      calendarWebSocketService,
      trainingLoadEstimationService,
    };
  }

  const baseEvent = {
    eventId,
    athlete: {
      user: { gender: 'MALE' },
      metrics: [
        { type: MetricType.HR_MAX, value: 190 },
        { type: MetricType.HR_REST, value: 50 },
      ],
      trainingZones: [],
    },
    training: {
      eventTrainingId,
      sport: 'RUNNING',
      goalDuration: 3600,
      goalRpe: 0.6,
      estimatedLoad: null,
      workout: null,
    },
  };

  it('computes and stores deterministic load for duration and RPE without enqueuing AI', async () => {
    const {
      service,
      prisma,
      calendarWebSocketService,
      trainingLoadEstimationService,
    } = createService({ event: baseEvent });

    const result = await service.computeAndApplyPlannedTrainingLoad(
      eventId,
      athleteId,
      eventTrainingId,
      true,
    );

    expect(result).toBeGreaterThan(0);
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId },
      data: { estimatedLoad: result },
    });
    expect(
      calendarWebSocketService.notifyTrainingLoadEstimationCompleted,
    ).toHaveBeenCalledWith(eventId, athleteId, result);
    expect(trainingLoadEstimationService.cancelEstimation).toHaveBeenCalledWith(
      eventId,
    );
    expect(
      trainingLoadEstimationService.scheduleEstimation,
    ).not.toHaveBeenCalled();
  });

  it('computes and stores deterministic load for structured workout with HR targets', async () => {
    const workoutEvent = {
      ...baseEvent,
      training: {
        ...baseEvent.training,
        workout: {
          steps: [
            {
              durationType: 'TIME',
              durationValue: 1800,
              targets: [{ targetType: 'HEARTRATE', targetValue: 140 }],
            },
          ],
        },
      },
    };

    const {
      service,
      prisma,
      calendarWebSocketService,
      trainingLoadEstimationService,
    } = createService({ event: workoutEvent });

    const result = await service.computeAndApplyPlannedTrainingLoad(
      eventId,
      athleteId,
      eventTrainingId,
      true,
    );

    expect(result).toBeGreaterThan(0);
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId },
      data: { estimatedLoad: result },
    });
    expect(
      calendarWebSocketService.notifyTrainingLoadEstimationCompleted,
    ).toHaveBeenCalledWith(eventId, athleteId, result);
    expect(trainingLoadEstimationService.cancelEstimation).toHaveBeenCalledWith(
      eventId,
    );
    expect(
      trainingLoadEstimationService.scheduleEstimation,
    ).not.toHaveBeenCalled();
  });

  it('enqueues AI estimation when structured workout has unreadable targets for future events', async () => {
    const paceWorkoutEvent = {
      ...baseEvent,
      training: {
        ...baseEvent.training,
        workout: {
          steps: [
            {
              durationType: 'DISTANCE',
              durationValue: 1000,
              targets: [{ targetType: 'PACE', targetValue: 300 }],
            },
          ],
        },
      },
    };

    const {
      service,
      prisma,
      calendarWebSocketService,
      trainingLoadEstimationService,
    } = createService({ event: paceWorkoutEvent });

    const result = await service.computeAndApplyPlannedTrainingLoad(
      eventId,
      athleteId,
      eventTrainingId,
      true, // isFuture
    );

    expect(result).toBeNull();
    expect(
      trainingLoadEstimationService.scheduleEstimation,
    ).toHaveBeenCalledWith(eventId, eventTrainingId, athleteId);
    expect(prisma.eventTraining.update).not.toHaveBeenCalled();
    expect(
      calendarWebSocketService.notifyTrainingLoadEstimationCompleted,
    ).not.toHaveBeenCalled();
  });

  it('clears previous estimate when unestimable and session is in the past', async () => {
    const pastUnestimableEvent = {
      ...baseEvent,
      training: {
        ...baseEvent.training,
        estimatedLoad: 85,
        workout: {
          steps: [
            {
              durationType: 'DISTANCE',
              durationValue: 1000,
              targets: [{ targetType: 'PACE', targetValue: 300 }],
            },
          ],
        },
      },
    };

    const {
      service,
      prisma,
      calendarWebSocketService,
      trainingLoadEstimationService,
    } = createService({ event: pastUnestimableEvent });

    const result = await service.computeAndApplyPlannedTrainingLoad(
      eventId,
      athleteId,
      eventTrainingId,
      false, // not future
    );

    expect(result).toBeNull();
    expect(prisma.eventTraining.update).toHaveBeenCalledWith({
      where: { eventTrainingId },
      data: { estimatedLoad: null },
    });
    expect(
      calendarWebSocketService.notifyTrainingLoadEstimationCompleted,
    ).toHaveBeenCalledWith(eventId, athleteId, null);
    expect(
      trainingLoadEstimationService.scheduleEstimation,
    ).not.toHaveBeenCalled();
  });
});
