import { MetricType } from '@openathlete/database';

import {
  mapSuuntoActivitySamples,
  mapSuuntoDailyStatistics,
  mapSuuntoRecovery,
  mapSuuntoSleep,
  suuntoLocalDay,
} from './suunto-health.mapper';

const valuesOf = (
  metrics: { type: MetricType; date: Date; value: number }[],
  type: MetricType,
) =>
  Object.fromEntries(
    metrics
      .filter((metric) => metric.type === type)
      .map((metric) => [metric.date.toISOString().slice(0, 10), metric.value]),
  );

describe('suuntoLocalDay', () => {
  it('keeps the local date of a timestamp written with its offset', () => {
    expect(suuntoLocalDay('2024-12-10T00:50:00.000+02:00')).toBe('2024-12-10');
  });
});

describe('mapSuuntoDailyStatistics', () => {
  it('saves no steps for a day without data, rather than zero', () => {
    const metrics = mapSuuntoDailyStatistics([
      {
        Name: 'stepcount',
        Aggregation: 'sum',
        Sources: [
          {
            Name: 'watch',
            Samples: [
              { TimeISO8601: '2026-10-26T00:00:00.000+01:00', Value: null },
              { TimeISO8601: '2026-10-27T00:00:00.000+01:00', Value: '4617' },
            ],
          },
        ],
      },
      {
        Name: 'energyconsumption',
        Aggregation: 'sum',
        Sources: [
          {
            Name: 'watch',
            Samples: [
              { TimeISO8601: '2026-10-27T00:00:00.000+01:00', Value: 8368000 },
            ],
          },
        ],
      },
    ]);

    expect(valuesOf(metrics, MetricType.DAILY_STEPS)).toEqual({
      '2026-10-27': 4617,
    });
    expect(valuesOf(metrics, MetricType.DAILY_CALORIES)).toEqual({
      '2026-10-27': 2000,
    });
  });
});

describe('mapSuuntoActivitySamples', () => {
  it('leaves out the day the request starts in, which is incomplete', () => {
    const metrics = mapSuuntoActivitySamples(
      [
        {
          timestamp: '2026-10-26T18:00:00.000+01:00',
          entryData: { HR: 120 },
        },
        {
          timestamp: '2026-10-27T08:00:00.000+01:00',
          entryData: { HR: 60, HRExt: { Min: 48, Max: 70 }, SpO2: 0.97 },
        },
        {
          timestamp: '2026-10-27T08:10:00.000+01:00',
          entryData: { HR: 80, HRExt: { Min: 75, Max: 95 }, SpO2: 0.95 },
        },
      ],
      Date.parse('2026-10-26T17:00:00.000Z'),
    );

    expect(valuesOf(metrics, MetricType.HR_AVG_DAILY)).toEqual({
      '2026-10-27': 70,
    });
    expect(valuesOf(metrics, MetricType.HR_MIN_DAILY)).toEqual({
      '2026-10-27': 48,
    });
    expect(valuesOf(metrics, MetricType.HR_MAX_DAILY)).toEqual({
      '2026-10-27': 95,
    });
    expect(valuesOf(metrics, MetricType.PULSE_OX_AVG)).toEqual({
      '2026-10-27': 96,
    });
    expect(metrics.some((m) => m.type === MetricType.DAILY_STEPS)).toBe(false);
  });

  it('keeps the next day when the first day of the request has no data', () => {
    const metrics = mapSuuntoActivitySamples(
      [{ timestamp: '2026-10-27T08:00:00.000+01:00', entryData: { HR: 60 } }],
      Date.parse('2026-10-26T10:00:00.000Z'),
    );

    expect(valuesOf(metrics, MetricType.HR_AVG_DAILY)).toEqual({
      '2026-10-27': 60,
    });
  });
});

