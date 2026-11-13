import { describe, expect, it } from 'vitest';

import type { CreateWorkoutStepDto } from '../../types/dtos/core/workout.dto';
import {
  WORKOUT_DURATION_TYPE as D,
  WORKOUT_STEP_TYPE as S,
  WORKOUT_TARGET_TYPE as T,
  TRAINING_ZONE_TYPE,
} from '../../types/misc';
import { METRIC_TYPE } from '../../types/misc/core/metric-type.enum';
import { SPORT_TYPE } from '../../types/misc/core/sport-type.enum';
import { parseWorkoutText } from './parse';
import { serializeWorkoutText } from './serialize';
import type { WorkoutTextZone } from './types';

// Zone ids as the database gives them: unrelated to the zone number
const zones: WorkoutTextZone[] = [
  ...[0, 1, 2, 3, 4].map((index) => ({
    trainingZoneId: 100 + index,
    type: TRAINING_ZONE_TYPE.HEARTRATE,
    index,
  })),
  ...[0, 1, 2, 3, 4, 5].map((index) => ({
    trainingZoneId: 200 + index,
    type: TRAINING_ZONE_TYPE.POWER,
    index,
  })),
  ...[0, 1, 2, 3, 4].map((index) => ({
    trainingZoneId: 300 + index,
    type: TRAINING_ZONE_TYPE.PACE,
    index,
  })),
];
const run = { sport: SPORT_TYPE.RUNNING, zones };
const ride = { sport: SPORT_TYPE.CYCLING, zones };
const swim = { sport: SPORT_TYPE.SWIMMING, zones };

const parse = (text: string, context = run) => parseWorkoutText(text, context);
const only = (text: string, context = run) => {
  const result = parse(text, context);
  expect(result.issues).toEqual([]);
  return result.steps;
};
const first = (text: string, context = run) => only(text, context)[0];
const errors = (text: string, context = run) =>
  parse(text, context).issues.filter((issue) => issue.severity === 'error');

describe('durations', () => {
  it.each([
    ['10m', 600],
    ["10'", 600],
    ['10’', 600],
    ['10min', 600],
    ['10 min', null],
    ["1'30", 90],
    ['1\'30"', 90],
    ['1m30', 90],
    ['1m30s', 90],
    ['90s', 90],
    ['30"', 30],
    ["30''", 30],
    ['1:30', 90],
    ['1h', 3600],
    ['1h30', 5400],
    ['1h30m', 5400],
    ['1:05:00', 3900],
    ['55min', 3300],
    ['2.5min', 150],
  ])('reads %s as %s seconds', (word, seconds) => {
    if (seconds === null) {
      expect(errors(`- ${word}`)).not.toEqual([]);
      return;
    }
    expect(first(`- ${word}`)).toMatchObject({
      durationType: D.TIME,
      durationValue: seconds,
    });
  });

  it.each([
    ['400m', 400],
    ['50m', 50],
    ['1km', 1000],
    ['1.5km', 1500],
    ['1,5km', 1500],
    ['10k', 10000],
    ['30mtr', 30],
    ['1mi', 1609.34],
    ['400', 400],
  ])('reads %s as %s metres', (word, meters) => {
    expect(first(`- ${word}`)).toMatchObject({
      durationType: D.DISTANCE,
      durationValue: meters,
    });
  });

  it('reads metres in the pool, even below 50', () => {
    expect(first('- 25m', swim)).toMatchObject({
      durationType: D.DISTANCE,
      durationValue: 25,
    });
    expect(first('- 100y', swim).durationValue).toBeCloseTo(91.44);
  });

  it('ends steps on the lap button, open, heart rate, calories or reps', () => {
    expect(first('- lap Z1').durationType).toBe(D.LAP_BUTTON);
    expect(first('- tour').durationType).toBe(D.LAP_BUTTON);
    expect(first('- open').durationType).toBe(D.OPEN);
    expect(first('- hr<130')).toMatchObject({
      durationType: D.HR_BELOW,
      durationValue: 130,
    });
    expect(first('- 100kcal').durationType).toBe(D.CALORIES);
    expect(first('- 12reps').durationType).toBe(D.REPS);
  });
});

