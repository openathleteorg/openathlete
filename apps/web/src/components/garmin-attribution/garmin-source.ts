import { useGarminDataQuery, useGetMyAthleteQuery } from '@/api/athlete';

import { EVENT_TYPE, Event } from '@openathlete/shared';

/*
 * Garmin's API brand guidelines require its attribution next to every view
 * of its data, and of anything derived from it. They accept plain text, so
 * the app keeps it small and quiet: "Garmin Forerunner 965" beside an
 * activity, one line under a page whose figures use Garmin data. Never the
 * logo, never in a tooltip.
 */

/** "Garmin [device model]", or "Garmin" when Garmin doesn't name it */
export function garminSourceLabel(deviceName?: string | null): string {
  return deviceName ? `Garmin ${deviceName}` : 'Garmin';
}

/** The attribution of an activity imported from Garmin, null otherwise */
export function garminActivityLabel(event: Event): string | null {
  if (event.type !== EVENT_TYPE.ACTIVITY || event.provider !== 'GARMIN') {
    return null;
  }
  return garminSourceLabel(event.deviceName);
}

/**
 * Whether Garmin data feeds what the page shows: the given athlete's, the
 * user's own when none is given, or any athlete they see with `'any'`
 * (a coach's overview of all their athletes)
 */
export function useHasGarminData(athleteId?: number | 'any'): boolean {
  const { data } = useGarminDataQuery();
  const { data: myAthlete } = useGetMyAthleteQuery();
  const ids = data?.athleteIds ?? [];
  if (athleteId === 'any') return ids.length > 0;
  const target = athleteId ?? myAthlete?.athleteId;
  return target !== undefined && ids.includes(target);
}
