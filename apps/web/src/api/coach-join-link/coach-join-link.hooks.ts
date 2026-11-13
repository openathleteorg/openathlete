import { athleteKeys } from '@/api/athlete/athlete.keys';
import { coachKeys } from '@/api/coach/coach.keys';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { CoachJoinLinkAPI } from './coach-join-link.api';
import { coachJoinLinkKeys } from './coach-join-link.keys';

export const useMyCoachJoinLinkQuery = ({
  enabled = true,
}: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: coachJoinLinkKeys.mine,
    queryFn: CoachJoinLinkAPI.getMyLink,
    enabled,
    staleTime: Infinity,
  });

export const useRotateCoachJoinLinkMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CoachJoinLinkAPI.rotate,
    onSuccess: (link) => {
      queryClient.setQueryData(coachJoinLinkKeys.mine, link);
    },
  });
};

export const useCoachJoinLinkInfoQuery = (token: string | undefined) =>
  useQuery({
    queryKey: coachJoinLinkKeys.info(token ?? ''),
    queryFn: () => CoachJoinLinkAPI.getInfo(token as string),
    enabled: !!token,
    retry: false,
  });

/** What changes once the athlete has a new coach */
export const invalidateAfterCoachJoin = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: [athleteKeys.getMyCoaches] }),
    queryClient.invalidateQueries({ queryKey: [athleteKeys.getMyAthlete] }),
    queryClient.invalidateQueries({
      queryKey: [athleteKeys.getCoachedAthletes],
    }),
    queryClient.invalidateQueries({ queryKey: coachKeys.all }),
  ]);

export const useAcceptCoachJoinLinkMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CoachJoinLinkAPI.accept,
    onSuccess: () => invalidateAfterCoachJoin(queryClient),
  });
};
