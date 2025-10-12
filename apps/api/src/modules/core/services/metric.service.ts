import { Injectable, NotFoundException } from '@nestjs/common';

import { athlete_metric, metric_type } from '@openathlete/database';
import {
  CreateMetricDto,
  UpdateMetricDto,
  keysToCamel,
  metricCalculationMap,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class MetricService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new metric for the authenticated user
   */
  async createMetric(
    user: AuthUser,
    dto: CreateMetricDto,
  ): Promise<athlete_metric> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id: user.user_id,
        },
      },
      select: {
        athlete_id: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Convert date to Date object if it's a string
    const date = typeof dto.date === 'string' ? new Date(dto.date) : dto.date;

    // Check if a metric already exists for this type and date
    const existingMetric = await this.prisma.athlete_metric.findUnique({
      where: {
        athlete_id_type_date: {
          athlete_id: athlete.athlete_id,
          type: dto.type as metric_type,
          date,
        },
      },
    });

    if (existingMetric) {
      // Update existing metric instead of creating a new one
      return keysToCamel(
        await this.prisma.athlete_metric.update({
          where: {
            athlete_metric_id: existingMetric.athlete_metric_id,
          },
          data: {
            value: dto.value,
            notes: dto.notes,
          },
        }),
      );
    }

    return keysToCamel(
      await this.prisma.athlete_metric.create({
        data: {
          type: dto.type as metric_type,
          date,
          value: dto.value,
          notes: dto.notes,
          athlete: {
            connect: {
              athlete_id: athlete.athlete_id,
            },
          },
        },
      }),
    );
  }

  /**
   * Update an existing metric
   */
  async updateMetric(
    user: AuthUser,
    metricId: number,
    dto: UpdateMetricDto,
  ): Promise<athlete_metric> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id: user.user_id,
        },
      },
      select: {
        athlete_id: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const metric = await this.prisma.athlete_metric.findFirst({
      where: {
        athlete_metric_id: metricId,
        athlete_id: athlete.athlete_id,
      },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    return keysToCamel(
      await this.prisma.athlete_metric.update({
        where: {
          athlete_metric_id: metricId,
        },
        data: {
          ...(dto.value !== undefined && { value: dto.value }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      }),
    );
  }

  /**
   * Delete a metric
   */
  async deleteMetric(user: AuthUser, metricId: number): Promise<void> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id: user.user_id,
        },
      },
      select: {
        athlete_id: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const metric = await this.prisma.athlete_metric.findFirst({
      where: {
        athlete_metric_id: metricId,
        athlete_id: athlete.athlete_id,
      },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    await this.prisma.athlete_metric.delete({
      where: {
        athlete_metric_id: metricId,
      },
    });
  }

  /**
   * Get all metrics for the authenticated user
   * Optionally filter by type
   */
  async getMyMetrics(
    user: AuthUser,
    type?: metric_type,
  ): Promise<athlete_metric[]> {
    const metrics = await this.prisma.athlete_metric.findMany({
      where: {
        athlete: {
          user: {
            user_id: user.user_id,
          },
        },
        ...(type && { type }),
      },
      orderBy: [{ type: 'asc' }, { date: 'desc' }],
    });

    return keysToCamel(metrics);
  }

  /**
   * Get the latest value for each metric type
   */
  async getLatestMetrics(
    user: AuthUser,
  ): Promise<Record<string, athlete_metric>> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id: user.user_id,
        },
      },
      select: {
        athlete_id: true,
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    const metrics = await this.prisma.athlete_metric.findMany({
      where: {
        athlete_id: athlete.athlete_id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Group by type and keep only the latest (most recent date)
    const latestByType = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.type]) {
          acc[metric.type] = metric;
        }
        return acc;
      },
      {} as Record<string, athlete_metric>,
    );

    // Convert each metric object to camelCase, but keep the Record keys as-is
    const result: Record<string, any> = {};
    Object.entries(latestByType).forEach(([type, metric]) => {
      result[type] = keysToCamel(metric);
    });

    return result;
  }

  /**
   * Get metric history for a specific type
   */
  async getMetricHistory(
    user: AuthUser,
    type: metric_type,
  ): Promise<athlete_metric[]> {
    const metrics = await this.prisma.athlete_metric.findMany({
      where: {
        athlete: {
          user: {
            user_id: user.user_id,
          },
        },
        type,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return keysToCamel(metrics);
  }

  /**
   * Calculate auto-calculable metrics based on current values
   * Returns the calculated value or null if dependencies are missing
   */
  async calculateMetric(
    user: AuthUser,
    type: metric_type,
  ): Promise<number | null> {
    const config = metricCalculationMap[type];

    if (!config.canAutoCalculate || !config.dependencies || !config.calculate) {
      return null;
    }

    // Get latest values for dependencies
    const latestMetrics = await this.getLatestMetrics(user);
    const values: Record<metric_type, number> = {} as Record<
      metric_type,
      number
    >;

    // Check if all dependencies are available
    for (const dep of config.dependencies) {
      const metric = latestMetrics[dep];
      if (!metric) {
        return null; // Missing dependency
      }
      values[dep] = metric.value;
    }

    // Calculate and return the value
    return config.calculate(values);
  }
}
