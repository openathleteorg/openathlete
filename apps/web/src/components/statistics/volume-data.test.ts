import { describe, expect, it } from 'vitest';

import { SPORT_TYPE, StatisticsVolumeDto } from '@openathlete/shared';

import {
  OTHER_SPORTS,
  bucketTotals,
  chartTotals,
  volumeChartData,
} from './volume-data';

const volume = (sport: SPORT_TYPE, distance: number) => ({
  sport,
  movingTime: 3600,
  distance,
  elevationGain: 100,
  count: 1,
});
const bucket = (
  period: string,
  sports: ReturnType<typeof volume>[],
  partial = false,
): StatisticsVolumeDto['buckets'][number] => ({ period, partial, sports });

describe('volumeChartData', () => {
  it('gives display units and keeps empty and partial buckets', () => {
    const { rows, series } = volumeChartData(
      [
        bucket('2026-01-05', [volume(SPORT_TYPE.RUNNING, 10000)]),
        bucket('2026-01-12', [], true),
      ],
      'distance',
    );
    expect(series).toEqual([SPORT_TYPE.RUNNING]);
    expect(rows).toEqual([
      { period: '2026-01-05', partial: false, RUNNING: 10 },
      { period: '2026-01-12', partial: true },
    ]);
  });

  it('ranks the sports and sums the ones beyond four', () => {
    const sports = [
      SPORT_TYPE.RUNNING,
      SPORT_TYPE.CYCLING,
      SPORT_TYPE.SWIMMING,
      SPORT_TYPE.HIKING,
      SPORT_TYPE.ROWING,
    ];
    const { rows, series } = volumeChartData(
      [
        bucket(
          '2026-01-05',
          sports.map((sport, index) => volume(sport, 5000 - index * 1000)),
        ),
      ],
      'distance',
    );
    expect(series).toEqual([...sports.slice(0, 3), OTHER_SPORTS]);
    expect(rows[0][OTHER_SPORTS]).toBe(3);
  });
});

describe('chartTotals', () => {
  it('gives the total of each bucket in display units', () => {
    expect(
      chartTotals(
        [bucket('2026-01-05', [volume(SPORT_TYPE.RUNNING, 10000)])],
        'distance',
      ),
    ).toEqual([10]);
  });
});

describe('bucketTotals', () => {
  it('adds the sports of each bucket', () => {
    expect(
      bucketTotals(
        [
          bucket('2026-01-05', [
            volume(SPORT_TYPE.RUNNING, 10000),
            volume(SPORT_TYPE.CYCLING, 30000),
          ]),
          bucket('2026-01-12', []),
        ],
        'distance',
      ),
    ).toEqual([40000, 0]);
  });
});
