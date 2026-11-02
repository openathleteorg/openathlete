import {
  useGetAthleteSettingsQuery,
  useGetMyAthleteQuery,
  useUpdateAthleteSettingsMutation,
} from '@/api/athlete';
import { athleteKeys } from '@/api/athlete/athlete.keys';
import { useQueryClient } from '@tanstack/react-query';

import { AthleteSettings } from '@openathlete/shared';

const NONE: number[] = [];

/** Suspect activities the athlete vouched for: they should not nag again. */
export function useDismissedSuspects(athleteId?: number) {
  const queryClient = useQueryClient();
  const { data: myAthlete } = useGetMyAthleteQuery();
  const targetId = athleteId ?? myAthlete?.athleteId ?? 0;
  const { data: settings } = useGetAthleteSettingsQuery(targetId);
  const { mutate: updateSettings } = useUpdateAthleteSettingsMutation(targetId);
  const dismissed = settings?.dismissedRecordSuspects ?? NONE;

  const dismiss = (ids: number[]) => {
    const next = [...new Set([...dismissed, ...ids])];
    queryClient.setQueryData<AthleteSettings>(
      athleteKeys.getAthleteSettings(targetId),
      (current) => current && { ...current, dismissedRecordSuspects: next },
    );
    updateSettings({ dismissedRecordSuspects: next });
  };

  return { dismissed, dismiss };
}
