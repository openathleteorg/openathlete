import { CalendarDayForm, SPORT_TYPE } from '@openathlete/shared';

import {
  YearActivity,
  YearRecord,
  buildYearReview,
  dayLevels,
  favoriteMinute,
  fitnessCurve,
  highlight,
  longestStreak,
  persona,
  recordHighlights,
  sportTotals,
} from './year-review';

const activity = (overrides: Partial<YearActivity> = {}): YearActivity => ({
  day: '2026-03-02',
  minute: 7 * 60,
  weekday: 1,
  sport: SPORT_TYPE.RUNNING,
  name: 'Morning run',
  startDate: new Date('2026-03-02T06:00:00Z'),
  duration: 3700,
  movingTime: 3600,
  distance: 10000,
  elevationGain: 50,
  averageHeartrate: 150,
  isRace: false,
  fromGarmin: false,
  ...overrides,
});

const record = (overrides: Partial<YearRecord>): YearRecord => ({
  family: 'RUN',
  type: 'SPEED',
  distance: 10000,
  duration: null,
  value: 2500,
  previous: 2600,
  date: new Date('2026-05-01T08:00:00Z'),
  ...overrides,
});

describe('dayLevels', () => {
  it('has one entry per day, leap years included', () => {
    expect(dayLevels([], 2026)).toHaveLength(365);
    expect(dayLevels([], 2028)).toHaveLength(366);
  });

  it('sums the day and ranks it against the athlete’s other days', () => {
    const levels = dayLevels(
      [
        activity({ day: '2026-01-01', movingTime: 600 }),
        activity({ day: '2026-01-02', movingTime: 1800 }),
        activity({ day: '2026-01-03', movingTime: 1800 }),
        activity({ day: '2026-01-03', movingTime: 1800 }),
        activity({ day: '2026-12-31', movingTime: 7200 }),
      ],
      2026,
    );
    expect(levels.slice(0, 4)).toEqual([1, 1, 2, 0]);
    expect(levels[364]).toBe(3);
  });
});

describe('longestStreak', () => {
  it('finds the longest run of active days, the first when tied', () => {
    const levels = new Array(365).fill(0);
    levels.fill(1, 10, 13);
    levels.fill(2, 152, 175);
    levels.fill(1, 300, 323);
    expect(longestStreak(levels, 2026)).toEqual({
      days: 23,
      start: '2026-06-02',
      end: '2026-06-24',
    });
  });

  it('is null for a year without activity', () => {
    expect(longestStreak(new Array(365).fill(0), 2026)).toBeNull();
  });
});

describe('favoriteMinute', () => {
  it('averages the starts of the busiest hour', () => {
    expect(
      favoriteMinute([
        activity({ minute: 6 * 60 + 30 }),
        activity({ minute: 6 * 60 + 50 }),
        activity({ minute: 18 * 60 }),
      ]),
    ).toBe(6 * 60 + 40);
    expect(favoriteMinute([])).toBeNull();
  });
});

describe('persona', () => {
  const kind = (activities: YearActivity[], activeDays = 100) =>
    persona(activities, sportTotals(activities), activeDays, 365).kind;

  it('names an early bird by the share of starts before 8', () => {
    const early = [
      ...Array.from({ length: 5 }, () => activity({ minute: 6 * 60 })),
      ...Array.from({ length: 5 }, () => activity({ minute: 17 * 60 })),
    ];
    expect(persona(early, sportTotals(early), 100, 365)).toEqual({
      kind: 'EARLY_BIRD',
      value: 0.5,
    });
  });

  it('prefers the time of day over the weekend', () => {
    const lunchOnSaturdays = Array.from({ length: 4 }, () =>
      activity({ minute: 12 * 60, weekday: 6 }),
    );
    expect(kind(lunchOnSaturdays)).toBe('LUNCH_BREAK');
  });

  it('spots an all-rounder by three sports that each count', () => {
    const sports = [
      SPORT_TYPE.RUNNING,
      SPORT_TYPE.CYCLING,
      SPORT_TYPE.SWIMMING,
    ].map((sport) => activity({ sport, minute: 17 * 60 }));
    expect(kind(sports)).toBe('ALL_ROUNDER');
  });

  it('falls back to a balanced athlete', () => {
    expect(kind([activity({ minute: 17 * 60, movingTime: 1800 })])).toBe(
      'BALANCED',
    );
  });
});

