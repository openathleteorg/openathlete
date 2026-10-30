import { describe, expect, it } from 'vitest';

import { BestRecordDto, RECORD_TYPE, SPORT_TYPE } from '@openathlete/shared';

import {
  criticalFit,
  criticalSwimSpeed,
  parseSwimTime,
} from './critical-model';

const base = {
  recordId: 1,
  date: new Date(),
  eventId: null,
  activityName: null,
};
const run = (distance: number, seconds: number): BestRecordDto => ({
  ...base,
  type: RECORD_TYPE.SPEED,
  distance,
  duration: null,
  value: seconds,
});
const power = (duration: number, watts: number): BestRecordDto => ({
  ...base,
  type: RECORD_TYPE.POWER,
  distance: null,
  duration,
  value: watts,
});

/** Efforts exactly on a speed of 4 m/s with 200 m above it */
const perfect = [1000, 1500, 3000, 5000].map((distance) =>
  run(distance, (distance - 200) / 4),
);

describe('criticalFit', () => {
  it('finds the critical speed and its reserve', () => {
    const fit = criticalFit(perfect, SPORT_TYPE.RUNNING)!;
    expect(fit.kind).toBe('speed');
    expect(fit.critical).toBeCloseTo(4, 5);
    expect(fit.reserve).toBeCloseTo(200, 3);
    expect(fit.margin).toBeCloseTo(0, 5);
  });

  it('widens the interval when efforts disagree', () => {
    const fit = criticalFit(
      [run(1000, 200), run(1500, 330), run(3000, 700), run(5000, 1190)],
      SPORT_TYPE.RUNNING,
    )!;
    expect(fit.margin).toBeGreaterThan(0.01);
  });

  it('finds the critical power from work', () => {
    const fit = criticalFit(
      [120, 300, 600, 1200].map((t) => power(t, 250 + 20000 / t)),
      SPORT_TYPE.CYCLING,
    )!;
    expect(fit.kind).toBe('power');
    expect(fit.critical).toBeCloseTo(250, 5);
    expect(fit.reserve).toBeCloseTo(20000, 2);
  });

  it('leaves out efforts outside the model', () => {
    const fit = criticalFit(
      [run(400, 60), ...perfect, run(21097.5, 6000)],
      SPORT_TYPE.RUNNING,
    )!;
    expect(fit.efforts).toHaveLength(4);
  });

  it('needs three efforts', () => {
    expect(criticalFit(perfect.slice(0, 2), SPORT_TYPE.RUNNING)).toBeNull();
  });

  it('stays out of the sports it was not tested in', () => {
    expect(criticalFit(perfect, SPORT_TYPE.TRAIL_RUNNING)).toBeNull();
    expect(criticalFit(perfect, SPORT_TYPE.SWIMMING)).toBeNull();
  });
});

describe('criticalSwimSpeed', () => {
  it('reads the slope between the two distances', () => {
    expect(criticalSwimSpeed(180, 380)).toBe(1);
  });

  it('refuses times that cannot be a test', () => {
    expect(criticalSwimSpeed(380, 180)).toBeNull();
    expect(criticalSwimSpeed(0, 180)).toBeNull();
  });
});

describe('parseSwimTime', () => {
  it('reads minutes and seconds, or seconds', () => {
    expect(parseSwimTime('3:05')).toBe(185);
    expect(parseSwimTime('185')).toBe(185);
  });

  it('refuses anything else', () => {
    expect(parseSwimTime('3:75')).toBeNull();
    expect(parseSwimTime('fast')).toBeNull();
    expect(parseSwimTime('')).toBeNull();
  });
});
