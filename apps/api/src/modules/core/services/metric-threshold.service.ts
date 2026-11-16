import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MetricType } from '@openathlete/database';
import {
  MetricThresholdDto,
  SetMetricThresholdsDto,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const select = {
  metricThresholdId: true,
  athleteId: true,
  metricType: true,
  min: true,
  max: true,
} as const;

/**
 * Bounds a coach watches on their athletes' daily metrics. The dashboard
 * flags a value past them; MetricThresholdScheduler notifies the coach once
 * per new value.
 */
@Injectable()
export class MetricThresholdService {
  constructor(private readonly prisma: PrismaService) {}

  private assertCoaches(user: AuthUser, athleteIds: number[]) {
    const coached = new Set(
      (user.coachAthletes ?? []).map((link) => link.athleteId),
    );
    if (athleteIds.some((athleteId) => !coached.has(athleteId))) {
      throw new ForbiddenException('Only for athletes you coach');
    }
  }

  async list(
    user: AuthUser,
    athleteId?: number,
  ): Promise<MetricThresholdDto[]> {
    if (athleteId !== undefined) this.assertCoaches(user, [athleteId]);
    return this.prisma.coachMetricThreshold.findMany({
      where: {
        coachUserId: user.userId,
        ...(athleteId !== undefined && { athleteId }),
      },
      orderBy: [{ athleteId: 'asc' }, { metricType: 'asc' }],
      select,
    });
  }

  /** Sets the same bounds for each athlete, replacing those they had */
  async set(
    user: AuthUser,
    dto: SetMetricThresholdsDto,
  ): Promise<MetricThresholdDto[]> {
    const athleteIds = [...new Set(dto.athleteIds)];
    this.assertCoaches(user, athleteIds);
    if (!(Object.values(MetricType) as string[]).includes(dto.metricType)) {
      throw new BadRequestException('Unknown metric');
    }
    const metricType = dto.metricType as MetricType;

    // Values already there were seen: only the next ones notify
    const now = new Date();

    return this.prisma.$transaction(
      athleteIds.map((athleteId) =>
        this.prisma.coachMetricThreshold.upsert({
          where: {
            coachUserId_athleteId_metricType: {
              coachUserId: user.userId,
              athleteId,
              metricType,
            },
          },
          create: {
            coachUserId: user.userId,
            athleteId,
            metricType,
            min: dto.min ?? null,
            max: dto.max ?? null,
            lastCheckedAt: now,
          },
          update: {
            min: dto.min ?? null,
            max: dto.max ?? null,
            lastCheckedAt: now,
          },
          select,
        }),
      ),
    );
  }

  async delete(user: AuthUser, metricThresholdId: number): Promise<void> {
    const { count } = await this.prisma.coachMetricThreshold.deleteMany({
      where: { metricThresholdId, coachUserId: user.userId },
    });
    if (count === 0) throw new NotFoundException('Threshold not found');
  }
}
