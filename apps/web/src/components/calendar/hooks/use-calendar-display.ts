import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import {
  CalendarDisplay,
  User,
  readCalendarDisplay,
} from '@openathlete/shared';

/**
 * What the calendar shows, saved with the account. A change applies at
 * once and is saved in the background; if saving fails, the saved one
 * comes back.
 */
export function useCalendarDisplay() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const display = useMemo(
    () => readCalendarDisplay(me?.calendarDisplay),
    [me?.calendarDisplay],
  );
  // Hook options: the settings popover may close before the request ends
  const save = useUpdateAccountMutation({
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [userKeys.getMe] });
      toast.error(m.calendar_display_save_failed());
    },
  });

  const updateDisplay = useCallback(
    (change: (current: CalendarDisplay) => CalendarDisplay) => {
      const current = readCalendarDisplay(
        queryClient.getQueryData<User>([userKeys.getMe])?.calendarDisplay,
      );
      const next = change(current);
      queryClient.setQueryData<User>([userKeys.getMe], (old) =>
        old ? { ...old, calendarDisplay: next } : old,
      );
      save.mutate({ calendarDisplay: next });
    },
    [queryClient, save],
  );

  return { display, updateDisplay };
}
