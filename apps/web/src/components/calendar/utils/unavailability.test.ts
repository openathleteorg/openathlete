import { describe, expect, it } from 'vitest';

import {
  ActivityEvent,
  Cycle,
  EVENT_TYPE,
  Event,
  NoteEvent,
  SPORT_TYPE,
  TrainingEvent,
} from '@openathlete/shared';

import { daysAfter, sessionsDuring } from './unavailability';

// Local dates: a trip from Thursday 15 to Saturday 17 October 2026
const trip = {
  cycleId: 1,
  startDate: new Date(2026, 9, 15),
  endDate: new Date(2026, 9, 17, 23, 59, 59, 999),
} as Cycle;

const session = (eventId: number, day: number, done = false) =>
  ({
    eventId,
    type: EVENT_TYPE.TRAINING,
    sport: SPORT_TYPE.RUNNING,
    startDate: new Date(2026, 9, day, 18),
    relatedActivity: done
      ? { eventId: 9, movingTime: 0, distance: 0 }
      : undefined,
  }) as TrainingEvent;

describe('sessions during a period without training', () => {
  it('takes the sessions still to do from its first to its last day', () => {
    const events: Event[] = [
      session(1, 14),
      session(2, 15),
      session(3, 16, true),
      session(4, 17),
      session(5, 18),
      {
        eventId: 6,
        type: EVENT_TYPE.NOTE,
        startDate: new Date(2026, 9, 16),
      } as NoteEvent,
      {
        eventId: 7,
        type: EVENT_TYPE.ACTIVITY,
        startDate: new Date(2026, 9, 16),
      } as ActivityEvent,
    ];
    expect(sessionsDuring(events, trip).map((event) => event.eventId)).toEqual([
      2, 4,
    ]);
  });

  it('moves them by the length of the period, so they land after it', () => {
    expect(daysAfter(trip)).toBe(3);
  });
});
