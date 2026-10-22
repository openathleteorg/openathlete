import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Athlete,
  AthleteMetric,
  MetricType,
  Prisma,
} from '@openathlete/database';
import {
  CreateMetricDto,
  ImportHealthMetricsDto,
  ImportHealthMetricsResponseDto,
  UpdateMetricDto,
  metricCalculationMap,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class MetricService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /** Import only into the signed-in athlete's account, never a coach's target. */
  async importHealthMetrics(
    user: AuthUser,
    dto: ImportHealthMetricsDto,
  ): Promise<ImportHealthMetricsResponseDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
      select: { athleteId: true },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');

    const ability = await this.abilities.getFor({ user });
    if (
      !ability.can('manage', subject('AthleteMetric', athlete as AthleteMetric))
    ) {
      throw new ForbiddenException('Not allowed to import metrics');
    }

    // Consistent lock order for concurrent historical imports.
    const rows = [...dto.metrics]
      .sort((a, b) =>
        `${a.date}:${a.type}`.localeCompare(`${b.date}:${b.type}`),
      )
      .map((metric) => ({
        athleteId: athlete.athleteId,
        type: metric.type as MetricType,
        // A calendar date is a bucket, not a local-midnight timestamp.
        date: new Date(`${metric.date}T00:00:00.000Z`),
        value: metric.value,
        source: dto.source,
        sourceMetadata: {
          timeZone: dto.timeZone,
          unit: metric.unit,
          ...(metric.sampleCount !== undefined && {
            sampleCount: metric.sampleCount,
          }),
        },
      }));

    // Insert missing dates, then update only rows owned by this source.
    // Keeping source in the UPDATE predicate protects manual/provider edits
    // even if they race with this request. A failed batch rolls back entirely.
    const [, ...updates] = await this.prisma.$transaction([
      this.prisma.athleteMetric.createMany({
        data: rows,
        skipDuplicates: true,
      }),
      ...rows.map((row) =>
        this.prisma.athleteMetric.updateMany({
          where: {
            athleteId: row.athleteId,
            type: row.type,
            date: row.date,
            source: row.source,
          },
          data: { value: row.value, sourceMetadata: row.sourceMetadata },
        }),
      ),
    ]);
    const imported = updates.reduce((count, update) => count + update.count, 0);
    return { imported, skipped: rows.length - imported };
  }

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
          source: null,
          sourceMetadata: Prisma.DbNull,
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
        source: null,
        sourceMetadata: Prisma.DbNull,
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

      if (!ability.can('read', subject('Athlete', athlete))) {
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

      if (!ability.can('read', subject('Athlete', athlete))) {
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

      if (!ability.can('read', subject('Athlete', athlete))) {
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
