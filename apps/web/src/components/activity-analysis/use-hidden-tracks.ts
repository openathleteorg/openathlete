import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  SPORT_TYPE,
  User,
  readHiddenActivityTracks,
} from '@openathlete/shared';

import { TrackKey } from './tracks';

// Temperature duplicates the weather tab: off until asked for
const DEFAULT_HIDDEN: TrackKey[] = ['temperature'];

/** The tracks the athlete hid, per sport, saved with their account */
export function useHiddenTracks(sport: SPORT_TYPE) {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const { mutate: updateAccount } = useUpdateAccountMutation();

  const hidden = useMemo(
    () =>
      (readHiddenActivityTracks(me?.hiddenActivityTracks)[sport] as
        TrackKey[] | undefined) ?? DEFAULT_HIDDEN,
    [me?.hiddenActivityTracks, sport],
  );

  const toggle = useCallback(
    (track: TrackKey) => {
      const stored = readHiddenActivityTracks(
        queryClient.getQueryData<User>([userKeys.getMe])?.hiddenActivityTracks,
      );
      const current =
        (stored[sport] as TrackKey[] | undefined) ?? DEFAULT_HIDDEN;
      const next = {
        ...stored,
        [sport]: current.includes(track)
          ? current.filter((key) => key !== track)
          : [...current, track],
      };
      queryClient.setQueryData<User>([userKeys.getMe], (old) =>
        old ? { ...old, hiddenActivityTracks: next } : old,
      );
      updateAccount({ hiddenActivityTracks: next });
    },
    [queryClient, sport, updateAccount],
  );

  return { hidden, toggle };
}
