import { describe, expect, it } from 'vitest';

import { countStaleMetrics, getDominantSport } from './insights';

describe('getDominantSport', () => {
  it('names the sport that takes most of the time', () => {
    const hiking = { name: 'hiking', movingTime: 42 };
    const result = getDominantSport([
      hiking,
      { name: 'running', movingTime: 33 },
      { name: 'cycling', movingTime: 25 },
    ]);
    expect(result).toEqual({ sport: hiking, share: 0.42 });
  });

  it('says nothing when time is evenly spread', () => {
    expect(
      getDominantSport([
        { movingTime: 34 },
        { movingTime: 33 },
        { movingTime: 33 },
      ]),
    ).toBeNull();
  });

  it('says nothing about a single sport or an empty period', () => {
    expect(getDominantSport([{ movingTime: 10 }])).toBeNull();
    expect(getDominantSport([{ movingTime: 0 }, { movingTime: 0 }])).toBeNull();
  });
});

describe('countStaleMetrics', () => {
  const now = new Date('2026-10-30T12:00:00Z');

  it('counts values older than six months and skips missing ones', () => {
    expect(
      countStaleMetrics(
        [
          { date: '2025-11-12' },
          { date: new Date('2026-10-21') },
          null,
          undefined,
        ],
        now,
      ),
    ).toBe(1);
  });
});