describe('targets', () => {
  it('maps zone numbers to the athlete zone ids, by sport', () => {
    expect(first('- 10m Z2').targets).toEqual([
      { targetType: T.ZONE, targetValue: 101 },
    ]);
    expect(first('- 10m Z2', ride).targets).toEqual([
      { targetType: T.ZONE, targetValue: 201 },
    ]);
    expect(first('- 10m Z3 Pace').targets).toEqual([
      { targetType: T.ZONE, targetValue: 302 },
    ]);
    expect(first('- 10m Z3 FC').targets?.[0].targetValue).toBe(102);
  });

  it('falls back on a zone type the athlete has', () => {
    const onlyHr = zones.filter((z) => z.type === TRAINING_ZONE_TYPE.HEARTRATE);
    expect(
      first('- 10m Z2', { sport: SPORT_TYPE.CYCLING, zones: onlyHr }).targets,
    ).toEqual([{ targetType: T.ZONE, targetValue: 101 }]);
  });

  it('flags a zone the athlete does not have', () => {
    expect(errors('- 10m Z6')).toMatchObject([
      { code: 'zone_not_found', from: 6, to: 8 },
    ]);
    expect(
      errors('- 10m Z2', { sport: SPORT_TYPE.RUNNING, zones: [] }),
    ).toMatchObject([{ code: 'zone_not_found' }]);
    expect(errors('- 10m Z2-Z3')[0].code).toBe('zone_range');
  });

  it('reads percentages of the sport reference, or of the one named', () => {
    expect(first('- 3m 95%').targets).toEqual([
      { targetType: T.PACE, targetValue: 0.95, metricType: METRIC_TYPE.VMA },
    ]);
    expect(first('- 3m 95-105%', ride).targets).toEqual([
      {
        targetType: T.POWER,
        targetMin: 0.95,
        targetMax: 1.05,
        metricType: METRIC_TYPE.FTP_CYCLING,
      },
    ]);
    expect(first('- 3m 95 - 105 %', ride).targets?.[0]).toMatchObject({
      targetMin: 0.95,
      targetMax: 1.05,
    });
    expect(first('- 3m 80% HR').targets).toEqual([
      {
        targetType: T.HEARTRATE,
        targetValue: 0.8,
        metricType: METRIC_TYPE.HR_MAX,
      },
    ]);
    expect(first('- 3m 90% FTP').targets?.[0].metricType).toBe(
      METRIC_TYPE.FTP_RUNNING,
    );
    expect(first('- 3m 100%cp', ride).targets?.[0].metricType).toBe(
      METRIC_TYPE.CRITICAL_POWER_CYCLING,
    );
  });

  it('reads absolute values', () => {
    expect(first('- 3m 250w', ride).targets).toEqual([
      { targetType: T.POWER, targetValue: 250 },
    ]);
    expect(first('- 3m 240-260W', ride).targets).toEqual([
      { targetType: T.POWER, targetMin: 240, targetMax: 260 },
    ]);
    expect(first('- 3m 150-160bpm').targets).toEqual([
      { targetType: T.HEARTRATE, targetMin: 150, targetMax: 160 },
    ]);
    expect(first('- 3m 32km/h', ride).targets?.[0].targetValue).toBeCloseTo(
      8.8889,
    );
    expect(first('- 3m 90rpm', ride).targets).toEqual([
      { targetType: T.CADENCE, targetValue: 90 },
    ]);
    expect(first('- 3m RPE 7').targets).toEqual([
      { targetType: T.RPE, targetValue: 7 },
    ]);
    expect(first('- 3m rpe7').targets).toEqual([
      { targetType: T.RPE, targetValue: 7 },
    ]);
  });

  it('reads paces as speeds, slower bound as the minimum', () => {
    expect(first('- 1km 4:00/km').targets?.[0].targetValue).toBeCloseTo(4.1667);
    const range = first('- 1km 3:50-4:00/km').targets?.[0];
    expect(range?.targetMin).toBeCloseTo(4.1667);
    expect(range?.targetMax).toBeCloseTo(4.3478);
    expect(first('- 1km 4:00 /km').targets?.[0].targetValue).toBeCloseTo(
      4.1667,
    );
    expect(
      first('- 100m 1:40/100m', swim).targets?.[0].targetValue,
    ).toBeCloseTo(1);
  });

  it('stacks targets of different kinds, refuses two of one kind', () => {
    expect(first('- 10m 250w 90rpm', ride).targets).toHaveLength(2);
    expect(first('- 10m Z3 4:30/km').targets).toHaveLength(2);
    expect(errors('- 10m 250w 260w', ride)[0].code).toBe('duplicate_target');
    expect(errors('- 10m Z2 Z3')[0].code).toBe('duplicate_target');
  });

  it('refuses ramps rather than guessing them', () => {
    expect(errors('- 10m ramp 50-75%', ride)[0].code).toBe('ramp_unsupported');
  });
});

