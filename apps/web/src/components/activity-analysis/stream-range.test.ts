import { describe, expect, it } from 'vitest';

import {
  computeRangeStats,
  defaultXAxis,
  indexRange,
  routeRange,
  xSeries,
} from './stream-range';

const range = (n: number, f: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => f(i));

describe('indexRange', () => {
  const series = [0, 10, 20, 30, 40];

  it('finds the samples inside the bounds', () => {
    expect(indexRange(series, [10, 30])).toEqual([1, 3]);
    expect(indexRange(series, [5, 35])).toEqual([1, 3]);
    expect(indexRange(series, [-5, 100])).toEqual([0, 4]);
  });

  it('is null when no sample is inside', () => {
    expect(indexRange(series, [11, 19])).toBeNull();
    expect(indexRange([], [0, 10])).toBeNull();
  });
});

describe('routeRange', () => {
  const chart = { time: [0, 0, 0, 0], distance: [0, 20, 40, 60] };
  const route = {
    latlng: Array.from({ length: 7 }, (_, i) => [40, 1 + i / 10000]),
    time: [0, 0, 0, 0, 0, 0, 0],
    distance: [0, 10, 20, 30, 40, 50, 60],
  };

  it('locates a climb by distance when GPX timestamps are all zero', () => {
    expect(routeRange(chart, route, 1, 2)).toEqual([2, 4]);
  });

  it('prefers recording time when a stop repeats a distance', () => {
    const timedChart = { ...chart, time: [0, 3, 5, 6] };
    const timedRoute = {
      ...route,
      time: [0, 1, 2, 3, 4, 5, 6],
      distance: [0, 10, 20, 20, 30, 40, 60],
    };
    expect(routeRange(timedChart, timedRoute, 1, 2)).toEqual([3, 5]);
  });

  it('skips the highlight when neither timeline nor distance can locate it', () => {
    expect(
      routeRange(chart, { ...route, distance: undefined }, 1, 2),
    ).toBeNull();
  });
});

describe('xSeries', () => {
  it('plots against distance, or time when distance does not move', () => {
    const stream = { time: [0, 1, 2], distance: [0, 3, 6] };
    expect(defaultXAxis(stream)).toBe('distance');
    expect(xSeries(stream, 'distance')).toBe(stream.distance);
    expect(xSeries(stream, 'time')).toBe(stream.time);

    const indoor = { time: [0, 1, 2], distance: [0, 0, 0] };
    expect(defaultXAxis(indoor)).toBe('time');
    expect(xSeries(indoor, 'distance')).toBe(indoor.time);
  });
});

describe('computeRangeStats', () => {
  // Ten minutes at 3 m/s, one sample every 10 s, climbing 1 m per sample
  const stream = {
    time: range(61, (i) => i * 10),
    distance: range(61, (i) => i * 30),
    heartrate: range(61, (i) => (i < 30 ? 140 : 160)),
    watts: range(61, (i) => (i % 2 ? 0 : 300)),
    cadence: range(61, (i) => (i === 5 ? 0 : 90)),
    altitude: range(61, (i) => 100 + i),
  };

  it('sums and averages the selected samples', () => {
    const stats = computeRangeStats(stream, [0, 60])!;
    expect(stats.durationSec).toBe(600);
    expect(stats.distanceM).toBe(1800);
    expect(stats.averageSpeed).toBe(3);
    expect(stats.averageHeartrate).toBe(150);
    expect(stats.maxHeartrate).toBe(160);
    // Zero watts count, so the average is half of 300
    expect(stats.averagePower).toBe(150);
    expect(stats.maxPower).toBe(300);
    // A stop at cadence 0 doesn't drag the average down
    expect(stats.averageCadence).toBe(90);
    expect(stats.elevationGainM).toBe(60);
    expect(stats.elevationLossM).toBe(0);
  });

  it('reads only the selected part', () => {
    const stats = computeRangeStats(stream, [30, 60])!;
    expect(stats.durationSec).toBe(300);
    expect(stats.averageHeartrate).toBe(160);
  });

  it('weights samples by the time until the next one', () => {
    const stats = computeRangeStats(
      { time: [0, 10, 100], heartrate: [100, 200, 200] },
      [0, 2],
    )!;
    // 10 s at 100 then 90 s at 200
    expect(stats.averageHeartrate).toBe(190);
    expect(stats.distanceM).toBeUndefined();
  });

  it('ignores altitude noise below a metre', () => {
    const stats = computeRangeStats(
      { time: [0, 1, 2, 3, 4], altitude: [100, 100.4, 99.8, 100.3, 103] },
      [0, 4],
    )!;
    expect(stats.elevationGainM).toBe(3);
    expect(stats.elevationLossM).toBe(0);
  });

  it('has nothing to say about a single sample', () => {
    expect(computeRangeStats(stream, [5, 5])).toBeNull();
    expect(computeRangeStats({ heartrate: [1, 2] }, [0, 1])).toBeNull();
  });
});
