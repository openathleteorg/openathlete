import { SportType } from '@openathlete/database';
import type { WorkoutDto } from '@openathlete/shared';

import { mapWorkoutDtoToGarmin } from './garmin.mapper';
import type {
  GarminWorkoutRepeatStep,
  GarminWorkoutStep,
} from './garmin.types';

type Step = Record<string, unknown>;

const workout = (steps: Step[]): WorkoutDto =>
  ({ eventTrainingId: 1, steps }) as unknown as WorkoutDto;

const step = (fields: Step): Step => ({
  orderIndex: 0,
  stepType: 'STEADY',
  durationType: 'TIME',
  durationValue: 600,
  targets: [],
  ...fields,
});

const firstStep = (
  steps: Step[],
  sport: SportType = SportType.RUNNING,
  context = {},
) =>
  mapWorkoutDtoToGarmin(workout(steps), sport, 'Session', null, context)
    .segments[0].steps[0] as GarminWorkoutStep;

describe('mapWorkoutDtoToGarmin', () => {
  it('ends a time step without a value with the lap button', () => {
    const garmin = firstStep([step({ durationValue: null })]);

    expect(garmin.durationType).toBe('OPEN');
    expect(garmin.durationValue).toBeNull();
  });

  it('numbers repeat children after their repeat step', () => {
    const steps = mapWorkoutDtoToGarmin(
      workout([
        step({ stepType: 'WARMUP' }),
        step({
          stepType: 'REPEAT',
          repeatBlock: {
            repetitions: 5,
            childSteps: [
              step({ stepType: 'INTERVAL_ACTIVE', durationValue: 60 }),
              step({ stepType: 'INTERVAL_REST', durationValue: 60 }),
            ],
          },
        }),
        step({ stepType: 'COOLDOWN' }),
      ]),
      SportType.RUNNING,
    ).segments[0].steps;

    const repeat = steps[1] as GarminWorkoutRepeatStep;
    expect(steps.map((s) => s.stepOrder)).toEqual([1, 2, 5]);
    expect(repeat.repeatValue).toBe(5);
    expect(repeat.steps.map((s) => s.stepOrder)).toEqual([3, 4]);
    expect(repeat.steps.map((s) => s.intensity)).toEqual([
      'INTERVAL',
      'RECOVERY',
    ]);
  });

  it('sends a zone target as the bounds of the athlete zone', () => {
    const garmin = firstStep(
      [step({ targets: [{ targetType: 'ZONE', targetValue: 42 }] })],
      SportType.RUNNING,
      {
        zones: [
          {
            trainingZoneId: 42,
            type: 'HEARTRATE',
            values: [{ min: 140, max: 155, sports: [] }],
          },
        ],
      },
    );

    expect(garmin.targetType).toBe('HEART_RATE');
    expect([garmin.targetValueLow, garmin.targetValueHigh]).toEqual([140, 155]);
    expect(garmin.targetValue).toBeNull();
  });

  it('converts a pace zone in min/km to speeds', () => {
    const garmin = firstStep(
      [step({ targets: [{ targetType: 'ZONE', targetValue: 7 }] })],
      SportType.RUNNING,
      {
        zones: [
          {
            trainingZoneId: 7,
            type: 'PACE',
            values: [{ min: 4, max: 5, sports: [SportType.RUNNING] }],
          },
        ],
      },
    );

    expect(garmin.targetType).toBe('PACE');
    // 5:00/km = 3.333 m/s, 4:00/km = 4.167 m/s
    expect([garmin.targetValueLow, garmin.targetValueHigh]).toEqual([
      3.333, 4.167,
    ]);
  });

  it('turns a single heart rate into a range, as targetValue is a zone number', () => {
    const garmin = firstStep([
      step({ targets: [{ targetType: 'HEARTRATE', targetValue: 150 }] }),
    ]);

    expect([garmin.targetValueLow, garmin.targetValueHigh]).toEqual([145, 155]);
    expect(garmin.targetValue).toBeNull();
  });

  it('lets the watch apply a percentage when the reference metric is missing', () => {
    const garmin = firstStep([
      step({
        targets: [
          {
            targetType: 'HEARTRATE',
            targetMin: 0.8,
            targetMax: 0.85,
            metricType: 'HR_MAX',
          },
        ],
      }),
    ]);

    expect(garmin.targetValueType).toBe('PERCENT');
    expect([garmin.targetValueLow, garmin.targetValueHigh]).toEqual([80, 85]);
  });

  it('gives swim pace as a secondary target with a pool unit', () => {
    const result = mapWorkoutDtoToGarmin(
      workout([
        step({
          durationType: 'DISTANCE',
          durationValue: 400,
          targets: [{ targetType: 'PACE', targetMin: 1, targetMax: 1.2 }],
        }),
        step({ stepType: 'INTERVAL_REST', durationValue: 20 }),
      ]),
      SportType.SWIMMING,
    );
    const [swim, rest] = result.segments[0].steps as GarminWorkoutStep[];

    expect(result.sport).toBe('LAP_SWIMMING');
    expect(result.poolLengthUnit).toBe('METER');
    expect(swim.targetType).toBeNull();
    expect(swim.secondaryTargetType).toBe('PACE_ZONE');
    expect(rest.durationType).toBe('FIXED_REST');
  });

  it('keeps targets Garmin cannot follow in the step description', () => {
    const garmin = firstStep([
      step({
        name: 'Tempo',
        durationType: 'REPS',
        durationValue: 10,
        targets: [{ targetType: 'RPE', targetMin: 6, targetMax: 7 }],
      }),
    ]);

    expect(garmin.durationType).toBe('OPEN');
    expect(garmin.description).toBe('Tempo · 10 reps · RPE 6-7');
  });

  it('sends a strength exercise as Garmin knows it, with its reps and load', () => {
    const [repeat] = mapWorkoutDtoToGarmin(
      workout([
        step({
          stepType: 'REPEAT',
          durationType: 'OPEN',
          repeatBlock: {
            repetitions: 4,
            childSteps: [
              step({
                stepType: 'INTERVAL_ACTIVE',
                name: 'Squat',
                exerciseRef: 'c:barbell-full-squat',
                durationType: 'REPS',
                durationValue: 8,
                targets: [{ targetType: 'WEIGHT', targetValue: 60 }],
              }),
              step({ stepType: 'INTERVAL_REST', durationValue: 90 }),
            ],
          },
        }),
        step({
          stepType: 'INTERVAL_ACTIVE',
          name: 'Archer push-up',
          exerciseRef: 'c:archer-push-up',
          durationType: 'REPS',
          durationValue: 10,
        }),
        step({
          stepType: 'INTERVAL_ACTIVE',
          name: 'My own',
          exerciseRef: 'u:12',
          durationType: 'REPS',
          durationValue: 10,
        }),
      ]),
      SportType.STRENGTH,
      'Legs',
    ).segments[0].steps as [
      GarminWorkoutRepeatStep,
      GarminWorkoutStep,
      GarminWorkoutStep,
    ];

    expect(repeat.repeatValue).toBe(4);
    expect(repeat.steps[0]).toMatchObject({
      durationType: 'REPS',
      durationValue: 8,
      exerciseCategory: 'SQUAT',
      exerciseName: 'BARBELL_BACK_SQUAT',
      weightValue: 60,
      weightDisplayUnit: 'KILOGRAM',
    });
  });

  it('falls back on the movement, or on nothing for a custom exercise', () => {
    const map = (exerciseRef: string) =>
      firstStep(
        [step({ exerciseRef, durationType: 'REPS', durationValue: 10 })],
        SportType.STRENGTH,
      );
    expect(map('c:archer-push-up')).toMatchObject({
      exerciseCategory: 'PUSH_UP',
      exerciseName: null,
    });
    expect(map('u:12')).toMatchObject({
      exerciseCategory: null,
      exerciseName: null,
    });
  });

  it('keeps exercises out of the steps of other sports', () => {
    const garmin = firstStep(
      [step({ exerciseRef: 'c:barbell-full-squat', durationType: 'TIME' })],
      SportType.RUNNING,
    );
    expect(garmin.exerciseCategory).toBeNull();
  });
});
