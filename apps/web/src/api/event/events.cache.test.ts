import { describe, expect, it } from 'vitest';

import {
  ActivityEvent,
  EVENT_TYPE,
  Event,
  SPORT_TYPE,
  TrainingEvent,
} from '@openathlete/shared';

import {
  linkActivityInEvents,
  shiftEventsInCache,
  unlinkActivityInEvents,
} from './events.cache';

const run = {
  eventId: 10,
  eventActivityId: 110,
  type: EVENT_TYPE.ACTIVITY,
  sport: SPORT_TYPE.RUNNING,
} as ActivityEvent;

const session = (eventId: number, relatedActivity?: ActivityEvent) =>
  ({
    eventId,
    type: EVENT_TYPE.TRAINING,
    sport: SPORT_TYPE.RUNNING,
    relatedActivity,
    relatedActivityId: relatedActivity?.eventActivityId ?? null,
  }) as TrainingEvent;

const relatedOf = (events: Event[], eventId: number) =>
  (events.find((event) => event.eventId === eventId) as TrainingEvent)
    .relatedActivity?.eventId;

describe('linking an activity in the cached events', () => {
  it('moves the activity to the session it is dropped on', () => {
    const events = linkActivityInEvents(
      [run, session(1, run), session(2)],
      2,
      10,
    );
    expect(relatedOf(events, 1)).toBeUndefined();
    expect(relatedOf(events, 2)).toBe(10);
    expect((events[2] as TrainingEvent).relatedActivityId).toBe(110);
  });

  it('leaves the cache alone without the activity', () => {
    const events = [session(1), session(2)];
    expect(linkActivityInEvents(events, 2, 10)).toBe(events);
  });

  it('unlinks the activity of a session', () => {
    const events = unlinkActivityInEvents([run, session(1, run)], 1);
    expect(relatedOf(events, 1)).toBeUndefined();
    expect((events[1] as TrainingEvent).relatedActivityId).toBeNull();
  });
});

describe('moving events in the cached events', () => {
  it('moves the chosen events by calendar days, at the same local time', () => {
    const tempo = {
      ...session(1),
      startDate: new Date(2026, 9, 24, 7),
      endDate: new Date(2026, 9, 24, 8),
    } as TrainingEvent;
    const other = { ...session(2), startDate: new Date(2026, 9, 24, 9) };

    const [moved, still] = shiftEventsInCache([tempo, other], [1], 7);

    // Across the end of summer time in Europe and America
    expect(moved.startDate).toEqual(new Date(2026, 9, 31, 7));
    expect(moved.endDate).toEqual(new Date(2026, 9, 31, 8));
    expect(still).toBe(other);
  });
});
