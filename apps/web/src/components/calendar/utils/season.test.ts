import { describe, expect, it } from 'vitest';

import {
  COMPETITION_PRIORITY,
  Cycle,
  EVENT_TYPE,
  SPORT_TYPE,
  SeasonEvent,
} from '@openathlete/shared';

import { buildSeasonWeeks, seasonCycleSegments, seasonRange } from './season';

const event = (partial: Partial<SeasonEvent>): SeasonEvent => ({
  eventId: 1,
  type: EVENT_TYPE.TRAINING,
  name: 'Run',
  startDate: new Date(2026, 9, 14, 18),
  sport: SPORT_TYPE.RUNNING,
  plannedSeconds: null,
  plannedMeters: null,
  doneSeconds: null,
  doneMeters: null,
  done: false,
  priority: null,
  ...partial,
});

const cycle = (cycleId: number, start: Date, end: Date) =>
  ({ cycleId, name: `C${cycleId}`, startDate: start, endDate: end }) as Cycle;

describe('season', () => {
  it('covers whole weeks from the month of the start, for 6 months', () => {
    const { start, end } = seasonRange(new Date(2026, 9, 20), 6);
    // October 1st 2026 is a Thursday
    expect(start).toEqual(new Date(2026, 8, 28));
    // March 31st 2027 is a Wednesday: its week ends on April 4th
    expect(end).toEqual(new Date(2027, 3, 4, 23, 59, 59, 999));
    expect(buildSeasonWeeks(new Date(2026, 9, 1), 6, [])).toHaveLength(27);
  });

  it('sums planned and done volume by week and lists the races', () => {
    const weeks = buildSeasonWeeks(new Date(2026, 9, 1), 6, [
      event({ plannedSeconds: 3600, plannedMeters: 10000 }),
      event({
        type: EVENT_TYPE.ACTIVITY,
        doneSeconds: 3300,
        doneMeters: 9500,
        startDate: new Date(2026, 9, 18, 9),
      }),
      event({
        eventId: 2,
        type: EVENT_TYPE.COMPETITION,
        name: '10 km',
        plannedSeconds: 2700,
        priority: COMPETITION_PRIORITY.A,
        startDate: new Date(2026, 9, 25, 10),
      }),
    ]);
    const week = weeks.find((w) => w.start.getDate() === 12)!;
    expect(week).toMatchObject({
      plannedSeconds: 3600,
      doneSeconds: 3300,
      plannedMeters: 10000,
      doneMeters: 9500,
      races: [],
    });
    const raceWeek = weeks.find((w) => w.start.getDate() === 19)!;
    expect(raceWeek.races.map((race) => race.name)).toEqual(['10 km']);
  });

  it('puts overlapping cycles in separate lanes', () => {
    const weeks = buildSeasonWeeks(new Date(2026, 9, 1), 6, []);
    const { lanes, byWeek } = seasonCycleSegments(
      [
        cycle(1, new Date(2026, 9, 5), new Date(2026, 10, 1, 23, 59)),
        cycle(2, new Date(2026, 9, 19), new Date(2026, 9, 25, 23, 59)),
        cycle(3, new Date(2026, 10, 2), new Date(2026, 10, 29, 23, 59)),
      ],
      weeks,
    );
    expect(lanes).toBe(2);
    const octoberWeeks = byWeek.slice(1, 6);
    expect(
      octoberWeeks[0].map((s) => [s.cycle.cycleId, s.lane, s.isStart]),
    ).toEqual([[1, 0, true]]);
    expect(octoberWeeks[2].map((s) => [s.cycle.cycleId, s.lane])).toEqual([
      [1, 0],
      [2, 1],
    ]);
    // The third starts after the first ends: back in the first lane
    expect(
      octoberWeeks[4].map((s) => [s.cycle.cycleId, s.lane, s.isStart]),
    ).toEqual([[3, 0, true]]);
  });

  it('keeps cycles that meet mid-week in separate lanes', () => {
    const weeks = buildSeasonWeeks(new Date(2026, 9, 1), 6, []);
    const { lanes, byWeek } = seasonCycleSegments(
      [
        // Ends on a Wednesday, the next starts on the Thursday
        cycle(1, new Date(2026, 9, 5), new Date(2026, 9, 21, 23, 59)),
        cycle(2, new Date(2026, 9, 22), new Date(2026, 10, 1, 23, 59)),
      ],
      weeks,
    );
    expect(lanes).toBe(2);
    expect(byWeek[3].map((s) => [s.cycle.cycleId, s.lane, s.isStart])).toEqual([
      [1, 0, false],
      [2, 1, true],
    ]);
  });
});
