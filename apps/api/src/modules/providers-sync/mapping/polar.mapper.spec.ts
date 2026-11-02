import { MetricType, SportType } from '@openathlete/database';

import type { PolarExercise } from '../../core/types/connector';
import {
  mapPolarDailyActivity,
  mapPolarNightlyRecharge,
  mapPolarPhysicalInfo,
  mapPolarSleep,
  mapPolarSport,
  parsePolarDuration,
  polarActivityName,
  polarStartDate,
} from './polar.mapper';

const exercise = (fields: Partial<PolarExercise>): PolarExercise => ({
  id: '2AC312F',
  start_time: '2008-10-13T10:40:02',
  ...fields,
});

describe('Polar mapper', () => {
  it('reads ISO durations, decimal seconds included', () => {
    expect(parsePolarDuration('PT2H44M')).toBe(9840);
    expect(parsePolarDuration('PT1H2M3.5S')).toBe(3724);
    expect(parsePolarDuration('PT45S')).toBe(45);
    expect(parsePolarDuration(undefined)).toBe(0);
  });

  it('turns the local start time into UTC with its offset', () => {
    expect(
      polarStartDate(exercise({ start_time_utc_offset: 180 })).toISOString(),
    ).toBe('2008-10-13T07:40:02.000Z');
    expect(
      polarStartDate(exercise({ start_time_utc_offset: -300 })).toISOString(),
    ).toBe('2008-10-13T15:40:02.000Z');
  });

  it('prefers the detailed sport over the generic one', () => {
    expect(
      mapPolarSport(
        exercise({ sport: 'OTHER', detailed_sport_info: 'TRAIL_RUNNING' }),
      ),
    ).toBe(SportType.TRAIL_RUNNING);
    expect(mapPolarSport(exercise({ sport: 'RUNNING' }))).toBe(
      SportType.RUNNING,
    );
    expect(
      mapPolarSport(exercise({ detailed_sport_info: 'MOUNTAIN_BIKING' })),
    ).toBe(SportType.MOUNTAIN_BIKE_RIDE);
    expect(mapPolarSport(exercise({ sport: 'OTHER' }))).toBe(SportType.OTHER);
  });

  it('names an activity after its sport', () => {
    expect(
      polarActivityName(exercise({ detailed_sport_info: 'ROAD_RUNNING' })),
    ).toBe('Road running');
    expect(polarActivityName(exercise({ sport: 'OTHER' }))).toBe(
      'Polar activity',
    );
  });

  it('maps a day of activity from the documented sample', () => {
    const metrics = mapPolarDailyActivity([
      {
        start_time: '2025-08-13T08:15:30',
        active_duration: 'PT3H11M',
        daily_activity: 89.1,
        calories: 2500,
        active_calories: 1500,
        steps: 8823,
        distance_from_steps: 4590.53,
      },
    ]);
    const value = (type: MetricType) =>
      metrics.find((metric) => metric.type === type)?.value;

    expect(metrics[0].date.toISOString()).toBe('2025-08-13T00:00:00.000Z');
    expect(value(MetricType.DAILY_STEPS)).toBe(8823);
    expect(value(MetricType.DAILY_DISTANCE)).toBeCloseTo(4.59, 2);
    // daily_activity is a percentage of the goal, not a duration
    expect(value(MetricType.DAILY_ACTIVE_MINUTES)).toBe(191);
  });

  it('adds up sleep stages, in hours', () => {
    const metrics = mapPolarSleep([
      {
        date: '2020-01-01',
        light_sleep: 3600,
        deep_sleep: 1800,
        rem_sleep: 1800,
        unrecognized_sleep_stage: 0,
        total_interruption_duration: 900,
        sleep_score: 80,
      },
    ]);
    const value = (type: MetricType) =>
      metrics.find((metric) => metric.type === type)?.value;

    expect(value(MetricType.SLEEP_DURATION)).toBe(2);
    expect(value(MetricType.SLEEP_DEEP_DURATION)).toBe(0.5);
    expect(value(MetricType.SLEEP_AWAKE_DURATION)).toBe(0.25);
    expect(value(MetricType.SLEEP_SCORE)).toBe(80);
  });

  it('reads HRV from the Nightly Recharge', () => {
    expect(
      mapPolarNightlyRecharge([
        {
          date: '2020-01-01',
          heart_rate_variability_avg: 28,
          breathing_rate_avg: 14.1,
        },
      ]).map(({ type, value }) => [type, value]),
    ).toEqual([
      [MetricType.HRV_LAST_NIGHT_AVG, 28],
      [MetricType.SLEEP_RESPIRATION_AVG, 14.1],
    ]);
  });

  it('dates the physical info by its last change', () => {
    const metrics = mapPolarPhysicalInfo(
      {
        weight: 70.5,
        maximum_heart_rate: 190,
        resting_heart_rate: 60,
        modified: '2024-06-10T12:00:00Z',
      },
      new Date('2026-01-01T00:00:00Z'),
    );
    expect(metrics.map(({ type }) => type)).toEqual([
      MetricType.WEIGHT,
      MetricType.HR_MAX,
      MetricType.HR_REST,
    ]);
    expect(metrics[0].date.toISOString()).toBe('2024-06-10T00:00:00.000Z');
  });
});
