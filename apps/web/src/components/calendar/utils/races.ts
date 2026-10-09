import { addDays, differenceInCalendarWeeks, startOfDay } from 'date-fns';

import { CompetitionEvent, EVENT_TYPE, Event } from '@openathlete/shared';

export interface RaceCountdown {
  race: CompetitionEvent;
  /** Weeks from the given week to the race's week */
  weeks: number;
}

/**
 * The next A race after the week starting `weekStart`, counted in weeks
 * (Monday to Sunday), for the countdown of the weeks leading to it. Null for
 * past weeks, the race's own week and when no A race is planned.
 */
export function nextRaceCountdown(
  events: Event[],
  weekStart: Date,
  today: Date = new Date(),
): RaceCountdown | null {
  const weekEnd = addDays(startOfDay(weekStart), 7);
  if (weekEnd <= startOfDay(today)) return null;

  const race = events
    .filter(
      (event): event is CompetitionEvent =>
        event.type === EVENT_TYPE.COMPETITION &&
        event.priority === 'A' &&
        event.startDate >= weekEnd,
    )
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
  if (!race) return null;

  return {
    race,
    weeks: differenceInCalendarWeeks(race.startDate, weekStart, {
      weekStartsOn: 1,
    }),
  };
}
