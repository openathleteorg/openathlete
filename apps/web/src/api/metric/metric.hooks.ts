import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { METRIC_TYPE } from '@openathlete/shared';

import { MetricAPI } from './metric.api';
import { metricKeys } from './metric.keys';

export const useGetMetricsQuery = (
  type?: METRIC_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricAPI.getMetrics>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: [metricKeys.getMetrics, type, athleteId],
    queryFn: () => MetricAPI.getMetrics(type, athleteId),
  });
};

export const useGetLatestMetricsQuery = (
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricAPI.getLatestMetrics>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: [metricKeys.getLatestMetrics, athleteId],
    queryFn: () => MetricAPI.getLatestMetrics(athleteId),
  });
};

export const useGetMetricHistoryQuery = (
  type: METRIC_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricAPI.getMetricHistory>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: [metricKeys.getMetricHistory, type, athleteId],
    queryFn: () => MetricAPI.getMetricHistory(type, athleteId),
  });
};

export const useCalculateMetricQuery = (
  type: METRIC_TYPE,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MetricAPI.calculateMetric>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: [metricKeys.calculateMetric, type, athleteId],
    queryFn: () => MetricAPI.calculateMetric(type, athleteId),
  });
};

export const useCreateMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricAPI.createMetric>>,
    Error,
    {
      body: Parameters<typeof MetricAPI.createMetric>[0];
      athleteId?: number;
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ body, athleteId }) =>
      MetricAPI.createMetric(body, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [metricKeys.getMetrics] });
      queryClient.invalidateQueries({
        queryKey: [metricKeys.getLatestMetrics],
      });
      queryClient.invalidateQueries({
        queryKey: [metricKeys.getMetricHistory],
      });
    },
  });
};

export const useUpdateMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricAPI.updateMetric>>,
    Error,
    Parameters<typeof MetricAPI.updateMetric>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MetricAPI.updateMetric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [metricKeys.getMetrics] });
      queryClient.invalidateQueries({
        queryKey: [metricKeys.getLatestMetrics],
      });
      queryClient.invalidateQueries({
        queryKey: [metricKeys.getMetricHistory],
      });
    },
  });
};

export const useDeleteMetricMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MetricAPI.deleteMetric>>,
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
    mutationFn: ({ id, athleteId }) => MetricAPI.deleteMetric(id, athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [metricKeys.getMetrics] });
      queryClient.invalidateQueries({
        queryKey: [metricKeys.getLatestMetrics],
      });
      queryClient.invalidateQueries({
        queryKey: [metricKeys.getMetricHistory],
      });
    },
  });
};
