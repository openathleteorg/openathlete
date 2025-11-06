import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { AthleteAPI } from './athlete.api';
import { athleteKeys } from './athlete.keys';

export const useGetMyAthleteQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AthleteAPI.getMyAthlete>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AthleteAPI.getMyAthlete,
    queryKey: [athleteKeys.getMyAthlete],
  });

export const useGetMyCoachedAthletesQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AthleteAPI.getCoachedAthletes>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AthleteAPI.getCoachedAthletes,
    queryKey: [athleteKeys.getCoachedAthletes],
  });

export const useGetMyCoachesQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AthleteAPI.getMyCoaches>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AthleteAPI.getMyCoaches,
    queryKey: [athleteKeys.getMyCoaches],
  });

export const useInviteCoachMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteAPI.inviteCoach>>,
    Error,
    Parameters<typeof AthleteAPI.inviteCoach>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteAPI.inviteCoach,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getMyCoaches],
      });
    },
  });
};

export const useInviteAthleteMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteAPI.inviteAthlete>>,
    Error,
    Parameters<typeof AthleteAPI.inviteAthlete>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteAPI.inviteAthlete,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getCoachedAthletes],
      });
    },
  });
};

export const useRemoveAthleteMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteAPI.removeAthlete>>,
    Error,
    Parameters<typeof AthleteAPI.removeAthlete>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteAPI.removeAthlete,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getCoachedAthletes],
      });
    },
  });
};

export const useRemoveCoachMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteAPI.removeCoach>>,
    Error,
    Parameters<typeof AthleteAPI.removeCoach>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AthleteAPI.removeCoach,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getMyCoaches],
      });
    },
  });
};

export const useGetAthleteSettingsQuery = (
  athleteId: number,
  enabled?: boolean,
  opt?: QueryOptions<Awaited<ReturnType<typeof AthleteAPI.getAthleteSettings>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => AthleteAPI.getAthleteSettings(athleteId),
    queryKey: athleteKeys.getAthleteSettings(athleteId),
    enabled: !!athleteId && enabled !== false,
  });

export const useUpdateAthleteSettingsMutation = (
  athleteId: number,
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AthleteAPI.updateAthleteSettings>>,
    Error,
    Parameters<typeof AthleteAPI.updateAthleteSettings>[1]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: (
      body: Parameters<typeof AthleteAPI.updateAthleteSettings>[1],
    ) => AthleteAPI.updateAthleteSettings(athleteId, body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: athleteKeys.getAthleteSettings(athleteId),
      });
    },
  });
};
