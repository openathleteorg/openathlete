import { SportType } from '@openathlete/database';
import type { WorkoutDto, WorkoutStepDto } from '@openathlete/shared';

import { mapWorkoutDtoToSuuntoGuide } from './suunto-guide.mapper';
import type { SuuntoFieldsStep, SuuntoRepeatStep } from './suunto-guide.types';

function step(overrides: Partial<WorkoutStepDto>): WorkoutStepDto {
  return {
    orderIndex: 0,
    stepType: 'STEADY',
    durationType: 'TIME',
    durationValue: 600,
    targets: [],
    ...overrides,
  } as WorkoutStepDto;
}

function guideOf(
  steps: WorkoutStepDto[],
  sport: SportType = SportType.RUNNING,
  context = {},
) {
  return mapWorkoutDtoToSuuntoGuide(
    { steps } as WorkoutDto,
    sport,
    'Threshold',
    null,
    '2026-10-28',
    42,
    context,
  );
}

const fieldsStep = (s: unknown) => s as SuuntoFieldsStep;

describe('mapWorkoutDtoToSuuntoGuide', () => {
  it('starts a lap with every step after the first, so laps match steps', () => {
    const guide = guideOf([
      step({ orderIndex: 0, stepType: 'WARMUP' }),
      step({ orderIndex: 1, stepType: 'INTERVAL_ACTIVE' }),
    ]);

    expect(fieldsStep(guide.steps[0]).createManualLap).toBeUndefined();
    expect(fieldsStep(guide.steps[1]).createManualLap).toBe(true);
  });

  it('ends a timed step after its duration or on the lap button', () => {
    const guide = guideOf([step({ durationValue: 180 })]);
    const first = fieldsStep(guide.steps[0]);

    expect(first.transitions).toEqual([
      {
        condition: {
          type: 'or',
          conditions: [
            { type: 'stepDuration', value: 180 },
            { type: 'manualLap' },
          ],
        },
      },
    ]);
    expect(first.fields).toContainEqual(
      expect.objectContaining({ type: 'stepDurationCountdown', value: 180 }),
    );
  });

  it('lets the lap button end a timed step without a duration', () => {
    const guide = guideOf([step({ durationValue: null })]);

    expect(fieldsStep(guide.steps[0]).transitions).toEqual([
      { condition: { type: 'manualLap' } },
    ]);
  });

  it('keeps repeats as repeat steps and skips empty ones', () => {
    const guide = guideOf([
      step({ orderIndex: 0, stepType: 'WARMUP' }),
      step({
        orderIndex: 1,
        stepType: 'REPEAT',
        durationType: 'OPEN',
        repeatBlock: {
          repetitions: 5,
          childSteps: [
            step({
              orderIndex: 1,
              stepType: 'INTERVAL_REST',
              durationValue: 60,
            }),
            step({
              orderIndex: 0,
              stepType: 'INTERVAL_ACTIVE',
              durationValue: 180,
            }),
          ],
        },
      } as Partial<WorkoutStepDto>),
      step({
        orderIndex: 2,
        stepType: 'REPEAT',
        durationType: 'OPEN',
        repeatBlock: { repetitions: 3, childSteps: [] },
      } as Partial<WorkoutStepDto>),
    ]);

    expect(guide.steps).toHaveLength(2);
    const repeat = guide.steps[1] as SuuntoRepeatStep;
    expect(repeat.type).toBe('repeat');
    expect(repeat.times).toBe(5);
    expect(repeat.steps.map((s) => s.title)).toEqual(['Interval', 'Recovery']);
    expect(repeat.steps.every((s) => s.createManualLap)).toBe(true);
  });

  it('resolves a heart rate zone from the athlete zones, not its id', () => {
    const guide = guideOf(
      [
        step({
          targets: [{ targetType: 'ZONE', targetValue: 7 }],
        } as Partial<WorkoutStepDto>),
      ],
      SportType.RUNNING,
      {
        zones: [
          {
            trainingZoneId: 7,
            type: 'HEARTRATE',
            values: [{ min: 150, max: 162, sports: [] }],
          },
        ],
      },
    );

    expect(fieldsStep(guide.steps[0]).fields[0]).toEqual({
      type: 'targetHeartRate',
      min: 150,
      max: 162,
    });
  });

  it('turns a pace zone in min/km into speeds and says it as a pace', () => {
    const guide = guideOf(
      [
        step({
          targets: [{ targetType: 'ZONE', targetValue: 3 }],
        } as Partial<WorkoutStepDto>),
      ],
      SportType.RUNNING,
      {
        zones: [
          {
            trainingZoneId: 3,
            type: 'PACE',
            values: [{ min: 4, max: 4.5, sports: [SportType.RUNNING] }],
          },
        ],
      },
    );
    const first = fieldsStep(guide.steps[0]);

    expect(first.fields[0]).toEqual({
      type: 'targetPace',
      min: 3.704,
      max: 4.167,
    });
    expect(first.notification?.text).toBe('10:00 · 4:00-4:30/km');
  });

  it('applies a VMA percentage to the athlete VMA', () => {
    const guide = guideOf(
      [
        step({
          targets: [
            {
              targetType: 'PACE',
              targetMin: 0.9,
              targetMax: 0.95,
              metricType: 'VMA',
            },
          ],
        } as Partial<WorkoutStepDto>),
      ],
      SportType.RUNNING,
      { metrics: { VMA: { value: 18 } } },
    );

    expect(fieldsStep(guide.steps[0]).fields[0]).toEqual({
      type: 'targetPace',
      min: 4.5,
      max: 4.75,
    });
  });

  it('does not guess a target from a reference the athlete has not set', () => {
    const guide = guideOf(
      [
        step({
          targets: [
            {
              targetType: 'POWER',
              targetMin: 0.9,
              targetMax: 1,
              metricType: 'FTP_CYCLING',
            },
          ],
        } as Partial<WorkoutStepDto>),
      ],
      SportType.CYCLING,
    );
    const first = fieldsStep(guide.steps[0]);

    expect(first.fields.some((f) => f.type === 'targetPower')).toBe(false);
    expect(first.notification?.text).toBe('10:00 · 90%-100% FTP_CYCLING');
  });

  it('keeps text out of the fields, where long notes hide the others', () => {
    const guide = guideOf([
      step({ notes: 'Relax the shoulders and keep a steady breathing rhythm' }),
    ]);
    const first = fieldsStep(guide.steps[0]);

    expect(first.fields.some((f) => f.type === 'text')).toBe(false);
    expect(first.fields.length).toBeLessThanOrEqual(5);
    expect(first.notification?.text?.length).toBeLessThanOrEqual(54);
  });

  it('offers a run in every running mode, its own sport first', () => {
    const guide = guideOf([step({})], SportType.TRAIL_RUNNING);

    // Trail, then running, treadmill, track and orienteering; vertical and
    // track running are left out, the Guides API refuses them
    expect(guide.activities).toEqual([22, 1, 53, 59, 60]);
  });
});
