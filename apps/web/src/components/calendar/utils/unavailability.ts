import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

import { Cycle, Event } from '@openathlete/shared';

import { deletablePlan } from './week-actions';

/** Sessions still to do between the cycle's first and last day */
export function sessionsDuring(events: Event[], cycle: Cycle): Event[] {
  const start = startOfDay(new Date(cycle.startDate));
  const end = addDays(startOfDay(new Date(cycle.endDate)), 1);
  return deletablePlan(
    events.filter((event) => event.startDate >= start && event.startDate < end),
  );
}

/** Days to move sessions by so they land after the period, in order */
export function daysAfter(cycle: Cycle): number {
  return (
    differenceInCalendarDays(
      new Date(cycle.endDate),
      new Date(cycle.startDate),
    ) + 1
  );
}
