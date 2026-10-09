import { describe, expect, it } from 'vitest';

import {
  ActivityEvent,
  EVENT_TYPE,
  Event,
  NoteEvent,
  SPORT_TYPE,
  TrainingEvent,
} from '@openathlete/shared';

import {
  deletablePlan,
  movablePlan,
  weekOffsetDays,
  weekPlan,
} from './week-actions';

// Local dates: run with several TZ values in CI
const MONDAY = new Date(2026, 9, 19);
const at = (day: number, hour = 7) => new Date(2026, 9, day, hour);

const run = {
  eventId: 10,
  type: EVENT_TYPE.ACTIVITY,
  sport: SPORT_TYPE.RUNNING,
  startDate: at(20),
} as ActivityEvent;
const session = (eventId: number, day: number, done = false) =>
  ({
    eventId,
    type: EVENT_TYPE.TRAINING,
    sport: SPORT_TYPE.RUNNING,
    startDate: at(day),
    relatedActivity: done
      ? { eventId: 10, movingTime: 0, distance: 0 }
      : undefined,
  }) as TrainingEvent;
const note = {
  eventId: 5,
  type: EVENT_TYPE.NOTE,
  startDate: at(25, 21),
} as NoteEvent;

const ids = (events: Event[]) => events.map((event) => event.eventId);

describe('week actions', () => {
  const events: Event[] = [
    run,
    session(1, 18), // Sunday before
    session(2, 20, true),
    session(3, 22),
    note,
    session(4, 26, false), // next Monday
  ];

  it('takes the plan of the local week, Monday to Sunday, without activities', () => {
    expect(ids(weekPlan(events, MONDAY))).toEqual([2, 3, 5]);
  });

  it('moves only what is still to do, and notes', () => {
    expect(ids(movablePlan(weekPlan(events, MONDAY)))).toEqual([3, 5]);
  });

  it('deletes only the sessions still to do', () => {
    expect(ids(deletablePlan(weekPlan(events, MONDAY)))).toEqual([3]);
  });

  it('counts calendar days between weeks across DST', () => {
    // Summer time ends in Europe and America in between
    expect(weekOffsetDays(MONDAY, new Date(2026, 9, 26))).toBe(7);
    expect(weekOffsetDays(MONDAY, new Date(2026, 10, 2))).toBe(14);
    expect(weekOffsetDays(MONDAY, new Date(2026, 9, 12))).toBe(-7);
  });
});
