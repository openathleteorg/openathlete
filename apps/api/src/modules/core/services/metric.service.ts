import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Athlete, AthleteMetric, MetricType } from '@openathlete/database';
import {
  CreateMetricDto,
  UpdateMetricDto,
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
    athleteId?: Athlete['athleteId'],
  ): Promise<AthleteMetric> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metric to create
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can manage this athlete's metrics
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (
        !ability.can(
          'manage',
          subject('AthleteMetric', {
            athleteId: athleteId,
          } as AthleteMetric),
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
            userId: user.userId,
          },
        },
        select: {
          athleteId: true,
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    // Convert date to Date object if it's a string
    const date = typeof dto.date === 'string' ? new Date(dto.date) : dto.date;

    // Check if a metric already exists for this type and date
    const existingMetric = await this.prisma.athleteMetric.findUnique({
      where: {
        athleteId_type_date: {
          athleteId: targetAthleteId,
          type: dto.type as MetricType,
          date,
        },
      },
    });

    if (existingMetric) {
      // Update existing metric instead of creating a new one
      return await this.prisma.athleteMetric.update({
        where: {
          athleteMetricId: existingMetric.athleteMetricId,
        },
        data: {
          value: dto.value,
          notes: dto.notes,
        },
      });
    }

    return await this.prisma.athleteMetric.create({
      data: {
        type: dto.type as MetricType,
        date,
        value: dto.value,
        notes: dto.notes,
        athlete: {
          connect: {
            athleteId: targetAthleteId,
          },
        },
      },
    });
  }

  /**
   * Update an existing metric
   */
  async updateMetric(
    user: AuthUser,
    metricId: number,
    dto: UpdateMetricDto,
    athleteId?: Athlete['athleteId'],
  ): Promise<AthleteMetric> {
    const ability = await this.abilities.getFor({ user });

    // Get the metric first to check ownership
    const metric = await this.prisma.athleteMetric.findUnique({
      where: {
        athleteMetricId: metricId,
      },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    // If athleteId is provided, verify it matches the metric's athlete
    if (athleteId && metric.athleteId !== athleteId) {
      throw new ForbiddenException('Metric does not belong to this athlete');
    }

    // Check if user can manage this athlete's metrics
    if (
      !ability.can(
        'manage',
        subject('AthleteMetric', {
          athleteId: metric.athleteId,
        } as AthleteMetric),
      )
    ) {
      throw new ForbiddenException('Not allowed to update this metric');
    }

    return await this.prisma.athleteMetric.update({
      where: {
        athleteMetricId: metricId,
      },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  /**
   * Delete a metric
   */
  async deleteMetric(
    user: AuthUser,
    metricId: number,
    athleteId?: Athlete['athleteId'],
  ): Promise<void> {
    const ability = await this.abilities.getFor({ user });

    // Get the metric first to check ownership
    const metric = await this.prisma.athleteMetric.findUnique({
      where: {
        athleteMetricId: metricId,
      },
    });

    if (!metric) {
      throw new NotFoundException('Metric not found');
    }

    // If athleteId is provided, verify it matches the metric's athlete
    if (athleteId && metric.athleteId !== athleteId) {
      throw new ForbiddenException('Metric does not belong to this athlete');
    }

    // Check if user can manage this athlete's metrics
    if (
      !ability.can(
        'manage',
        subject('AthleteMetric', {
          athleteId: metric.athleteId,
        } as AthleteMetric),
      )
    ) {
      throw new ForbiddenException('Not allowed to delete this metric');
    }

    await this.prisma.athleteMetric.delete({
      where: {
        athleteMetricId: metricId,
      },
    });
  }

  /**
   * Get all metrics for the authenticated user or specific athlete
   * Optionally filter by type
   */
  async getMetrics(
    user: AuthUser,
    type?: MetricType,
    athleteId?: Athlete['athleteId'],
  ): Promise<AthleteMetric[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metrics to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
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
            userId: user.userId,
          },
        },
        select: {
          athleteId: true,
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const metrics = await this.prisma.athleteMetric.findMany({
      where: {
        athleteId: targetAthleteId,
        ...(type && { type }),
      },
      orderBy: [{ type: 'asc' }, { date: 'desc' }],
    });

    return metrics;
  }

  async getLatestMetrics(
    user: AuthUser,
    athleteId?: Athlete['athleteId'],
  ): Promise<Record<MetricType, AthleteMetric>> {
    const ability = await this.abilities.getFor({ user });

    let targetAthleteId: number;

    if (athleteId) {
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            userId: user.userId,
          },
        },
        select: {
          athleteId: true,
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const metrics = await this.prisma.athleteMetric.findMany({
      where: {
        athleteId: targetAthleteId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const latestByType = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.type]) {
          acc[metric.type] = metric;
        }
        return acc;
      },
      {} as Record<MetricType, AthleteMetric>,
    );

    return latestByType as Record<MetricType, AthleteMetric>;
  }

  /**
   * Get metric history for a specific type
   */
  async getMetricHistory(
    user: AuthUser,
    type: MetricType,
    athleteId?: Athlete['athleteId'],
  ): Promise<AthleteMetric[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's metrics to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
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
            userId: user.userId,
          },
        },
        select: {
          athleteId: true,
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const metrics = await this.prisma.athleteMetric.findMany({
      where: {
        athleteId: targetAthleteId,
        type,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics;
  }

  /**
   * Calculate auto-calculable metrics based on current values
   * Returns the calculated value or null if dependencies are missing
   */
  async calculateMetric(
    user: AuthUser,
    type: MetricType,
    athleteId?: Athlete['athleteId'],
  ): Promise<number | null> {
    const config = metricCalculationMap[type as MetricType];
    if (
      !config ||
      !config.canAutoCalculate ||
      !config.dependencies ||
      !config.calculate
    ) {
      return null;
    }

    // Get latest values for dependencies
    const latestMetrics = await this.getLatestMetrics(user, athleteId);
    const values: Partial<Record<MetricType, number>> = {};

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