describe('labels, types and notes', () => {
  it('keeps the words before the duration as the name', () => {
    expect(first('- Côte 3m Z4')).toMatchObject({ name: 'Côte' });
    expect(first('- "Côte 200" 1m Z4')).toMatchObject({ name: 'Côte 200' });
    expect(first('- Série 2 3m Z4')).toMatchObject({ name: 'Série 2' });
  });

  it('reads the step type from the label, in every language', () => {
    expect(first('- Échauffement 15m Z2')).toMatchObject({
      stepType: S.WARMUP,
      name: null,
    });
    expect(first('- Warmup progressif 15m Z2')).toMatchObject({
      stepType: S.WARMUP,
      name: 'Warmup progressif',
    });
    expect(first('- Retour au calme 10m Z1').stepType).toBe(S.COOLDOWN);
    expect(first('- Riscaldamento 10m').stepType).toBe(S.WARMUP);
    expect(first('- Aquecimento 10m').stepType).toBe(S.WARMUP);
    expect(first('- Aufwärmen 10m').stepType).toBe(S.WARMUP);
    expect(first('- Auslaufen 10m Z1').stepType).toBe(S.COOLDOWN);
    expect(first('- 10m Z2 intensity=cooldown').stepType).toBe(S.COOLDOWN);
  });

  it('takes the type of the section above', () => {
    const steps = only('Warmup\n- 10m Z1\n- 5m Z2\n\n- 20m Z3');
    expect(steps.map((step) => step.stepType)).toEqual([
      S.WARMUP,
      S.WARMUP,
      S.COOLDOWN,
    ]);
  });

  it('keeps what follows # as the note', () => {
    expect(first('- 10m Z2 # relâché, foulée courte')).toMatchObject({
      notes: 'relâché, foulée courte',
      durationValue: 600,
    });
  });

  it('frames a session: warm-up first, cool-down last', () => {
    const steps = only('- 15m Z2\n- 6x(1km Z4 / 2m Z1)\n- 10m Z1');
    expect(steps.map((step) => step.stepType)).toEqual([
      S.WARMUP,
      S.REPEAT,
      S.COOLDOWN,
    ]);
    expect(only('- 1h Z2')[0].stepType).toBe(S.STEADY);
    expect(only('- 20m Z2\n- 20m Z3').map((step) => step.stepType)).toEqual([
      S.STEADY,
      S.STEADY,
    ]);
  });
});

