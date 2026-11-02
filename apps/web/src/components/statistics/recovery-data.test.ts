import { describe, expect, it } from 'vitest';

import { recoveryTrend } from './recovery-data';

const day = (date: string, hrv: number | null) => ({
  date,
  hrv,
  restingHeartrate: 50,
  sleepHours: 7.5,
});

describe('recoveryTrend', () => {
  it('averages the logarithm over the last seven days', () => {
    const points = recoveryTrend(
      [day('2026-03-01', 50), day('2026-03-02', 60), day('2026-03-03', 70)],
      '2026-03-03',
    );
    expect(points).toHaveLength(1);
    expect(points[0].hrv).toBeCloseTo(
      (Math.log(50) + Math.log(60) + Math.log(70)) / 3,
      5,
    );
  });

  it('wants three nights in the week', () => {
    const [point] = recoveryTrend(
      [day('2026-03-02', 60), day('2026-03-03', 70)],
      '2026-03-03',
    );
    expect(point.hrv).toBeNull();
  });

  it('forgets nights older than a week', () => {
    const [point] = recoveryTrend(
      [
        day('2026-02-20', 10),
        day('2026-03-01', 50),
        day('2026-03-02', 50),
        day('2026-03-03', 50),
      ],
      '2026-03-03',
    );
    expect(point.hrv).toBeCloseTo(Math.log(50), 5);
  });

  it('keeps other figures on a night without HRV', () => {
    const [point] = recoveryTrend([day('2026-03-03', null)], '2026-03-03');
    expect(point).toMatchObject({ hrv: null, restingHeartrate: 50 });
  });
});
