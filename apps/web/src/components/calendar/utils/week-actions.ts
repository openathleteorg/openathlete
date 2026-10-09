import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { canBulkDeleteWorkout } from './bulk-delete';
import { isPlannedEvent } from './compliance';

/** Planned sessions, races and notes of the local week starting `weekStart` */
export function weekPlan(events: Event[], weekStart: Date): Event[] {
  const start = startOfDay(weekStart);
  const end = addDays(start, 7);
  return events.filter(
    (event) =>
      event.type !== EVENT_TYPE.ACTIVITY &&
      event.startDate >= start &&
      event.startDate < end,
  );
}

/**
 * What a cut or a shift moves: a done session stays with its activity, so
 * only the plan still to do (and notes) moves.
 */
export function movablePlan(plan: Event[]): Event[] {
  return plan.filter(
    (event) => !isPlannedEvent(event) || !event.relatedActivity,
  );
}

/** What "delete the week's sessions" removes, as the bulk deletion does */
export function deletablePlan(plan: Event[]): Event[] {
  return plan.filter(canBulkDeleteWorkout);
}

/** Calendar days between two week starts, whatever DST does in between */
export function weekOffsetDays(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from);
}

/** A copy or cut week waiting to be pasted */
export interface WeekClipboard {
  mode: 'copy' | 'cut';
  weekStart: Date;
  eventIds: Event['eventId'][];
}
