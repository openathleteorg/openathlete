import { describe, expect, it } from 'vitest';

import { formatDayTotal } from './day-total';
import { WeekTotals } from './week-summary';

const totals = (
  duration: [number, number],
  distance: [number, number],
): WeekTotals => ({
  duration: { done: duration[0], planned: duration[1] },
  distance: { done: distance[0], planned: distance[1] },
  elevation: { done: 0, planned: 0 },
  sessions: { done: 0, missed: 0, pending: 0 },
});

describe('day total', () => {
  it('shows done over planned', () => {
    expect(formatDayTotal(totals([2700, 3900], [9000, 12000]), 'en')).toBe(
      '45min / 1h05 · 9 / 12 km',
    );
  });

  it('shows what there is when only one side exists', () => {
    expect(formatDayTotal(totals([0, 3600], [0, 0]), 'en')).toBe('1h');
    expect(formatDayTotal(totals([1800, 0], [5500, 0]), 'fr')).toBe(
      '30min · 5,5 km',
    );
  });

  it('is empty on a rest day', () => {
    expect(formatDayTotal(totals([0, 0], [0, 0]), 'en')).toBe('');
  });
});
