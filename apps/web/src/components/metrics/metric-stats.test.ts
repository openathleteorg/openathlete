import { describe, expect, it } from 'vitest';

import { METRIC_TYPE } from '@openathlete/shared';

import {
  MetricPoint,
  analyzeMetric,
  formatMetricValue,
  toMetricDay,
} from './metric-stats';

const series = (values: number[]): MetricPoint[] =>
  values.map((value, index) => ({
    day: new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
    value,
  }));

const steady = (length: number, around: number) =>
  Array.from({ length }, (_, index) => around + (index % 2 ? 2 : -2));

describe('analyzeMetric', () => {
  it('hides a zero from a metric a watch failed to measure', () => {
    const analysis = analyzeMetric(
      METRIC_TYPE.HRV_LAST_NIGHT_AVG,
      series([...steady(20, 100), 0, 100]),
    );

    expect(analysis.hiddenDays).toEqual(new Set(['2026-01-21']));
    expect(analysis.min).toBe(98);
  });

  it('keeps a zero where it is a real value', () => {
    const analysis = analyzeMetric(
      METRIC_TYPE.DAILY_STEPS,
      series([0, 5000, 0, 8000]),
    );

    expect(analysis.hiddenDays.size).toBe(0);
    expect(analysis.min).toBe(0);
  });

  it('hides a glitch far outside the series', () => {
    const analysis = analyzeMetric(
      METRIC_TYPE.HR_AVG_DAILY,
      series([...steady(20, 42), 193, 42]),
    );

    expect([...analysis.hiddenDays]).toEqual(['2026-01-21']);
    expect(analysis.max).toBe(44);
  });

  it('waits for 14 values before naming a baseline', () => {
    expect(
      analyzeMetric(METRIC_TYPE.WEIGHT, series(steady(13, 60))).baseline,
    ).toBeNull();
    expect(
      analyzeMetric(METRIC_TYPE.WEIGHT, series(steady(14, 60))).baseline,
    ).not.toBeNull();
  });

  it('reads a rising resting heart rate as worse, a rising HRV as better', () => {
    const rising = series([...steady(40, 50), ...steady(7, 60)]);

    expect(analyzeMetric(METRIC_TYPE.HR_REST, rising).status).toBe('worse');
    expect(analyzeMetric(METRIC_TYPE.HRV_LAST_NIGHT_AVG, rising).status).toBe(
      'better',
    );
  });

  it('gives no verdict on a metric with no good direction', () => {
    const rising = series([...steady(40, 50), ...steady(7, 60)]);

    expect(analyzeMetric(METRIC_TYPE.WEIGHT, rising).status).toBe('off_range');
  });

  it('stays usual within day to day noise', () => {
    expect(
      analyzeMetric(METRIC_TYPE.HR_REST, series(steady(30, 50))).status,
    ).toBe('usual');
  });

  it('has nothing to say without values', () => {
    const analysis = analyzeMetric(METRIC_TYPE.VMA, []);

    expect(analysis.last).toBeNull();
    expect(analysis.average7).toBeNull();
    expect(analysis.status).toBeNull();
  });
});

describe('formatMetricValue', () => {
  it('writes durations in hours and minutes', () => {
    expect(formatMetricValue(METRIC_TYPE.SLEEP_DURATION, 8.15)).toBe('8 h 09');
  });

  it('carries minutes over into the next hour', () => {
    expect(formatMetricValue(METRIC_TYPE.SLEEP_DURATION, 4.999)).toBe('5 h 00');
  });

  it('drops the noise of large values', () => {
    expect(formatMetricValue(METRIC_TYPE.DAILY_CALORIES, 242.16)).toBe('242');
  });
});

describe('toMetricDay', () => {
  it('keeps the stored calendar day in every time zone', () => {
    expect(toMetricDay('2026-10-21T00:00:00.000Z')).toBe('2026-10-21');
  });
});
