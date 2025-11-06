import { useGetAthleteSettingsQuery } from '@/api/athlete';
import { useMemo } from 'react';

import { EVENT_TYPE, Event } from '@openathlete/shared';

/**
 * Check if an event is validated based on athlete settings
 */
export function useIsEventValidated(event: Event, athleteId?: number): boolean {
  const { data: settings } = useGetAthleteSettingsQuery(
    athleteId || 0,
    !!athleteId && event.type === EVENT_TYPE.ACTIVITY,
  );

  return useMemo(() => {
    if (!athleteId || !settings) return true;
    if (!settings.requireRpe && !settings.requireComment) return true;
    if (event.startDate < new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000))
      return true;
    if (event.type === EVENT_TYPE.ACTIVITY) {
      const hasRpe = event.rpe !== null && event.rpe !== undefined;
      const hasComment =
        event.description !== null &&
        event.description !== undefined &&
        event.description.trim() !== '';

      if (settings.requireRpe && !hasRpe) return false;
      if (settings.requireComment && !hasComment) return false;

      return true;
    }

    return true;
  }, [event, settings, athleteId]);
}
