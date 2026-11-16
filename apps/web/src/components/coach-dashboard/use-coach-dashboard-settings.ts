import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import {
  CoachDashboardSettings,
  User,
  readCoachDashboardSettings,
} from '@openathlete/shared';

type WithDashboard = User & { coachDashboard?: unknown };

/**
 * The coach's dashboard setup, saved with the account. A change applies at
 * once and is saved in the background; if saving fails, the saved one
 * comes back.
 */
export function useCoachDashboardSettings() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const stored = (me as WithDashboard | undefined)?.coachDashboard;
  const settings = useMemo(() => readCoachDashboardSettings(stored), [stored]);
  const { mutate: save } = useUpdateAccountMutation({
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [userKeys.getMe] });
      toast.error(m.coach_columns_save_failed());
    },
  });

  const updateSettings = useCallback(
    (change: (current: CoachDashboardSettings) => CoachDashboardSettings) => {
      const current = readCoachDashboardSettings(
        queryClient.getQueryData<WithDashboard>([userKeys.getMe])
          ?.coachDashboard,
      );
      const next = change(current);
      queryClient.setQueryData<WithDashboard>([userKeys.getMe], (old) =>
        old ? { ...old, coachDashboard: next } : old,
      );
      save({ coachDashboard: next });
    },
    [queryClient, save],
  );

  return { settings, updateSettings };
}