describe('repeats', () => {
  const shape = (steps: CreateWorkoutStepDto[]): unknown =>
    steps.map((step) =>
      step.repeatBlock
        ? [step.repeatBlock.repetitions, shape(step.repeatBlock.childSteps)]
        : `${step.stepType}:${step.durationValue}`,
    );

  it('reads Intervals.icu blocks, up to the blank line', () => {
    const steps = only('- 10m Z1\n\nMain set 5x\n- 3m Z4\n- 2m Z1\n\n- 10m Z1');
    expect(steps[1]).toMatchObject({ stepType: S.REPEAT, name: 'Main set' });
    expect(shape(steps)).toEqual([
      'WARMUP:600',
      [5, ['INTERVAL_ACTIVE:180', 'INTERVAL_REST:120']],
      'COOLDOWN:600',
    ]);
  });

  it('reads indented blocks, which end at the dedent', () => {
    const steps = only('5x\n  - 3m Z4\n  - 2m Z1\n- 10m Z1');
    expect(shape(steps)).toEqual([
      [5, ['INTERVAL_ACTIVE:180', 'INTERVAL_REST:120']],
      'COOLDOWN:600',
    ]);
  });

  it('reads repeats on one line', () => {
    expect(shape(only('- 6x(400m Z5 / 200m Z1)'))).toEqual([
      [6, ['INTERVAL_ACTIVE:400', 'INTERVAL_REST:200']],
    ]);
    expect(shape(only('6 x (400m Z5, 200m Z1)'))).toEqual([
      [6, ['INTERVAL_ACTIVE:400', 'INTERVAL_REST:200']],
    ]);
    expect(shape(only("- 10x400m 3:20/km r1'30"))).toEqual([
      [10, ['INTERVAL_ACTIVE:400', 'INTERVAL_REST:90']],
    ]);
    expect(shape(only('- 10x30/30 Z5'))).toEqual([
      [10, ['INTERVAL_ACTIVE:30', 'INTERVAL_REST:30']],
    ]);
    expect(shape(only("- 8x1'/1'"))).toEqual([
      [8, ['INTERVAL_ACTIVE:60', 'INTERVAL_REST:60']],
    ]);
  });

  it('puts a recovery after the parentheses after the repeat', () => {
    expect(shape(only("- 3x(1km Z4 r2') r5'"))).toEqual([
      [3, ['INTERVAL_ACTIVE:1000', 'INTERVAL_REST:120']],
      'INTERVAL_REST:300',
    ]);
    expect(shape(parse("- 3x(10x30/30 Z5) r5'").steps)).toEqual([
      [30, ['INTERVAL_ACTIVE:30', 'INTERVAL_REST:30']],
      'INTERVAL_REST:300',
    ]);
  });

  it('expands repeats nested deeper than watches take', () => {
    const result = parse('- 2x(4x(30s Z5 / 30s Z1) / 3m Z1)');
    expect(result.issues).toMatchObject([
      { severity: 'warning', code: 'nested_repeat_expanded' },
    ]);
    expect(shape(result.steps)).toEqual([
      [4, ['INTERVAL_ACTIVE:30', 'INTERVAL_REST:30']],
      'INTERVAL_REST:180',
      [4, ['INTERVAL_ACTIVE:30', 'INTERVAL_REST:30']],
      'INTERVAL_REST:180',
    ]);
  });

  it('reads nested indented blocks the same way', () => {
    const steps = parse(
      '2x\n  4x\n    - 30s Z5\n    - 30s Z1\n  - 3m Z1',
    ).steps;
    expect(shape(steps)).toHaveLength(4);
  });

  it('calls a later, easier step of a repeat the recovery', () => {
    const types = (text: string) =>
      only(text)[0].repeatBlock?.childSteps.map((step) => step.stepType);
    expect(types('- 5x(1km 3:30/km / 1km 4:30/km)')).toEqual([
      S.INTERVAL_ACTIVE,
      S.INTERVAL_REST,
    ]);
    expect(types('- 5x(1km Z4 / 1km Z4)')).toEqual([
      S.INTERVAL_ACTIVE,
      S.INTERVAL_ACTIVE,
    ]);
    expect(types('- 5x(1m Z5 / 1m)')).toEqual([
      S.INTERVAL_ACTIVE,
      S.INTERVAL_REST,
    ]);
  });

  it('refuses empty repeats, unclosed parentheses and too many repetitions', () => {
    expect(errors('5x\n\n- 10m')[0].code).toBe('empty_repeat');
    expect(errors('- 5x(3m Z4 / 2m Z1')[0].code).toBe('unclosed_paren');
    expect(errors('- 120x(30s / 30s)')[0].code).toBe('repetitions_range');
  });
});