describe('fitnessCurve', () => {
  const day = (date: string, ctl: number, projected = false) =>
    ({ date, ctl, projected, load: 0, atl: 0, tsb: 0 }) as CalendarDayForm;

  it('keeps one point a week, the last day and the peak, done days only', () => {
    const form = [
      day('2025-12-31', 50),
      ...Array.from({ length: 10 }, (_, index) =>
        day(`2026-01-${String(index + 1).padStart(2, '0')}`, 40 + index),
      ),
      day('2026-01-11', 99, true),
    ];
    expect(fitnessCurve(form, 2026)).toEqual({
      points: [
        { date: '2026-01-01', ctl: 40 },
        { date: '2026-01-08', ctl: 47 },
        { date: '2026-01-10', ctl: 49 },
      ],
      peak: { date: '2026-01-10', ctl: 49 },
    });
  });

  it('is null without load', () => {
    expect(fitnessCurve([day('2026-01-01', 0)], 2026)).toBeNull();
  });
});

describe('highlight', () => {
  const marathon = activity({ name: 'Paris', distance: 42195, isRace: true });
  const tenK = activity({ distance: 10000, isRace: true });

  it('prefers a season goal on the calendar', () => {
    const result = highlight(
      [
        {
          name: 'Local 10k',
          priority: 'C',
          goalDuration: null,
          activity: tenK,
        },
        {
          name: 'Marathon de Paris',
          priority: 'A',
          goalDuration: 12000,
          activity: marathon,
        },
      ],
      [],
    );
    expect(result).toMatchObject({
      kind: 'RACE',
      name: 'Marathon de Paris',
      goalDuration: 12000,
    });
  });

  it('falls back to activities marked as races, then the longest outing', () => {
    expect(highlight([], [tenK, marathon])).toMatchObject({
      kind: 'RACE',
      distance: 42195,
    });
    const long = activity({ movingTime: 20000, name: 'Ventoux' });
    expect(highlight([], [activity(), long])).toMatchObject({
      kind: 'BIGGEST_OUTING',
      name: 'Ventoux',
    });
    expect(highlight([], [])).toBeNull();
  });
});

describe('recordHighlights', () => {
  it('shows beaten records first, the famous ones first, then firsts', () => {
    const result = recordHighlights([
      record({ distance: 5000, value: 1200, previous: 1250 }),
      record({ distance: 42195, value: 11900, previous: 12500 }),
      record({
        family: 'RIDE',
        type: 'POWER',
        distance: null,
        duration: 1200,
        value: 280,
        previous: 290,
      }),
      record({ family: 'SWIM', distance: 1500, value: 1660, previous: null }),
      record({ distance: 15000, value: 4000, previous: 4100 }),
    ]);
    expect(result.improved).toBe(3);
    expect(
      result.highlights.map(({ family, distance, duration }) => [
        family,
        distance ?? duration,
      ]),
    ).toEqual([
      ['RUN', 42195],
      ['RUN', 5000],
      ['SWIM', 1500],
    ]);
  });
});

describe('buildYearReview', () => {
  it('adds up the year and flags Garmin data', () => {
    const review = buildYearReview({
      year: 2026,
      firstName: 'Camille',
      activities: [
        activity(),
        activity({ day: '2026-03-03', fromGarmin: true }),
      ],
      races: [],
      records: [],
      form: [],
      plan: { planned: 3, done: 2 },
    });
    expect(review.totals).toEqual({
      distance: 20000,
      movingTime: 7200,
      elevationGain: 100,
      activities: 2,
      activeDays: 2,
    });
    expect(review.months[2].distance).toBe(20000);
    expect(review.plan).toBeNull();
    expect(review.garminSourced).toBe(true);
  });
});
