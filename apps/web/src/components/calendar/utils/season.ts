import { addDays, addMonths, startOfMonth, startOfWeek } from 'date-fns';

import { Cycle, EVENT_TYPE, SeasonEvent } from '@openathlete/shared';

import { getWeekKey } from './week';

export const SEASON_LENGTHS = [6, 12] as const;
export type SeasonLength = (typeof SEASON_LENGTHS)[number];

export interface PlannedDoneVolume {
  plannedSeconds: number;
  doneSeconds: number;
  plannedMeters: number;
  doneMeters: number;
}

export interface SeasonWeek extends PlannedDoneVolume {
  /** Local Monday, 00:00 */
  start: Date;
  /** Local Sunday, 23:59:59.999 */
  end: Date;
  /** Key of the weekly load summaries */
  key: string;
  races: SeasonEvent[];
}

/** Monday of the week holding the 1st of `month`, and the weeks of the season */
export function seasonRange(month: Date, length: SeasonLength) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const lastDay = addDays(addMonths(startOfMonth(month), length), -1);
  const end = addDays(startOfWeek(lastDay, { weekStartsOn: 1 }), 7);
  end.setMilliseconds(-1);
  return { start, end };
}

/**
 * One row per week of the season with its planned and done volume and its
 * races. A planned session counts as planned whether done or not; its
 * activity counts as done, as in the week summaries.
 */
export function buildSeasonWeeks(
  month: Date,
  length: SeasonLength,
  events: SeasonEvent[],
): SeasonWeek[] {
  const { start, end } = seasonRange(month, length);
  const weeks: SeasonWeek[] = [];
  for (let monday = start; monday < end; monday = addDays(monday, 7)) {
    const sunday = addDays(monday, 7);
    sunday.setMilliseconds(-1);
    weeks.push({
      start: monday,
      end: sunday,
      key: getWeekKey(monday),
      plannedSeconds: 0,
      doneSeconds: 0,
      plannedMeters: 0,
      doneMeters: 0,
      races: [],
    });
  }
  for (const event of events) {
    const date = new Date(event.startDate);
    const week = weeks.find((w) => date >= w.start && date <= w.end);
    if (!week) continue;
    if (event.type === EVENT_TYPE.ACTIVITY) {
      week.doneSeconds += event.doneSeconds ?? 0;
      week.doneMeters += event.doneMeters ?? 0;
    } else {
      week.plannedSeconds += event.plannedSeconds ?? 0;
      week.plannedMeters += event.plannedMeters ?? 0;
      if (event.type === EVENT_TYPE.COMPETITION) week.races.push(event);
    }
  }
  return weeks;
}

export interface SeasonCycleSegment {
  cycle: Cycle;
  lane: number;
  /** The cycle starts this week: its name goes here */
  isStart: boolean;
  isEnd: boolean;
}

/**
 * Cycles as vertical bars over the week rows. Overlapping cycles take
 * separate lanes, the earliest leftmost, so bars never cover each other.
 */
export function seasonCycleSegments(
  cycles: Cycle[],
  weeks: SeasonWeek[],
): { lanes: number; byWeek: SeasonCycleSegment[][] } {
  const sorted = [...cycles]
    .filter((cycle) => {
      const s = new Date(cycle.startDate);
      const e = new Date(cycle.endDate);
      return (
        weeks.length && e >= weeks[0].start && s <= weeks[weeks.length - 1].end
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  // A lane is free from the week after its last cycle ends: two cycles that
  // meet mid-week cannot share a row of that lane
  const laneEnds: Date[] = [];
  const laneOf = new Map<number, number>();
  for (const cycle of sorted) {
    const startWeek = startOfWeek(new Date(cycle.startDate), {
      weekStartsOn: 1,
    });
    let lane = laneEnds.findIndex((laneEnd) => laneEnd < startWeek);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = new Date(cycle.endDate);
    laneOf.set(cycle.cycleId, lane);
  }

  const byWeek = weeks.map((week) =>
    sorted
      .filter(
        (cycle) =>
          new Date(cycle.startDate) <= week.end &&
          new Date(cycle.endDate) >= week.start,
      )
      .map((cycle) => ({
        cycle,
        lane: laneOf.get(cycle.cycleId)!,
        isStart: new Date(cycle.startDate) >= week.start,
        isEnd: new Date(cycle.endDate) <= week.end,
      })),
  );
  return { lanes: Math.max(1, laneEnds.length), byWeek };
}