describe('errors', () => {
  it('points at the word it cannot read, and drops the step', () => {
    const result = parse('- 10m Z2 vite\n- 5m Z1');
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: 'unknown_token',
        line: 0,
        from: 9,
        to: 13,
        text: 'vite',
      }),
    ]);
    expect(result.steps).toHaveLength(1);
  });

  it('wants a duration on every step', () => {
    expect(errors('- Z2')[0].code).toBe('missing_duration');
    expect(errors('- Footing tranquille')[0]).toMatchObject({
      code: 'missing_duration',
      line: 0,
    });
  });

  it('skips comments and free titles, warning about titles', () => {
    const result = parse('# Séance du mardi\n// pour le groupe\nTitre\n- 10m');
    expect(result.steps).toHaveLength(1);
    expect(result.issues).toMatchObject([{ code: 'ignored_line', line: 2 }]);
  });

  it('reads a step written without its dash', () => {
    expect(only('10m Z2')).toHaveLength(1);
  });
});

describe('serialize', () => {
  const roundTrip = (
    text: string,
    context = run,
    locale: 'en' | 'fr' | 'de' = 'en',
  ) => {
    const steps = only(text, context);
    const written = serializeWorkoutText(steps, { ...context, locale });
    expect(only(written, context)).toEqual(steps);
    // Writing again what was read gives the same text
    expect(
      serializeWorkoutText(only(written, context), { ...context, locale }),
    ).toBe(written);
    return written;
  };

  it('writes a classic session the way people type it', () => {
    expect(
      roundTrip('- 15m Z2\n- 6x(1km 3:20-3:30/km / 2m Z1)\n- 10m Z1'),
    ).toBe('- 15m Z2\n\n6x\n- 1km 3:20-3:30/km\n- 2m Z1\n\n- 10m Z1');
  });

  it('writes type words only where the reading would differ', () => {
    expect(
      roundTrip('- 10m Z2\n- 20m Z3 intensity=warmup\n- 5m Z1', run, 'fr'),
    ).toBe('- 10m Z2\n- Échauffement 20m Z3\n- 5m Z1');
    expect(roundTrip('- 5x(3m Z4 / effort 2m Z1)')).toBe(
      '5x\n- 3m Z4\n- Interval 2m Z1',
    );
    expect(
      roundTrip('- 10m Z2\n- 20m Z3 intensity=warmup\n- 5m Z1', run, 'de'),
    ).toBe('- 10m Z2\n- Aufwärmen 20m Z3\n- 5m Z1');
  });

  it('keeps names, notes and every kind of target', () => {
    roundTrip('- Côte 3m Z4 Pace 180spm # pas courts');
    roundTrip('- "Côte 200" 1m 105% # 2 lignes');
    roundTrip('- Récup trot 2m intensity=active');
    roundTrip('- 3m 250w 90rpm\n- 3m 95-105%\n- 2m 32km/h\n- 10m 60% HR', ride);
    roundTrip('- 400m 1:40/100m\n- 4x(100m Z4 / 15s)', swim);
    roundTrip('- lap Z1\n- hr<130\n- 1h05m03s RPE4');
    roundTrip('Échauffement\n- 10m Z1\n- 1:05:00 Z2\n- 30mtr 85% HR');
  });

  it('writes durations and distances without ambiguity', () => {
    const steps: CreateWorkoutStepDto[] = [
      {
        stepType: S.STEADY,
        durationType: D.TIME,
        durationValue: 3300,
        targets: [],
      },
      {
        stepType: S.STEADY,
        durationType: D.TIME,
        durationValue: 4500,
        targets: [],
      },
      {
        stepType: S.STEADY,
        durationType: D.DISTANCE,
        durationValue: 30,
        targets: [],
      },
      {
        stepType: S.STEADY,
        durationType: D.DISTANCE,
        durationValue: 12500,
        targets: [],
      },
    ];
    const text = serializeWorkoutText(steps, run);
    expect(text).toBe('- Steady 55min\n- 1h15\n- 30mtr\n- Steady 12.5km');
    expect(only(text).map((step) => step.durationValue)).toEqual([
      3300, 4500, 30, 12500,
    ]);
  });
});
