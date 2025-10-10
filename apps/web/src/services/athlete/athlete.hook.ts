import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { AthleteService } from './athlete.service';

export const useGetMyAthleteQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AthleteService.getMyAthlete>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AthleteService.getMyAthlete,
    queryKey: ['AthleteService.getMyAthlete'],
  });

export const useGetMyCoachedAthletesQuery = (
  opt?: QueryOptions<
    Awaited<ReturnType<typeof AthleteService.getCoachedAthletes>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: AthleteService.getCoachedAthletes,
    queryKey: ['AthleteService.getCoachedAthletes'],
  });

export const useGetMyCoachesQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AthleteService.getMyCoaches>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AthleteService.getMyCoaches,
    queryKey: ['AthleteService.getMyCoaches'],
  });

export const useInviteCoachMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteService.inviteCoach>>,
    Error,
    Parameters<typeof AthleteService.inviteCoach>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteService.inviteCoach,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getMyCoaches'],
      });
    },
  });
};

export const useInviteAthleteMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteService.inviteAthlete>>,
    Error,
    Parameters<typeof AthleteService.inviteAthlete>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteService.inviteAthlete,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getCoachedAthletes'],
      });
    },
  });
};

export const useRemoveAthleteMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteService.removeAthlete>>,
    Error,
    Parameters<typeof AthleteService.removeAthlete>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteService.removeAthlete,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getCoachedAthletes'],
      });
    },
  });
};

export const useRemoveCoachMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteService.removeCoach>>,
    Error,
    Parameters<typeof AthleteService.removeCoach>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteService.removeCoach,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getMyCoaches'],
      });
    },
  });
};
