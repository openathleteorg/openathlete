import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { athleteKeys } from '../athlete/athlete.keys';
import { TrainingZoneAPI } from './training-zone.api';
import { trainingZoneKeys } from './training-zone.keys';

export const useGetTrainingZones = (
  athleteId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingZoneAPI.getAllForAthlete>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => TrainingZoneAPI.getAllForAthlete(athleteId),
    queryKey: [trainingZoneKeys.getAllForAthlete, athleteId],
  });

export const useCreateTrainingZone = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingZoneAPI.create>>,
    Error,
    Parameters<typeof TrainingZoneAPI.create>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: TrainingZoneAPI.create,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [trainingZoneKeys.getAllForAthlete],
      });
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getMyAthlete],
      });
    },
  });
};

export const useUpdateTrainingZone = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingZoneAPI.update>>,
    Error,
    { trainingZoneId: number; body: any }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ trainingZoneId, body }) =>
      TrainingZoneAPI.update(trainingZoneId, body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [trainingZoneKeys.getAllForAthlete],
      });
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getMyAthlete],
      });
    },
  });
};

export const useDeleteTrainingZone = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingZoneAPI.delete>>,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: TrainingZoneAPI.delete,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [trainingZoneKeys.getAllForAthlete],
      });
      queryClient.invalidateQueries({
        queryKey: [athleteKeys.getMyAthlete],
      });
    },
  });
};
