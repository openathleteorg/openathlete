import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventTemplateService } from './event-template.service';
import { EventService } from './event.service';

// The FIT SDK, loaded through EventService, is ESM, which Jest cannot load
jest.mock('../helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));
jest.mock('@garmin/fitsdk', () => ({}));

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
      exerciseRef: null,
      tempo: null,
      side: null,
      targets: [percentTarget],
      repeatBlock: {
        repetitions: 5,
        kind: 'EMOM',
        intervalSeconds: 60,
        timeCapSeconds: null,
        childSteps: [
          {
            orderIndex: 0,
            stepType: 'ACTIVE',
            name: 'Hard',
            notes: null,
            durationType: 'TIME',
            durationValue: 180,
            durationTarget: null,
            exerciseRef: 'c:barbell-full-squat',
            tempo: '3-1-X-0',
            side: 'LEFT',
            targets: [{ ...percentTarget, metricType: 'HR_MAX' }],
          },
        ],
      },
    },
  ],
};

type StrengthStepFields = {
  exerciseRef?: string | null;
  tempo?: string | null;
  side?: string | null;
};

type CreatedWorkout = {
  data: {
    steps: {
      create: Array<
        StrengthStepFields & {
          targets: { create: Array<{ metricType: string | null }> };
          repeatBlock?: {
            create: {
              kind?: string;
              intervalSeconds?: number | null;
              timeCapSeconds?: number | null;
              childSteps: {
                create: Array<
                  StrengthStepFields & {
                    targets: { create: Array<{ metricType: string | null }> };
                  }
                >;
              };
            };
          };
        }
      >;
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

/** What a strength session needs beyond an endurance one */
function strengthFields(call: CreatedWorkout) {
  const step = call.data.steps.create[0];
  const repeat = step.repeatBlock?.create;
  const child = repeat?.childSteps.create[0];
  return {
    step: { exerciseRef: step.exerciseRef, tempo: step.tempo, side: step.side },
    repeat: {
      kind: repeat?.kind,
      intervalSeconds: repeat?.intervalSeconds,
      timeCapSeconds: repeat?.timeCapSeconds,
    },
    child: {
      exerciseRef: child?.exerciseRef,
      tempo: child?.tempo,
      side: child?.side,
    },
  };
}

const STRENGTH_FIELDS = {
  step: { exerciseRef: null, tempo: null, side: null },
  repeat: { kind: 'EMOM', intervalSeconds: 60, timeCapSeconds: null },
  child: {
    exerciseRef: 'c:barbell-full-squat',
    tempo: '3-1-X-0',
    side: 'LEFT',
  },
};

async function saveTemplate(): Promise<CreatedWorkout> {
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

  return workoutCreate.mock.calls[0][0] as CreatedWorkout;
}

async function planFromTemplate(): Promise<CreatedWorkout> {
  const workoutCreate = jest.fn().mockResolvedValue({ workoutId: 3 });
  const prisma = {
    eventTemplate: {
      findUnique: jest.fn().mockResolvedValue({
        eventTemplateId: 1,
        userId: 7,
        clubId: null,
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

  return workoutCreate.mock.calls[0][0] as CreatedWorkout;
}

describe('EventTemplateService', () => {
  it('keeps the reference of percentage targets when saving a template', async () => {
    expect(metricTypes(await saveTemplate())).toEqual({
      step: 'FTP_RUNNING',
      child: 'HR_MAX',
    });
  });

  it('keeps the reference of percentage targets when planning from a template', async () => {
    expect(metricTypes(await planFromTemplate())).toEqual({
      step: 'FTP_RUNNING',
      child: 'HR_MAX',
    });
  });

  it('keeps the exercises and the repeat kind when saving a template', async () => {
    expect(strengthFields(await saveTemplate())).toEqual(STRENGTH_FIELDS);
  });

  it('keeps the exercises and the repeat kind when planning from a template', async () => {
    expect(strengthFields(await planFromTemplate())).toEqual(STRENGTH_FIELDS);
  });
});
