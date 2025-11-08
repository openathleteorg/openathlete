import {
  MutationOptions,
  QueryOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { CoachDashboardResponseDto } from '@openathlete/shared';

import { CoachAPI } from './coach.api';
import { coachKeys } from './coach.keys';

export function useCoachDashboardQuery(
  start?: Date,
  end?: Date,
  options?: UseQueryOptions<CoachDashboardResponseDto>,
) {
  const startIso = start?.toISOString();
  const endIso = end?.toISOString();
  return useQuery<CoachDashboardResponseDto>({
    queryKey: coachKeys.dashboard(startIso, endIso),
    queryFn: () => CoachAPI.getDashboard(start, end),
    staleTime: 60 * 1000,
    ...options,
  });
}

export const useGetPendingInvitationsQuery = (
  { enabled }: { enabled?: boolean },
  opt?: QueryOptions<
    Awaited<ReturnType<typeof CoachAPI.getPendingInvitations>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: CoachAPI.getPendingInvitations,
    queryKey: coachKeys.getPendingInvitations,
    enabled: !!enabled,
  });

export const useAcceptInvitationMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CoachAPI.acceptInvitation>>,
    Error,
    Parameters<typeof CoachAPI.acceptInvitation>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CoachAPI.acceptInvitation,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: coachKeys.getPendingInvitations,
      });
    },
  });
};

export const useRejectInvitationMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof CoachAPI.rejectInvitation>>,
    Error,
    Parameters<typeof CoachAPI.rejectInvitation>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: CoachAPI.rejectInvitation,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: coachKeys.getPendingInvitations,
      });
    },
  });
};
