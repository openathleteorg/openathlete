import { describe, expect, it } from 'vitest';

import { SPORT_TYPE } from '@openathlete/shared';

import { buildChartRows, sportTrackOrder } from './tracks';

const range = <T>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i));

describe('sportTrackOrder', () => {
  it('reads a ride by its power and a run by its pace', () => {
    expect(sportTrackOrder(SPORT_TYPE.CYCLING)[0]).toBe('power');
    expect(sportTrackOrder(SPORT_TYPE.RUNNING).slice(0, 2)).toEqual([
      'speed',
      'gap',
    ]);
    expect(sportTrackOrder(SPORT_TYPE.ROWING)).not.toContain('altitude');
  });
});

describe('buildChartRows', () => {
  const run = {
    time: range(11, (i) => i * 10),
    distance: range(11, (i) => i * 30),
    heartrate: range(11, () => 150),
    cadence: range(11, () => 85),
    altitude: range(11, (i) => 200 + i),
  };

  it('lines up every track on the chosen axis', () => {
    const { rows, tracks } = buildChartRows(
      run,
      SPORT_TYPE.RUNNING,
      'distance',
    );
    expect(tracks).toEqual(['speed', 'heartrate', 'altitude', 'cadence']);
    expect(rows).toHaveLength(11);
    expect(rows[2]).toMatchObject({ index: 2, x: 60, time: 20 });

    const byTime = buildChartRows(run, SPORT_TYPE.RUNNING, 'time');
    expect(byTime.rows[2].x).toBe(20);
  });

  it('takes speed from the distance stream, as the summary does', () => {
    const { rows } = buildChartRows(run, SPORT_TYPE.RUNNING, 'distance');
    expect(rows.every((row) => Math.abs((row.speed ?? 0) - 3) < 1e-9)).toBe(
      true,
    );
  });

  it('uses recorded speed through GPS gaps and breaks at a timer pause', () => {
    const stream = {
      time: [0, 1, 15, 16, 48, 49],
      latlng: [[45, 5], [], [], [], [45, 5], [45, 5]],
      speed: [3, 2, 0, 3, 2, 4],
      timerPaused: [0, 0, 0, 1, 0, 0],
    };
    const raw = buildChartRows(stream, SPORT_TYPE.RUNNING, 'time', {
      smooth: false,
    });
    expect(raw.rows.map((row) => row.speed)).toEqual([3, 2, 0, null, 2, 4]);

    const smoothed = buildChartRows(stream, SPORT_TYPE.RUNNING, 'time');
    expect(smoothed.rows[3].speed).toBeNull();
    expect(smoothed.rows[4].speed).toBe(2);
  });

  it('falls back to distance when a recorded speed sample is missing', () => {
    const { rows } = buildChartRows(
      { time: [0, 1, 2], distance: [0, 3, 6], speed: [2, null, 4] },
      SPORT_TYPE.RUNNING,
      'distance',
      { smooth: false },
    );
    expect(rows.map((row) => row.speed)).toEqual([2, 3, 4]);
  });

  it('counts running cadence in steps per minute', () => {
    expect(
      buildChartRows(run, SPORT_TYPE.RUNNING, 'time').rows[0].cadence,
    ).toBe(170);
    expect(
      buildChartRows(run, SPORT_TYPE.CYCLING, 'time').rows[0].cadence,
    ).toBe(85);
  });

  it('leaves out tracks with nothing in them', () => {
    const { tracks } = buildChartRows(
      { ...run, watts: range(11, () => 0) },
      SPORT_TYPE.CYCLING,
      'time',
    );
    expect(tracks).not.toContain('power');
    expect(tracks).toContain('heartrate');
  });

  it('computes speed from GPS points without a distance stream', () => {
    // 0.001° of latitude is about 111 m, every 10 s
    const { rows, tracks } = buildChartRows(
      {
        time: range(5, (i) => i * 10),
        latlng: range(5, (i) => [45 + i * 0.001, 5]),
      },
      SPORT_TYPE.RUNNING,
      'time',
    );
    expect(tracks).toContain('speed');
    expect(rows[3].speed).toBeCloseTo(11.1, 1);
  });

  it('draws gaps where heart rate dropped out', () => {
    const { rows } = buildChartRows(
      { time: [0, 1, 2], heartrate: [140, 0, 142] },
      SPORT_TYPE.STRENGTH,
      'time',
    );
    expect(rows.map((row) => row.heartrate)).toEqual([140, null, 142]);
  });

  it('is empty without a time stream', () => {
    expect(buildChartRows(undefined, SPORT_TYPE.RUNNING, 'time')).toEqual({
      rows: [],
      tracks: [],
    });
  });
});
