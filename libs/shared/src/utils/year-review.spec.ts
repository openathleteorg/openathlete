import { describe, expect, it } from 'vitest';

import { isYearReviewSeen, yearReviewYear } from './year-review';

// Local dates: the window follows the athlete's calendar, whatever the
// time zone the tests run in
const on = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour);

describe('yearReviewYear', () => {
  it('opens on 10 December, at midnight', () => {
    expect(yearReviewYear(on(2026, 12, 9, 23))).toBeNull();
    expect(yearReviewYear(on(2026, 12, 10, 0))).toBe(2026);
  });

  it('shows the current year until 31 December', () => {
    expect(yearReviewYear(on(2026, 12, 24))).toBe(2026);
    expect(yearReviewYear(on(2026, 12, 31, 23))).toBe(2026);
  });

  it('keeps showing the year that ended until 2 January', () => {
    expect(yearReviewYear(on(2027, 1, 1, 0))).toBe(2026);
    expect(yearReviewYear(on(2027, 1, 2, 23))).toBe(2026);
  });

  it('closes on 3 January', () => {
    expect(yearReviewYear(on(2027, 1, 3, 0))).toBeNull();
  });

  it('stays hidden the rest of the year', () => {
    expect(yearReviewYear(on(2026, 11, 18))).toBeNull();
    expect(yearReviewYear(on(2027, 6, 15))).toBeNull();
  });

  it('comes back every year', () => {
    expect(yearReviewYear(on(2027, 12, 10))).toBe(2027);
    expect(yearReviewYear(on(2028, 1, 2))).toBe(2027);
  });
});

describe('isYearReviewSeen', () => {
  it('counts an opening of the same season, January included', () => {
    expect(isYearReviewSeen(on(2026, 12, 12), 2026)).toBe(true);
    expect(isYearReviewSeen(on(2027, 1, 2), 2026)).toBe(true);
  });

  it('forgets last year’s opening, even in its first days of January', () => {
    expect(isYearReviewSeen(on(2025, 12, 20), 2026)).toBe(false);
    expect(isYearReviewSeen(on(2026, 1, 2), 2026)).toBe(false);
    expect(isYearReviewSeen(null, 2026)).toBe(false);
  });
});
