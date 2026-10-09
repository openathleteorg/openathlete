import { EVENT_TYPE, Event } from '@openathlete/shared';

import { getCompliance, isPlannedEvent } from './compliance';

export interface PlannedDone {
  planned: number;
  done: number;
}

export interface WeekTotals {
  duration: PlannedDone;
  distance: PlannedDone;
  elevation: PlannedDone;
  /** Planned sessions by outcome; activities done off-plan are not counted */
  sessions: { done: number; missed: number; pending: number };
}

/**
 * Planned and done volumes of a week, side by side. Planned counts every
 * training and competition of the week, done or not; done counts every
 * activity. A session and its activity are never added together.
 */
export function summarizeWeek(
  events: Event[],
  now: Date = new Date(),
): WeekTotals {
  const totals: WeekTotals = {
    duration: { planned: 0, done: 0 },
    distance: { planned: 0, done: 0 },
    elevation: { planned: 0, done: 0 },
    sessions: { done: 0, missed: 0, pending: 0 },
  };

  for (const event of events) {
    if (event.type === EVENT_TYPE.ACTIVITY) {
      totals.duration.done += event.movingTime || 0;
      totals.distance.done += event.distance || 0;
      totals.elevation.done += event.elevationGain || 0;
    } else if (isPlannedEvent(event)) {
      totals.duration.planned += event.goalDuration || 0;
      totals.distance.planned += event.goalDistance || 0;
      totals.elevation.planned += event.goalElevationGain || 0;

      const { status } = getCompliance(event, now);
      if (status === 'missed') totals.sessions.missed++;
      else if (status === 'pending') totals.sessions.pending++;
      else totals.sessions.done++;
    }
  }

  return totals;
}

/** Done over planned, null when nothing was planned */
export const progressOf = ({ planned, done }: PlannedDone) =>
  planned > 0 ? done / planned : null;

/** "45min", "1h", "4h05" */
export function formatCompactDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return minutes === 0
    ? `${hours}h`
    : `${hours}h${String(minutes).padStart(2, '0')}`;
}

/** Kilometres without trailing zeros, in the reader's locale: "93", "9,5" */
export function formatCompactKilometers(meters: number, locale?: string) {
  const kilometers = meters / 1000;
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: kilometers >= 10 ? 0 : 1,
  }).format(kilometers);
}
