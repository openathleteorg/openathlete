import { describe, expect, it } from 'vitest';

import { yearPageStart } from '../calendar/utils/year-page';
import { yearsSince } from './use-statistics-filters';

describe('yearsSince', () => {
  const now = new Date(2026, 10, 5, 12);

  it('lists every year back to the first activity, newest first', () => {
    expect(yearsSince(new Date(2020, 5, 1), now)).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021, 2020,
    ]);
  });

  it('offers the last ten years until the first activity is known', () => {
    expect(yearsSince(undefined, now)).toHaveLength(10);
    expect(yearsSince(null, now).at(-1)).toBe(2017);
  });

  it('keeps the current year when the first activity is in the future', () => {
    expect(yearsSince(new Date(2027, 0, 1), now)).toEqual([2026]);
  });
});

describe('yearPageStart', () => {
  it('pages years by twelve', () => {
    expect(yearPageStart(2026)).toBe(2016);
    expect(yearPageStart(2016)).toBe(2016);
    expect(yearPageStart(2015)).toBe(2004);
  });
});
