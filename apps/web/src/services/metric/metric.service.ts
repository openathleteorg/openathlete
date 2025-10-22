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
  static async getMetrics(
    type?: METRIC_TYPE,
    athleteId?: number,
  ): Promise<AthleteMetric[]> {
    const res = await client.get(routes.metric.getMetrics, {
      params: {
        ...(type && { type }),
        ...(athleteId && { athleteId }),
      },
    });
    return res.data;
  }

  static async getLatestMetrics(
    athleteId?: number,
  ): Promise<Record<string, AthleteMetric>> {
    const res = await client.get(routes.metric.getLatestMetrics, {
      params: athleteId ? { athleteId } : undefined,
    });
    return res.data;
  }

  static async getMetricHistory(
    type: METRIC_TYPE,
    athleteId?: number,
  ): Promise<AthleteMetric[]> {
    const res = await client.get(routes.metric.getMetricHistory(type), {
      params: athleteId ? { athleteId } : undefined,
    });
    return res.data;
  }

  static async calculateMetric(
    type: METRIC_TYPE,
    athleteId?: number,
  ): Promise<number | null> {
    const res = await client.get(routes.metric.calculateMetric(type), {
      params: athleteId ? { athleteId } : undefined,
    });
    return res.data;
  }

  static async createMetric(
    body: CreateMetricDto,
    athleteId?: number,
  ): Promise<AthleteMetric> {
    const res = await client.post(routes.metric.createMetric, body, {
      params: {
        ...(athleteId && { athleteId }),
      },
    });
    return res.data;
  }

  static async updateMetric({
    id,
    body,
    athleteId,
  }: {
    id: number;
    body: UpdateMetricDto;
    athleteId?: number;
  }): Promise<AthleteMetric> {
    const res = await client.patch(routes.metric.updateMetric(id), body, {
      params: {
        ...(athleteId && { athleteId }),
      },
    });
    return res.data;
  }

  static async deleteMetric(id: number, athleteId?: number): Promise<void> {
    await client.delete(routes.metric.deleteMetric(id), {
      params: {
        ...(athleteId && { athleteId }),
      },
    });
  }
}
