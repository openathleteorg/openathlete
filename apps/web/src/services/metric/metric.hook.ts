import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { METRIC_TYPE } from '@openathlete/shared';

import { MetricService } from './metric.service';

export const useGetMetricsQuery = (
  type?: METRIC_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricService.getMetrics>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: ['getMetrics', type, athleteId],
    queryFn: () => MetricService.getMetrics(type, athleteId),
  });
};

export const useGetLatestMetricsQuery = (
  athleteId?: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof MetricService.getLatestMetrics>>
  >,
) => {
  return useQuery({
    ...opt,
    queryKey: ['getLatestMetrics', athleteId],
    queryFn: () => MetricService.getLatestMetrics(athleteId),
  });
};

export const useGetMetricHistoryQuery = (
  type: METRIC_TYPE,
  athleteId?: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof MetricService.getMetricHistory>>
  >,
) => {
  return useQuery({
    ...opt,
    queryKey: ['getMetricHistory', type, athleteId],
    queryFn: () => MetricService.getMetricHistory(type, athleteId),
  });
};

export const useCalculateMetricQuery = (
  type: METRIC_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricService.calculateMetric>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: ['calculateMetric', type, athleteId],
    queryFn: () => MetricService.calculateMetric(type, athleteId),
  });
};

export const useCreateMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricService.createMetric>>,
    Error,
    {
      body: Parameters<typeof MetricService.createMetric>[0];
      athleteId?: number;
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ body, athleteId }) =>
      MetricService.createMetric(body, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getLatestMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getMetricHistory'] });
    },
  });
};

export const useUpdateMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricService.updateMetric>>,
    Error,
    Parameters<typeof MetricService.updateMetric>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MetricService.updateMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getLatestMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getMetricHistory'] });
    },
  });
};

export const useDeleteMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricService.deleteMetric>>,
    Error,
    {
      id: number;
      athleteId?: number;
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ id, athleteId }) =>
      MetricService.deleteMetric(id, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getLatestMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getMetricHistory'] });
    },
  });
};
