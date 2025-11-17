import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  TrainingLoadAPI,
  TrainingLoadCalculationType,
} from './training-load.api';
import { trainingLoadKeys } from './training-load.keys';

export const useCalculateActivityLoadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.calculateActivityLoad>>,
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
      TrainingLoadAPI.calculateActivityLoad(activityId, calculationType),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      // Invalidate all training load queries
      queryClient.invalidateQueries({
        queryKey: [trainingLoadKeys.root],
      });
    },
  });
};

export const useTrainingLoadByPeriod = (
  calculationType: TrainingLoadCalculationType,
  startDate: Date,
  endDate: Date,
  athleteId?: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.getTrainingLoadByPeriod>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      TrainingLoadAPI.getTrainingLoadByPeriod(
        calculationType,
        startDate,
        endDate,
        athleteId,
      ),
    queryKey: [
      trainingLoadKeys.getTrainingLoadByPeriod,
      calculationType,
      startDate.toISOString(),
      endDate.toISOString(),
      athleteId,
    ],
  });

export const useTrainingLoadMetrics = (
  calculationType: TrainingLoadCalculationType,
  targetDate?: Date,
  athleteId?: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.getTrainingLoadMetrics>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      TrainingLoadAPI.getTrainingLoadMetrics(
        calculationType,
        targetDate,
        athleteId,
      ),
    queryKey: [
      trainingLoadKeys.getTrainingLoadMetrics,
      calculationType,
      targetDate?.toISOString(),
      athleteId,
    ],
  });

export const useTrainingLoadHistory = (
  calculationType: TrainingLoadCalculationType,
  startDate: Date,
  endDate: Date,
  athleteId?: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.getTrainingLoadHistory>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () =>
      TrainingLoadAPI.getTrainingLoadHistory(
        calculationType,
        startDate,
        endDate,
        athleteId,
      ),
    queryKey: [
      trainingLoadKeys.getTrainingLoadHistory,
      calculationType,
      startDate.toISOString(),
      endDate.toISOString(),
      athleteId,
    ],
  });

export const useWeeklyTrimpSummaryQuery = (
  startDate?: Date,
  endDate?: Date,
  athleteId?: number,
  enabled?: boolean,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.getWeeklyTrimpSummary>>
  >,
) =>
  useQuery({
    ...opt,
    enabled:
      (enabled ?? true) && Boolean(startDate && endDate) && Boolean(athleteId),
    queryFn: () => {
      if (!startDate || !endDate) {
        return Promise.resolve([]);
      }
      return TrainingLoadAPI.getWeeklyTrimpSummary(
        startDate,
        endDate,
        athleteId,
      );
    },
    queryKey: [
      trainingLoadKeys.getWeeklyTrimpSummary,
      startDate?.toISOString(),
      endDate?.toISOString(),
      athleteId,
    ],
  });

export const useActivityTrainingLoads = (
  activityId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.getActivityTrainingLoads>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => TrainingLoadAPI.getActivityTrainingLoads(activityId),
    queryKey: [trainingLoadKeys.getActivityTrainingLoads, activityId],
  });

export const useRecalculateAllLoadsMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof TrainingLoadAPI.recalculateAllLoads>>,
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
      TrainingLoadAPI.recalculateAllLoads(calculationType),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [trainingLoadKeys.root],
      });
    },
  });
};
