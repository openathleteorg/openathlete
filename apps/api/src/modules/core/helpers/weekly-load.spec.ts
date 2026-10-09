import { buildWeeklyLoads } from './weekly-load';

const utc = (day: number, hour = 0) => new Date(Date.UTC(2026, 9, day, hour)); // October 2026, Monday the 5th

describe('buildWeeklyLoads', () => {
  const today = utc(14, 10); // Wednesday of the week of the 12th

  const build = (
    entries: { date: Date; value: number }[],
    sessions: { startDate: Date; load: number | null; done: boolean }[],
  ) =>
    buildWeeklyLoads({ from: utc(5), to: utc(25), entries, sessions, today });

  it('returns every UTC week of the range, Monday to Sunday', () => {
    const weeks = build([], []);
    expect(weeks.map((week) => week.weekStart)).toEqual([
      utc(5),
      utc(12),
      utc(19),
    ]);
    expect(weeks[0].weekEnd).toEqual(utc(11));
    expect(weeks.map((week) => week.projected)).toEqual([false, true, true]);
  });

  it('splits done, still planned and missed sessions', () => {
    const [past, current, next] = build(
      [
        { date: utc(6), value: 80 }, // done, linked below
        { date: utc(13), value: 50 },
      ],
      [
        { startDate: utc(6, 7), load: 70, done: true },
        { startDate: utc(8, 7), load: 60, done: false }, // missed
        { startDate: utc(13, 7), load: 40, done: true },
        { startDate: utc(12, 7), load: 30, done: false }, // missed this week
        { startDate: utc(14, 18), load: 45, done: false }, // tonight
        { startDate: utc(20, 7), load: 90, done: false },
        { startDate: utc(21, 7), load: null, done: false }, // no duration
      ],
    );

    expect(past).toMatchObject({ actual: 80, planned: 130, estimated: 0 });
    expect(current).toMatchObject({ actual: 50, planned: 115, estimated: 45 });
    expect(next).toMatchObject({ actual: 0, planned: 90, estimated: 90 });
  });

  it('projects fitness from the sessions still planned, not the missed ones', () => {
    const withPlan = build(
      [{ date: utc(6), value: 100 }],
      [
        { startDate: utc(20, 7), load: 100, done: false },
        { startDate: utc(8, 7), load: 500, done: false }, // missed
      ],
    );
    const withoutPlan = build([{ date: utc(6), value: 100 }], []);

    // The missed session changes nothing
    expect(withPlan[0].fitness).toEqual(withoutPlan[0].fitness);
    expect(withPlan[1].fitness).toEqual(withoutPlan[1].fitness);
    // The planned one raises fatigue more than fitness: form drops
    const form = ({ fitness }: (typeof withPlan)[number]) =>
      fitness.ctl - fitness.atl;
    expect(withPlan[2].fitness.ctl).toBeGreaterThan(withoutPlan[2].fitness.ctl);
    expect(form(withPlan[2])).toBeLessThan(form(withoutPlan[2]));
  });

  it('ignores loads outside the range', () => {
    const weeks = build(
      [{ date: utc(30), value: 100 }],
      [{ startDate: utc(1), load: 100, done: false }],
    );
    expect(weeks.every((week) => week.actual === 0 && week.planned === 0)).toBe(
      true,
    );
  });
});
