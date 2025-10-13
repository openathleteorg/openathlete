import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  TrainingLoadCalculationType,
  TrainingLoadService,
} from './training-load.service';

export const useCalculateActivityLoadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingLoadService.calculateActivityLoad>>,
    Error,
    {
      activityId: number;
      calculationType: TrainingLoadCalculationType;
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ activityId, calculationType }) =>
      TrainingLoadService.calculateActivityLoad(activityId, calculationType),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      // Invalidate all training load queries
      queryClient.invalidateQueries({
        queryKey: ['TrainingLoadService'],
      });
    },
  });
};

export const useTrainingLoadByPeriod = (
  calculationType: TrainingLoadCalculationType,
  startDate: Date,
  endDate: Date,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadService.getTrainingLoadByPeriod>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      TrainingLoadService.getTrainingLoadByPeriod(
        calculationType,
        startDate,
        endDate,
      ),
    queryKey: [
      'TrainingLoadService.getTrainingLoadByPeriod',
      calculationType,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
  });

export const useTrainingLoadMetrics = (
  calculationType: TrainingLoadCalculationType,
  targetDate?: Date,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadService.getTrainingLoadMetrics>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      TrainingLoadService.getTrainingLoadMetrics(calculationType, targetDate),
    queryKey: [
      'TrainingLoadService.getTrainingLoadMetrics',
      calculationType,
      targetDate?.toISOString(),
    ],
  });

export const useTrainingLoadHistory = (
  calculationType: TrainingLoadCalculationType,
  startDate: Date,
  endDate: Date,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadService.getTrainingLoadHistory>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      TrainingLoadService.getTrainingLoadHistory(
        calculationType,
        startDate,
        endDate,
      ),
    queryKey: [
      'TrainingLoadService.getTrainingLoadHistory',
      calculationType,
      startDate.toISOString(),
      endDate.toISOString(),
    ],
  });

export const useActivityTrainingLoads = (
  activityId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadService.getActivityTrainingLoads>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => TrainingLoadService.getActivityTrainingLoads(activityId),
    queryKey: ['TrainingLoadService.getActivityTrainingLoads', activityId],
  });

export const useRecalculateAllLoadsMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingLoadService.recalculateAllLoads>>,
    Error,
    {
      calculationType: TrainingLoadCalculationType;
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ calculationType }) =>
      TrainingLoadService.recalculateAllLoads(calculationType),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      // Invalidate all training load queries
      queryClient.invalidateQueries({
        queryKey: ['TrainingLoadService'],
      });
    },
  });
};
