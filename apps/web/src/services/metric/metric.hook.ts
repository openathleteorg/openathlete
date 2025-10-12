import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { METRIC_TYPE } from '@openathlete/shared';

import { MetricService } from './metric.service';

export const useGetMyMetricsQuery = (
  type?: METRIC_TYPE,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricService.getMyMetrics>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: ['getMyMetrics', type],
    queryFn: () => MetricService.getMyMetrics(type),
  });
};

export const useGetLatestMetricsQuery = (
  opt?: QueryOptions<
    Awaited<ReturnType<typeof MetricService.getLatestMetrics>>
  >,
) => {
  return useQuery({
    ...opt,
    queryKey: ['getLatestMetrics'],
    queryFn: MetricService.getLatestMetrics,
  });
};

export const useGetMetricHistoryQuery = (
  type: METRIC_TYPE,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof MetricService.getMetricHistory>>
  >,
) => {
  return useQuery({
    ...opt,
    queryKey: ['getMetricHistory', type],
    queryFn: () => MetricService.getMetricHistory(type),
  });
};

export const useCalculateMetricQuery = (
  type: METRIC_TYPE,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricService.calculateMetric>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: ['calculateMetric', type],
    queryFn: () => MetricService.calculateMetric(type),
  });
};

export const useCreateMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricService.createMetric>>,
    Error,
    Parameters<typeof MetricService.createMetric>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MetricService.createMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMyMetrics'] });
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
      queryClient.invalidateQueries({ queryKey: ['getMyMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getLatestMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getMetricHistory'] });
    },
  });
};

export const useDeleteMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricService.deleteMetric>>,
    Error,
    Parameters<typeof MetricService.deleteMetric>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MetricService.deleteMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMyMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getLatestMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['getMetricHistory'] });
    },
  });
};
