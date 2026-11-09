import { planSessionDayOffset } from './plan-session-day';

describe('planSessionDayOffset', () => {
  it('keeps sessions on or after the start day in place', () => {
    // Week starting on a Monday: Tuesday is the next day, Monday the same day
    expect(planSessionDayOffset(2, 1)).toBe(1);
    expect(planSessionDayOffset(1, 1)).toBe(0);
  });

  it('puts Sunday at the end of a week that starts on Monday', () => {
    expect(planSessionDayOffset(0, 1)).toBe(6);
  });

  it('never places a session before the start of the week', () => {
    for (let start = 0; start < 7; start++) {
      for (let day = 0; day < 7; day++) {
        const offset = planSessionDayOffset(day, start);
        expect(offset).toBeGreaterThanOrEqual(0);
        expect(offset).toBeLessThan(7);
        expect((start + offset) % 7).toBe(day);
      }
    }
  });
});
