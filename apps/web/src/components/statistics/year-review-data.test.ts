import { describe, expect, it } from 'vitest';

import { yearReview } from './year-review-data';

const day = (date: string, movingTime = 3600) => ({
  date,
  movingTime,
  distance: 10000,
  elevationGain: 100,
  count: 1,
});

describe('yearReview', () => {
  const review = yearReview(
    [
      day('2025-12-31'),
      day('2026-01-05'),
      day('2026-01-06'),
      day('2026-01-07', 7200),
      day('2026-03-01'),
    ],
    2026,
  );

  it('adds the days of the year up', () => {
    expect(review).toMatchObject({
      movingTime: 18000,
      distance: 40000,
      elevationGain: 400,
      activities: 4,
      activeDays: 4,
    });
  });

  it('counts the longest run of consecutive days', () => {
    expect(review.longestStreak).toBe(3);
  });

  it('finds the biggest day and week', () => {
    expect(review.biggestDay?.date).toBe('2026-01-07');
    expect(review.biggestWeek).toEqual({
      start: '2026-01-05',
      movingTime: 14400,
    });
  });

  it('stays empty on a year without activity', () => {
    const empty = yearReview([], 2026);
    expect(empty.biggestDay).toBeNull();
    expect(empty.biggestWeek).toBeNull();
    expect(empty.longestStreak).toBe(0);
  });
});
