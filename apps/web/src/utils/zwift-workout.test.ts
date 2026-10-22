import { describe, expect, it } from 'vitest';

import {
  type Event,
  type TrainingEvent,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  type Workout,
  type WorkoutStep,
} from '@openathlete/shared';

import {
  localDayBounds,
  todaysZwiftWorkouts,
  zwiftWorkoutXML,
} from './zwift-workout';

const step = (overrides: Partial<WorkoutStep> = {}): WorkoutStep =>
  ({
    orderIndex: 0,
    stepType: WORKOUT_STEP_TYPE.STEADY,
    durationType: WORKOUT_DURATION_TYPE.TIME,
    durationValue: 120,
    targets: [
      {
        targetType: WORKOUT_TARGET_TYPE.POWER,
        metricType: 'FTP_CYCLING',
        targetValue: 0.75,
      },
    ],
    ...overrides,
  }) as WorkoutStep;
const workout = (steps: WorkoutStep[] = [step()]): TrainingEvent =>
  ({
    eventId: 42,
    type: 'TRAINING',
    sport: 'CYCLING',
    name: 'A & B <ride>',
    description: '"test"',
    startDate: new Date(2026, 9, 22, 15),
    workout: { steps } as Workout,
  }) as TrainingEvent;
describe('Zwift workout export', () => {
  it('escapes XML and preserves FTP fractions and cadence', () => {
    const event = workout([
      step({
        targets: [
          {
            targetType: WORKOUT_TARGET_TYPE.POWER,
            metricType: 'FTP_CYCLING',
            targetMin: 0.6,
            targetMax: 0.8,
          },
          { targetType: WORKOUT_TARGET_TYPE.CADENCE, targetValue: 90 },
        ] as unknown as WorkoutStep['targets'],
        notes: "Don't <rush>",
      }),
    ]);
    const xml = zwiftWorkoutXML(event);
    expect(xml).toContain('<name>A &amp; B &lt;ride&gt;</name>');
    expect(xml).toContain('Power="0.7" Cadence="90"');
    expect(xml).toContain('Don&apos;t &lt;rush&gt;');
  });
  it('requires FTP for watts and converts watts to fractions', () => {
    const event = workout([
      step({
        targets: [
          { targetType: 'POWER', targetValue: 200 },
        ] as unknown as WorkoutStep['targets'],
      }),
    ]);
    expect(() => zwiftWorkoutXML(event)).toThrow('ftp');
    expect(zwiftWorkoutXML(event, 250)).toContain('Power="0.8"');
  });
  it('flattens sorted repeats and preserves free ride durations', () => {
    const event = workout([
      step({
        stepType: WORKOUT_STEP_TYPE.REPEAT,
        repeatBlock: {
          repetitions: 3,
          childSteps: [
            step({ orderIndex: 1, targets: [], durationValue: 30 }),
            step({ orderIndex: 0 }),
          ],
        } as WorkoutStep['repeatBlock'],
      }),
    ]);
    const xml = zwiftWorkoutXML(event);
    expect(xml.match(/<SteadyState /g)).toHaveLength(3);
    expect(xml.match(/<FreeRide Duration="30"/g)).toHaveLength(3);
    expect(xml.indexOf('<SteadyState')).toBeLessThan(xml.indexOf('<FreeRide'));
  });
  it('rejects unsupported durations, targets, sports and pathological repeats', () => {
    for (const event of [
      workout([step({ durationType: WORKOUT_DURATION_TYPE.DISTANCE })]),
      workout([step({ durationValue: Number.NaN })]),
      workout([
        step({
          targets: [
            { targetType: 'HEARTRATE', targetValue: 140 },
          ] as unknown as WorkoutStep['targets'],
        }),
      ]),
      { ...workout(), sport: 'RUNNING' } as Event,
      workout([
        step({
          stepType: WORKOUT_STEP_TYPE.REPEAT,
          repeatBlock: {
            repetitions: 999,
            childSteps: [step()],
          } as WorkoutStep['repeatBlock'],
        }),
      ]),
    ])
      expect(() => zwiftWorkoutXML(event, 250)).toThrow('unsupported');
  });
  it('uses the local calendar day and excludes completed workouts', () => {
    const today = new Date(2026, 9, 22, 1);
    const { start, end } = localDayBounds(today);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(23);
    const events = [
      workout(),
      { ...workout(), eventId: 43, startDate: end },
      { ...workout(), eventId: 44, relatedActivity: { eventId: 3 } },
    ] as Event[];
    expect(
      todaysZwiftWorkouts(events, today).map((event) => event.eventId),
    ).toEqual([42]);
  });
});