describe('mapSuuntoSleep', () => {
  it('dates the night by its wake-up day and keeps naps apart', () => {
    const metrics = mapSuuntoSleep([
      {
        timestamp: '2026-10-26T23:29:00.000+01:00',
        entryData: {
          DeepSleepDuration: 3600,
          LightSleepDuration: 18000,
          REMSleepDuration: 5400,
          Duration: 30600,
          SleepOnsetLatencyDuration: 1200,
          WakeAfterSleepOnsetDuration: 600,
          SleepQualityScore: 81,
          AvgHRV: 50,
          AvgHRVSampleCount: 100,
          IsNap: false,
          BedtimeStart: '2026-10-26T23:29:00.000+01:00',
          BedtimeEnd: '2026-10-27T07:59:00.000+01:00',
        },
      },
      {
        timestamp: '2026-10-27T14:00:00.000+01:00',
        entryData: {
          Duration: 1800,
          LightSleepDuration: 1800,
          SleepQualityScore: 40,
          IsNap: true,
          BedtimeEnd: '2026-10-27T14:30:00.000+01:00',
        },
      },
    ]);

    expect(valuesOf(metrics, MetricType.SLEEP_DURATION)).toEqual({
      '2026-10-27': 7.5,
    });
    expect(valuesOf(metrics, MetricType.SLEEP_AWAKE_DURATION)).toEqual({
      '2026-10-27': 0.5,
    });
    expect(valuesOf(metrics, MetricType.SLEEP_SCORE)).toEqual({
      '2026-10-27': 81,
    });
    expect(valuesOf(metrics, MetricType.NAP_DURATION)).toEqual({
      '2026-10-27': 0.5,
    });
    expect(valuesOf(metrics, MetricType.HRV_LAST_NIGHT_AVG)).toEqual({
      '2026-10-27': 50,
    });
    // Sleep heart rate is not the day's heart rate
    expect(metrics.some((m) => m.type === MetricType.HR_AVG_DAILY)).toBe(false);
  });

  it('adds up a night split into several segments', () => {
    const segment = (start: string, end: string, deep: number) => ({
      timestamp: start,
      entryData: {
        DeepSleepDuration: deep,
        LightSleepDuration: 7200,
        REMSleepDuration: 0,
        Duration: deep + 7200,
        IsNap: false,
        BedtimeEnd: end,
      },
    });
    const metrics = mapSuuntoSleep([
      segment(
        '2026-10-26T23:00:00.000+01:00',
        '2026-10-27T02:00:00.000+01:00',
        3600,
      ),
      segment(
        '2026-10-27T03:00:00.000+01:00',
        '2026-10-27T07:00:00.000+01:00',
        7200,
      ),
    ]);

    expect(valuesOf(metrics, MetricType.SLEEP_DURATION)).toEqual({
      '2026-10-27': 7,
    });
  });

  it('counts the whole night when the watch sends only deep sleep', () => {
    // A Suunto 9 Baro night: 7:24 asleep, of which 2:26 deep, no other stage
    const metrics = mapSuuntoSleep([
      {
        timestamp: '2026-11-02T21:53:00.000+01:00',
        entryData: {
          DeepSleepDuration: 8760,
          Duration: 26640,
          WakeAfterSleepOnsetDuration: 0,
          SleepQualityScore: 70,
          IsNap: false,
          BedtimeStart: '2026-11-02T21:53:00.000+01:00',
          BedtimeEnd: '2026-11-03T05:17:00.000+01:00',
        },
      },
    ]);

    expect(valuesOf(metrics, MetricType.SLEEP_DURATION)).toEqual({
      '2026-11-03': 7.4,
    });
    expect(valuesOf(metrics, MetricType.SLEEP_DEEP_DURATION)).toEqual({
      '2026-11-03': 2.43,
    });
    expect(
      metrics.some((m) => m.type === MetricType.SLEEP_LIGHT_DURATION),
    ).toBe(false);
  });
});

describe('mapSuuntoRecovery', () => {
  it('turns the day resources into energy charged and drained', () => {
    const metrics = mapSuuntoRecovery([
      {
        timestamp: '2026-10-27T01:00:00.000+01:00',
        entryData: { Balance: 0.4 },
      },
      {
        timestamp: '2026-10-27T07:00:00.000+01:00',
        entryData: { Balance: 0.9 },
      },
      {
        timestamp: '2026-10-27T20:00:00.000+01:00',
        entryData: { Balance: 0.3 },
      },
    ]);

    expect(valuesOf(metrics, MetricType.BODY_BATTERY_CHARGED)).toEqual({
      '2026-10-27': 50,
    });
    expect(valuesOf(metrics, MetricType.BODY_BATTERY_DRAINED)).toEqual({
      '2026-10-27': 60,
    });
  });
});
