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
  unlinkActivityInEvents,
} from './related-activity.cache';

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
