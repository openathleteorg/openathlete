import {
  useGetAthleteSettingsQuery,
  useUpdateAthleteSettingsMutation,
} from '@/api/athlete';
import { athleteKeys } from '@/api/athlete/athlete.keys';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { AthleteSettings, METRIC_TYPE } from '@openathlete/shared';

const NONE: METRIC_TYPE[] = [];

/** Stored with the athlete: the same list on every device, and for their coach */
export function usePinnedMetrics(athleteId: number) {
  const queryClient = useQueryClient();
  const { data: settings, isPending } = useGetAthleteSettingsQuery(athleteId);
  const updateSettings = useUpdateAthleteSettingsMutation(athleteId);
  const pinned = (settings?.pinnedMetrics as METRIC_TYPE[] | undefined) ?? NONE;

  const togglePinned = useCallback(
    (type: METRIC_TYPE) => {
      const next = pinned.includes(type)
        ? pinned.filter((other) => other !== type)
        : [...pinned, type];
      const key = athleteKeys.getAthleteSettings(athleteId);
      // Pinning answers at once: the list moves before the API replies
      queryClient.setQueryData<AthleteSettings>(
        key,
        (current) => current && { ...current, pinnedMetrics: next },
      );
      updateSettings.mutate(
        { pinnedMetrics: next },
        {
          onError: () => {
            toast.error(m.metrics_save_failed());
            queryClient.invalidateQueries({ queryKey: key });
          },
        },
      );
    },
    [athleteId, pinned, queryClient, updateSettings],
  );

  return { pinned, togglePinned, isPending };
}
