import { subject } from '@casl/ability';

import { ForbiddenException, Injectable } from '@nestjs/common';

import { Athlete, EventType, SportType } from '@openathlete/database';
import { GetProgressionDataResponseDto } from '@openathlete/shared';

import {
  addDaysToDateKey,
  validTimeZone,
  zonedClock,
} from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/** Average of the values that exist, or `fallback` */
function average(values: (number | null)[], fallback: number | null = null) {
  const present = values.filter((value): value is number => value !== null);
  return present.length
    ? present.reduce((sum, value) => sum + value, 0) / present.length
    : fallback;
}

@Injectable()
export class ProgressionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /**
   * The athlete if the user may read their data. A check on the athlete
   * itself: being allowed to read some athlete is not enough.
   */
  private async readableAthlete(user: AuthUser, athleteId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
      include: { user: { select: { timeZone: true } } },
    });
    const ability = await this.abilities.getFor({ user });
    if (!athlete || !ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    return athlete;
  }

  async getFirstActivityDate(
    user: AuthUser,
    athleteId: Athlete['athleteId'],
    sport?: SportType,
  ): Promise<Date | null> {
    await this.readableAthlete(user, athleteId);
    const first = await this.prisma.event.findFirst({
      where: {
        athleteId,
        type: EventType.ACTIVITY,
        activity: sport ? { is: { sport } } : { isNot: null },
      },
      orderBy: { startDate: 'asc' },
      select: { startDate: true },
    });
    return first?.startDate ?? null;
  }

  /**
   * Weekly (up to 120 days) or monthly averages of the activities of a
   * period. Periods follow the athlete's calendar: their weeks and months
   * start at their local midnight, and are returned as local dates
   * (YYYY-MM-DD).
   */
  async getProgressionData(
    user: AuthUser,
    athleteId: Athlete['athleteId'],
    startDate: Date,
    endDate: Date,
    sport?: SportType,
  ): Promise<GetProgressionDataResponseDto> {
    const athlete = await this.readableAthlete(user, athleteId);
    const timeZone = validTimeZone(athlete.user.timeZone);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const aggregationType: 'week' | 'month' =
      daysDiff <= 120 ? 'week' : 'month';

    // Only the figures averaged: a whole activity row holds its recording
    const activities = await this.prisma.eventActivity.findMany({
      where: {
        ...(sport && { sport }),
        event: { athleteId, startDate: { gte: startDate, lte: endDate } },
      },
      select: {
        distance: true,
        elevationGain: true,
        averageSpeed: true,
        averageGapSpeed: true,
        averageHeartrate: true,
        averageCadence: true,
        event: { select: { startDate: true } },
      },
    });

    const grouped = new Map<string, typeof activities>();
    for (const activity of activities) {
      const day = zonedClock(activity.event.startDate, timeZone).date;
      const weekday = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
      const period =
        aggregationType === 'week'
          ? addDaysToDateKey(day, -weekday)
          : `${day.slice(0, 7)}-01`;
      grouped.set(period, [...(grouped.get(period) ?? []), activity]);
    }

    const data = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, items]) => {
        const totalDistance = items.reduce(
          (sum, a) => sum + (a.distance || 0),
          0,
        );
        const totalElevationGain = items.reduce(
          (sum, a) => sum + (a.elevationGain || 0),
          0,
        );
        const activityCount = items.length;
        const averageGapSpeed = average(items.map((a) => a.averageGapSpeed));
        const averageHeartrate = average(items.map((a) => a.averageHeartrate));
        return {
          period,
          totalDistance,
          averageDistancePerActivity: totalDistance / activityCount,
          averageSpeed: average(
            items.map((a) => a.averageSpeed),
            0,
          )!,
          averageGapSpeed,
          // Speed for each heartbeat: rises as aerobic fitness improves
          efficiency:
            averageHeartrate !== null &&
            averageGapSpeed !== null &&
            averageHeartrate > 0
              ? averageGapSpeed / averageHeartrate
              : null,
          totalElevationGain,
          averageElevationGainPerActivity: totalElevationGain / activityCount,
          averageHeartrate,
          averageCadence: average(items.map((a) => a.averageCadence)),
          activityCount,
        };
      });

    return { data, aggregationType };
  }
}
