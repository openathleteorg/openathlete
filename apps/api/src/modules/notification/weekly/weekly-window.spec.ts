import {
  SUPPORTER_BAR_EVERY,
  dueMonday,
  isStillTraining,
  showsSupporterBar,
  weekIndex,
  weeksAround,
} from './weekly-window';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe('dueMonday', () => {
  it('is due on Monday from 7:00 to 11:59, local time', () => {
    // 2026-11-23 is a Monday; Paris is UTC+1 in winter
    expect(dueMonday(new Date('2026-11-23T05:59:00Z'), 'Europe/Paris')).toBe(
      null,
    );
    expect(dueMonday(new Date('2026-11-23T06:00:00Z'), 'Europe/Paris')).toBe(
      '2026-11-23',
    );
    expect(dueMonday(new Date('2026-11-23T10:59:00Z'), 'Europe/Paris')).toBe(
      '2026-11-23',
    );
    expect(dueMonday(new Date('2026-11-23T11:00:00Z'), 'Europe/Paris')).toBe(
      null,
    );
  });

  it('follows the local day, not the UTC one', () => {
    // Monday 7:30 in Auckland is still Sunday in UTC
    expect(
      dueMonday(new Date('2026-11-22T18:30:00Z'), 'Pacific/Auckland'),
    ).toBe('2026-11-23');
    // Monday 7:30 UTC is Monday 2:30 in New York: too early
    expect(
      dueMonday(new Date('2026-11-23T07:30:00Z'), 'America/New_York'),
    ).toBe(null);
    expect(
      dueMonday(new Date('2026-11-23T12:30:00Z'), 'America/New_York'),
    ).toBe('2026-11-23');
  });

  it('is never due on another day', () => {
    expect(dueMonday(new Date('2026-11-24T07:30:00Z'), 'UTC')).toBe(null);
    expect(dueMonday(new Date('2026-11-22T07:30:00Z'), 'UTC')).toBe(null);
  });
});

describe('weeksAround', () => {
  it('runs from local Monday midnight to the next', () => {
    const weeks = weeksAround('2026-11-23', 'Europe/Paris');
    expect(weeks.past).toEqual({
      from: new Date('2026-11-15T23:00:00Z'),
      to: new Date('2026-11-22T23:00:00Z'),
    });
    expect(weeks.previous.to).toEqual(weeks.past.from);
    expect(weeks.next).toEqual({
      from: new Date('2026-11-22T23:00:00Z'),
      to: new Date('2026-11-29T23:00:00Z'),
    });
  });

  it('lasts 167 hours over the spring change of time', () => {
    // Paris goes to summer time on Sunday 2026-03-29
    const { past } = weeksAround('2026-03-30', 'Europe/Paris');
    expect(past.from).toEqual(new Date('2026-03-22T23:00:00Z'));
    expect(past.to).toEqual(new Date('2026-03-29T22:00:00Z'));
    expect(past.to.getTime() - past.from.getTime()).toBe(167 * HOUR);
  });

  it('lasts 169 hours over the autumn change of time', () => {
    // New York goes back to winter time on Sunday 2026-11-01
    const { past } = weeksAround('2026-11-02', 'America/New_York');
    expect(past.from).toEqual(new Date('2026-10-26T04:00:00Z'));
    expect(past.to).toEqual(new Date('2026-11-02T05:00:00Z'));
    expect(past.to.getTime() - past.from.getTime()).toBe(169 * HOUR);
  });
});

describe('showsSupporterBar', () => {
  const mondays = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      new Date(Date.parse('2026-01-05T00:00:00Z') + i * 7 * DAY)
        .toISOString()
        .slice(0, 10),
    );

  it('counts one more week each Monday, across years of 53 weeks', () => {
    // 2026 has an ISO week 53
    const weeks = mondays(60).map(weekIndex);
    weeks.slice(1).forEach((week, i) => expect(week).toBe(weeks[i] + 1));
  });

  it('shows one week in four at most, never two weeks running', () => {
    for (const userId of [1, 2, 3, 4, 57]) {
      const shown = mondays(104).map((monday) =>
        showsSupporterBar(monday, userId),
      );
      expect(shown.filter(Boolean)).toHaveLength(104 / SUPPORTER_BAR_EVERY);
      shown.forEach((on, i) => {
        if (on) expect(shown.slice(i + 1, i + 4)).not.toContain(true);
      });
    }
  });

  it('spreads people over the weeks', () => {
    const monday = '2026-11-23';
    const shown = [1, 2, 3, 4].filter((id) => showsSupporterBar(monday, id));
    expect(shown).toHaveLength(1);
  });
});

describe('isStillTraining', () => {
  const now = new Date('2026-11-23T07:00:00Z');
  const ago = (days: number) => new Date(now.getTime() - days * DAY);

  it('keeps writing within three weeks of an activity or a session', () => {
    expect(isStillTraining(now, ago(20), null)).toBe(true);
    expect(isStillTraining(now, null, ago(20))).toBe(true);
    // A session planned for the week to come
    expect(isStillTraining(now, ago(60), ago(-3))).toBe(true);
  });

  it('stops after three weeks of nothing', () => {
    expect(isStillTraining(now, ago(22), ago(25))).toBe(false);
    expect(isStillTraining(now, null, null)).toBe(false);
  });
});
