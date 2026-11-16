import { describe, expect, it } from 'vitest';

import { StatisticsIntensityDto } from '@openathlete/shared';

import { intensityRows } from './intensity-data';

const bucket = (
  period: string,
  low: number,
  middle: number,
  high: number,
  partial = false,
): StatisticsIntensityDto['buckets'][number] => ({
  period,
  partial,
  low,
  middle,
  high,
  steadyCount: 0,
  efficiency: null,
  decoupling: null,
});

describe('intensityRows', () => {
  const buckets = [
    // 3 hours, 80% easy
    bucket('2026-11-02', 8640, 1080, 1080),
    // 10 hours, 80% easy: the same shares, much more easy work
    bucket('2026-11-09', 28800, 3600, 3600, true),
  ];

  it('gives the shares of each week in percent', () => {
    expect(intensityRows(buckets, 'share')).toEqual([
      { period: '2026-11-02', partial: false, low: 80, middle: 10, high: 10 },
      { period: '2026-11-09', partial: true, low: 80, middle: 10, high: 10 },
    ]);
  });

  it('gives the hours of each week, which tell the two weeks apart', () => {
    expect(intensityRows(buckets, 'hours')).toEqual([
      {
        period: '2026-11-02',
        partial: false,
        low: 2.4,
        middle: 0.3,
        high: 0.3,
      },
      { period: '2026-11-09', partial: true, low: 8, middle: 1, high: 1 },
    ]);
  });

  it('keeps an empty week at zero', () => {
    const [shares] = intensityRows([bucket('2026-11-16', 0, 0, 0)], 'share');
    const [hours] = intensityRows([bucket('2026-11-16', 0, 0, 0)], 'hours');
    expect([shares.low, shares.middle, shares.high]).toEqual([0, 0, 0]);
    expect([hours.low, hours.middle, hours.high]).toEqual([0, 0, 0]);
  });
});
