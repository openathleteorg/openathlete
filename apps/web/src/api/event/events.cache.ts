import { addDays } from 'date-fns';

import { EVENT_TYPE, Event } from '@openathlete/shared';

const isPlanned = (event: Event) =>
  event.type === EVENT_TYPE.TRAINING || event.type === EVENT_TYPE.COMPETITION;

/**
 * Cached events once the activity is linked to the session, as the API does
 * it: an activity belongs to a single session, so it leaves any other one.
 * Unchanged when the activity is not in this list.
 */
export function linkActivityInEvents(
  events: Event[],
  sessionId: Event['eventId'],
  activityId: Event['eventId'],
): Event[] {
  const activity = events.find(
    (event) =>
      event.type === EVENT_TYPE.ACTIVITY && event.eventId === activityId,
  );
  if (!activity || activity.type !== EVENT_TYPE.ACTIVITY) return events;

  return events.map((event) => {
    if (!isPlanned(event)) return event;
    if (event.eventId === sessionId) {
      return {
        ...event,
        relatedActivity: activity,
        relatedActivityId: activity.eventActivityId,
      };
    }
    if (event.relatedActivity?.eventId === activityId) {
      return { ...event, relatedActivity: undefined, relatedActivityId: null };
    }
    return event;
  });
}

/** Cached events once the session's activity is unlinked */
export function unlinkActivityInEvents(
  events: Event[],
  sessionId: Event['eventId'],
): Event[] {
  return events.map((event) =>
    isPlanned(event) && event.eventId === sessionId
      ? { ...event, relatedActivity: undefined, relatedActivityId: null }
      : event,
  );
}

/**
 * Cached events once moved by `offsetDays` calendar days, at the same local
 * time, as the API moves them.
 */
export function shiftEventsInCache(
  events: Event[],
  eventIds: Event['eventId'][],
  offsetDays: number,
): Event[] {
  const moving = new Set(eventIds);
  return events.map((event) =>
    moving.has(event.eventId)
      ? {
          ...event,
          startDate: addDays(event.startDate, offsetDays),
          endDate: addDays(event.endDate, offsetDays),
        }
      : event,
  );
}
