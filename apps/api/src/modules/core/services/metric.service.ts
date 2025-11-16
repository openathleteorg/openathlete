import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { athlete, athlete_metric, metric_type } from '@openathlete/database';
import {
  CreateMetricDto,
  UpdateMetricDto,
  keysToCamel,
  metricCalculationMap,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class MetricService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /**
   * Create a new metric for the authenticated user or a specific athlete (if coach)
   */
  async createMetric(
    user: AuthUser,
    dto: CreateMetricDto,
    athleteId?: athlete['athlete_id'],
  ): Promise<athlete_metric> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metric to create
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can manage this athlete's metrics
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (
        !ability.can(
          'manage',
          subject('athlete_metric', {
            athlete_id: athleteId,
          } as athlete_metric),
        )
      ) {
        throw new ForbiddenException(
          'Not allowed to create metrics for this athlete',
        );
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
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

      targetAthleteId = athlete.athlete_id;
    }

    // Convert date to Date object if it's a string
    const date = typeof dto.date === 'string' ? new Date(dto.date) : dto.date;

    // Check if a metric already exists for this type and date
    const existingMetric = await this.prisma.athlete_metric.findUnique({
      where: {
        athlete_id_type_date: {
          athlete_id: targetAthleteId,
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
              athlete_id: targetAthleteId,
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
    athleteId?: athlete['athlete_id'],
  ): Promise<athlete_metric> {
    const ability = await this.abilities.getFor({ user });

    // Get the metric first to check ownership
    const metric = await this.prisma.athlete_metric.findUnique({
      where: {
        athlete_metric_id: metricId,
      },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    // If athleteId is provided, verify it matches the metric's athlete
    if (athleteId && metric.athlete_id !== athleteId) {
      throw new ForbiddenException('Metric does not belong to this athlete');
    }

    // Check if user can manage this athlete's metrics
    if (
      !ability.can(
        'manage',
        subject('athlete_metric', {
          athlete_id: metric.athlete_id,
        } as athlete_metric),
      )
    ) {
      throw new ForbiddenException('Not allowed to update this metric');
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
  async deleteMetric(
    user: AuthUser,
    metricId: number,
    athleteId?: athlete['athlete_id'],
  ): Promise<void> {
    const ability = await this.abilities.getFor({ user });

    // Get the metric first to check ownership
    const metric = await this.prisma.athlete_metric.findUnique({
      where: {
        athlete_metric_id: metricId,
      },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    // If athleteId is provided, verify it matches the metric's athlete
    if (athleteId && metric.athlete_id !== athleteId) {
      throw new ForbiddenException('Metric does not belong to this athlete');
    }

    // Check if user can manage this athlete's metrics
    if (
      !ability.can(
        'manage',
        subject('athlete_metric', {
          athlete_id: metric.athlete_id,
        } as athlete_metric),
      )
    ) {
      throw new ForbiddenException('Not allowed to delete this metric');
    }

    await this.prisma.athlete_metric.delete({
      where: {
        athlete_metric_id: metricId,
      },
    });
  }

  /**
   * Get all metrics for the authenticated user or specific athlete
   * Optionally filter by type
   */
  async getMetrics(
    user: AuthUser,
    type?: metric_type,
    athleteId?: athlete['athlete_id'],
  ): Promise<athlete_metric[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metrics to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
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

      targetAthleteId = athlete.athlete_id;
    }

    const metrics = await this.prisma.athlete_metric.findMany({
      where: {
        athlete_id: targetAthleteId,
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
    athleteId?: athlete['athlete_id'],
  ): Promise<Record<string, athlete_metric>> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metrics to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
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

      targetAthleteId = athlete.athlete_id;
    }

    const metrics = await this.prisma.athlete_metric.findMany({
      where: {
        athlete_id: targetAthleteId,
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
    const result: Record<string, athlete_metric> = {};
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
    athleteId?: athlete['athlete_id'],
  ): Promise<athlete_metric[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metrics to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
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

      targetAthleteId = athlete.athlete_id;
    }

    const metrics = await this.prisma.athlete_metric.findMany({
      where: {
        athlete_id: targetAthleteId,
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
    athleteId?: athlete['athlete_id'],
  ): Promise<number | null> {
    const config = metricCalculationMap[type];

    if (!config.canAutoCalculate || !config.dependencies || !config.calculate) {
      return null;
    }

    // Get latest values for dependencies
    const latestMetrics = await this.getLatestMetrics(user, athleteId);
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
