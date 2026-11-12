import { describe, expect, it } from 'vitest';

import {
  mapPrismaWorkoutToDto,
  mapWorkoutDtoToPrisma,
  normalizeWorkoutForCreate,
} from './workout.mappers';

// A strength workout as Prisma reads it: a superset of two exercises
const stored = {
  workoutId: 1,
  eventTrainingId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [
    {
      workoutStepId: 10,
      orderIndex: 0,
      stepType: 'REPEAT',
      name: 'Bloc A',
      notes: null,
      durationType: 'OPEN',
      durationValue: null,
      durationTarget: null,
      exerciseRef: null,
      tempo: null,
      side: null,
      workoutId: 1,
      repeatParentId: null,
      targets: [],
      repeatBlock: {
        workoutRepeatId: 5,
        repetitions: 4,
        kind: 'SUPERSET',
        intervalSeconds: null,
        timeCapSeconds: null,
        stepId: 10,
        childSteps: [
          {
            workoutStepId: 11,
            orderIndex: 0,
            stepType: 'INTERVAL_ACTIVE',
            name: 'Squat',
            notes: 'Genoux ouverts',
            durationType: 'REPS',
            durationValue: 8,
            durationTarget: null,
            exerciseRef: 'c:barbell-full-squat',
            tempo: '3-1-1-0',
            side: null,
            targets: [
              {
                workoutStepTargetId: 1,
                targetType: 'WEIGHT',
                targetMin: null,
                targetMax: null,
                targetValue: 80,
                metricType: null,
                stepId: 11,
              },
            ],
          },
          {
            workoutStepId: 12,
            orderIndex: 1,
            stepType: 'INTERVAL_ACTIVE',
            name: 'Fentes',
            notes: null,
            durationType: 'REPS',
            durationValue: 10,
            durationTarget: null,
            exerciseRef: 'u:42',
            tempo: null,
            side: 'EACH',
            targets: [],
          },
        ],
      },
    },
  ],
};

describe('workout mappers', () => {
  it('copies a strength workout whole: exercises, tempo, side and block kind', () => {
    const dto = mapPrismaWorkoutToDto(stored as never);
    const create = mapWorkoutDtoToPrisma({ steps: dto.steps }) as {
      steps: { create: Record<string, unknown>[] };
    };
    const [repeat] = create.steps.create;
    expect(repeat).toMatchObject({
      name: 'Bloc A',
      repeatBlock: {
        create: {
          repetitions: 4,
          kind: 'SUPERSET',
          intervalSeconds: null,
          timeCapSeconds: null,
          childSteps: {
            create: [
              {
                exerciseRef: 'c:barbell-full-squat',
                tempo: '3-1-1-0',
                notes: 'Genoux ouverts',
                durationType: 'REPS',
                durationValue: 8,
                targets: {
                  create: [{ targetType: 'WEIGHT', targetValue: 80 }],
                },
              },
              { exerciseRef: 'u:42', side: 'EACH' },
            ],
          },
        },
      },
    });
  });

  it('keeps the strength fields when the web app sends steps back', () => {
    const dto = mapPrismaWorkoutToDto(stored as never);
    const sent = normalizeWorkoutForCreate({ steps: dto.steps });
    expect(sent.steps[0].repeatBlock).toMatchObject({
      kind: 'SUPERSET',
      childSteps: [
        { exerciseRef: 'c:barbell-full-squat', tempo: '3-1-1-0' },
        { exerciseRef: 'u:42', side: 'EACH' },
      ],
    });
  });

  it('defaults older repeats to plain repetitions', () => {
    const sent = normalizeWorkoutForCreate({
      steps: [
        {
          stepType: 'REPEAT' as never,
          repeatBlock: { repetitions: 3, childSteps: [] },
        },
      ],
    });
    expect(sent.steps[0].repeatBlock?.kind).toBe('REPEAT');
  });
});
