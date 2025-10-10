import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { TrainingZoneService } from './training-zone.service';

export const useGetTrainingZones = (
  athleteId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingZoneService.getAllForAthlete>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => TrainingZoneService.getAllForAthlete(athleteId),
    queryKey: ['TrainingZoneService.getAllForAthlete', athleteId],
  });

export const useCreateTrainingZone = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingZoneService.create>>,
    Error,
    Parameters<typeof TrainingZoneService.create>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: TrainingZoneService.create,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['TrainingZoneService.getAllForAthlete'],
      });
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getMyAthlete'],
      });
    },
  });
};

export const useUpdateTrainingZone = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingZoneService.update>>,
    Error,
    { trainingZoneId: number; body: any }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ trainingZoneId, body }) =>
      TrainingZoneService.update(trainingZoneId, body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['TrainingZoneService.getAllForAthlete'],
      });
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getMyAthlete'],
      });
    },
  });
};

export const useDeleteTrainingZone = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingZoneService.delete>>,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: TrainingZoneService.delete,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['TrainingZoneService.getAllForAthlete'],
      });
      queryClient.invalidateQueries({
        queryKey: ['AthleteService.getMyAthlete'],
      });
    },
  });
};
