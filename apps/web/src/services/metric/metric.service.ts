import client, { routes } from '@/utils/axios';

import {
  CreateMetricDto,
  METRIC_TYPE,
  UpdateMetricDto,
} from '@openathlete/shared';

export interface AthleteMetric {
  athleteMetricId: number;
  type: METRIC_TYPE;
  date: string;
  value: number;
  notes: string | null;
  athleteId: number;
  createdAt: string;
  updatedAt: string;
}

export class MetricService {
  static async getMyMetrics(type?: METRIC_TYPE): Promise<AthleteMetric[]> {
    const res = await client.get(routes.metric.getMyMetrics, {
      params: type ? { type } : undefined,
    });
    return res.data;
  }

  static async getLatestMetrics(): Promise<Record<string, AthleteMetric>> {
    const res = await client.get(routes.metric.getLatestMetrics);
    return res.data;
  }

  static async getMetricHistory(type: METRIC_TYPE): Promise<AthleteMetric[]> {
    const res = await client.get(routes.metric.getMetricHistory(type));
    return res.data;
  }

  static async calculateMetric(type: METRIC_TYPE): Promise<number | null> {
    const res = await client.get(routes.metric.calculateMetric(type));
    return res.data;
  }

  static async createMetric(body: CreateMetricDto): Promise<AthleteMetric> {
    const res = await client.post(routes.metric.createMetric, body);
    return res.data;
  }

  static async updateMetric({
    id,
    body,
  }: {
    id: number;
    body: UpdateMetricDto;
  }): Promise<AthleteMetric> {
    const res = await client.patch(routes.metric.updateMetric(id), body);
    return res.data;
  }

  static async deleteMetric(id: number): Promise<void> {
    await client.delete(routes.metric.deleteMetric(id));
  }
}
