import { describe, expect, it, vi } from 'vitest';

import type { TrainingPlanContent } from '@openathlete/shared';

import {
  athleteName,
  planFileName,
  sessionsInOrder,
  toDateKey,
  weeksOf,
} from './plan-format';

vi.mock('@/paraglide/runtime', () => ({ getLocale: () => 'en' }));

const session = (dayOfWeek: number, name: string) => ({
  dayOfWeek,
  name,
  sport: 'RUNNING',
  description: '',
});

const content = {
  cycles: [
    {
      name: 'Base',
      weeks: [
        { weekNumber: 1, sessions: [] },
        { weekNumber: 2, sessions: [] },
      ],
    },
    { name: 'Build', weeks: [{ weekNumber: 1, sessions: [] }] },
  ],
} as unknown as TrainingPlanContent;

describe('plan format', () => {
  it('reads a day as the calendar shows it, not as UTC', () => {
    // 23:30 local on the 6th stays the 6th, whatever the time zone
    expect(toDateKey(new Date(2026, 0, 6, 23, 30))).toBe('2026-01-06');
    expect(toDateKey(new Date(2026, 0, 6, 0, 15))).toBe('2026-01-06');
  });

  it('numbers the weeks through the cycles', () => {
    expect(
      weeksOf(content).map(({ number, cycleName }) => [number, cycleName]),
    ).toEqual([
      [1, 'Base'],
      [2, 'Base'],
      [3, 'Build'],
    ]);
  });

  it('lists a week from Monday to Sunday', () => {
    const week = {
      weekNumber: 1,
      sessions: [
        session(0, 'Sunday'),
        session(3, 'Wednesday'),
        session(1, 'Monday'),
      ],
    } as unknown as TrainingPlanContent['cycles'][number]['weeks'][number];

    expect(sessionsInOrder(week).map((item) => item.name)).toEqual([
      'Monday',
      'Wednesday',
      'Sunday',
    ]);
  });

  it('names an exported file after the plan', () => {
    expect(planFileName('VO2max Advanced (Watt)')).toBe(
      'VO2max-Advanced-Watt.json',
    );
    expect(planFileName('🏃')).toBe('plan.json');
  });

  it('names an athlete, also without a last name', () => {
    expect(athleteName({ user: { firstName: 'Ada', lastName: null } })).toBe(
      'Ada',
    );
  });
});
