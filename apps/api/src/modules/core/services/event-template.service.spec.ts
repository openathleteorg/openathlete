import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventTemplateService } from './event-template.service';
import { EventService } from './event.service';

jest.mock('../helpers/workout-zones', () => ({
  // The zones are not what this test is about: keep the steps as they are
  remapZonesForAthlete: jest.fn(
    async (
      _prisma: unknown,
      _athleteId: number,
      _sport: string,
      steps: unknown,
    ) => steps,
  ),
}));

const percentTarget = {
  targetType: 'POWER',
  targetMin: 1.03,
  targetMax: 1.05,
  targetValue: null,
  metricType: 'FTP_RUNNING',
};

/** A workout with a percentage target on a step and on a repeated step */
const workout = {
  workoutId: 1,
  steps: [
    {
      orderIndex: 0,
      stepType: 'WARMUP',
      name: 'Warm up',
      notes: null,
      durationType: 'TIME',
      durationValue: 900,
      durationTarget: null,
      targets: [percentTarget],
      repeatBlock: {
        repetitions: 5,
        childSteps: [
          {
            orderIndex: 0,
            stepType: 'ACTIVE',
            name: 'Hard',
            notes: null,
            durationType: 'TIME',
            durationValue: 180,
            durationTarget: null,
            targets: [{ ...percentTarget, metricType: 'HR_MAX' }],
          },
        ],
      },
    },
  ],
};

type CreatedWorkout = {
  data: {
    steps: {
      create: Array<{
        targets: { create: Array<{ metricType: string | null }> };
        repeatBlock?: {
          create: {
            childSteps: {
              create: Array<{
                targets: { create: Array<{ metricType: string | null }> };
              }>;
            };
          };
        };
      }>;
    };
  };
};

function metricTypes(call: CreatedWorkout) {
  const step = call.data.steps.create[0];
  return {
    step: step.targets.create[0].metricType,
    child:
      step.repeatBlock?.create.childSteps.create[0].targets.create[0]
        .metricType,
  };
}

const user = { userId: 7, athlete: { athleteId: 70 } } as unknown as AuthUser;

describe('EventTemplateService', () => {
  it('keeps the reference of percentage targets when saving a template', async () => {
    const workoutCreate = jest.fn().mockResolvedValue({ workoutId: 2 });
    const prisma = {
      event: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          eventId: 11,
          training: { eventTrainingId: 21 },
        }),
      },
      eventTraining: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ eventTrainingId: 20 }),
      },
      workout: {
        findUnique: jest.fn().mockResolvedValue(workout),
        create: workoutCreate,
      },
      eventTemplate: {
        create: jest.fn().mockResolvedValue({ eventTemplateId: 1 }),
      },
    };
    const eventService = {
      duplicateEvent: jest
        .fn()
        .mockResolvedValue({ eventId: 11, type: 'TRAINING' }),
    };
    const service = new EventTemplateService(
      prisma as unknown as PrismaService,
      eventService as unknown as EventService,
      {} as CaslAbilityFactory,
    );

    await service.createEventTemplate(user, { eventId: 10 } as never);

    expect(metricTypes(workoutCreate.mock.calls[0][0])).toEqual({
      step: 'FTP_RUNNING',
      child: 'HR_MAX',
    });
  });

  it('keeps the reference of percentage targets when planning from a template', async () => {
    const workoutCreate = jest.fn().mockResolvedValue({ workoutId: 3 });
    const prisma = {
      eventTemplate: {
        findUnique: jest.fn().mockResolvedValue({
          eventTemplateId: 1,
          userId: 7,
          event: {
            eventId: 11,
            name: '3min Pendelintervalle',
            type: 'TRAINING',
            training: { eventTrainingId: 21, sport: 'RUNNING', workout },
          },
        }),
      },
      event: {
        create: jest.fn().mockResolvedValue({
          eventId: 12,
          athleteId: 70,
          type: 'TRAINING',
          startDate: new Date('2000-01-01'),
          training: { eventTrainingId: 22, sport: 'RUNNING' },
        }),
      },
      workout: {
        findUnique: jest.fn().mockResolvedValue(workout),
        create: workoutCreate,
      },
    };
    const eventService = {
      emitWorkoutPlannedChanged: jest.fn(),
      computeAndApplyPlannedTrainingLoad: jest.fn(),
      getEventById: jest.fn().mockResolvedValue({ eventId: 12 }),
    };
    const abilities = {
      getFor: jest.fn().mockResolvedValue({ can: () => true }),
    };
    const service = new EventTemplateService(
      prisma as unknown as PrismaService,
      eventService as unknown as EventService,
      abilities as unknown as CaslAbilityFactory,
    );

    await service.useEventTemplate(user, 1, {
      startDate: new Date('2000-01-01T09:00:00Z'),
      endDate: new Date('2000-01-01T10:00:00Z'),
    });

    expect(metricTypes(workoutCreate.mock.calls[0][0])).toEqual({
      step: 'FTP_RUNNING',
      child: 'HR_MAX',
    });
  });
});
