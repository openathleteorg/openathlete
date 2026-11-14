import { PLAN_ANCHOR } from '@openathlete/shared';

import {
  currentPlanWeek,
  isInRange,
  planRange,
  planSessionDateKey,
  weekStartOfDateKey,
  weekdayOfDateKey,
} from './plan-dates';

const MONDAY = 1;
const SUNDAY = 0;

describe('plan dates', () => {
  it('reads the weekday of a date whatever the machine time zone', () => {
    // 2026-11-02 is a Monday
    expect(weekdayOfDateKey('2026-11-02')).toBe(1);
    expect(weekdayOfDateKey('2026-11-08')).toBe(0);
  });

  it('finds the start of a week on Monday or Sunday', () => {
    expect(weekStartOfDateKey('2026-11-04', MONDAY)).toBe('2026-11-02');
    expect(weekStartOfDateKey('2026-11-02', MONDAY)).toBe('2026-11-02');
    expect(weekStartOfDateKey('2026-11-08', MONDAY)).toBe('2026-11-02');
    expect(weekStartOfDateKey('2026-11-04', SUNDAY)).toBe('2026-11-01');
  });

  it('starts a plan on the week of its start date', () => {
    const range = planRange(PLAN_ANCHOR.START, '2026-11-02', 13, MONDAY);
    expect(range).toEqual({
      firstWeekStart: '2026-11-02',
      startDate: '2026-11-02',
      endDate: '2027-01-31',
    });
    // Week 13's Sunday is the last day
    expect(planSessionDateKey(range, 12, 0, MONDAY)).toBe('2027-01-31');
  });

  it('drops the sessions before a start date chosen mid-week', () => {
    const range = planRange(PLAN_ANCHOR.START, '2026-11-04', 2, MONDAY);
    expect(range.firstWeekStart).toBe('2026-11-02');
    // Monday of week 1 falls before the start
    expect(isInRange(range, planSessionDateKey(range, 0, 1, MONDAY))).toBe(
      false,
    );
    expect(isInRange(range, planSessionDateKey(range, 0, 3, MONDAY))).toBe(
      true,
    );
  });

  it('ends a plan on race day, dropping what comes after it that week', () => {
    // Race on Saturday 2027-01-30
    const range = planRange(PLAN_ANCHOR.END, '2027-01-30', 3, MONDAY);
    expect(range.firstWeekStart).toBe('2027-01-11');
    expect(range.endDate).toBe('2027-01-30');
    const sunday = planSessionDateKey(range, 2, 0, MONDAY);
    expect(sunday).toBe('2027-01-31');
    expect(isInRange(range, sunday)).toBe(false);
  });

  it('keeps the website plans starting on whatever day the athlete starts', () => {
    // Weeks start on the start date itself, as the import always did
    const range = planRange(PLAN_ANCHOR.START, '2026-11-04', 1, 3);
    expect(range.firstWeekStart).toBe('2026-11-04');
    // A Monday session belongs to the end of that week
    expect(planSessionDateKey(range, 0, 1, 3)).toBe('2026-11-09');
  });

  it('tells which week of a plan today is', () => {
    expect(currentPlanWeek('2026-11-02', 13, '2026-11-01')).toBeNull();
    expect(currentPlanWeek('2026-11-02', 13, '2026-11-02')).toBe(1);
    expect(currentPlanWeek('2026-11-02', 13, '2026-11-13')).toBe(2);
    expect(currentPlanWeek('2026-11-02', 13, '2027-01-31')).toBe(13);
    expect(currentPlanWeek('2026-11-02', 13, '2027-02-01')).toBeNull();
  });
});
