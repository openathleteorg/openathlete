import { ForbiddenException, Injectable } from '@nestjs/common';

import {
  Prisma,
  athlete,
  event,
  event_activity,
  event_type,
  sport_type,
} from '@openathlete/database';
import { GetProgressionDataResponseDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class ProgressionService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async getFirstActivityDate(
    user: AuthUser,
    athleteId: athlete['athlete_id'],
    sport?: sport_type,
  ): Promise<Date | null> {
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', 'athlete')) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    const whereClause: Prisma.eventWhereInput = {
      athlete_id: athleteId,
      type: event_type.ACTIVITY,
      activity: {
        isNot: null,
      },
    };

    if (sport) {
      whereClause.activity = {
        isNot: null,
        is: {
          sport,
        },
      };
    }

    const firstEvent = await this.prisma.event.findFirst({
      where: whereClause,
      orderBy: {
        start_date: 'asc',
      },
      select: {
        start_date: true,
      },
    });

    return firstEvent?.start_date ? new Date(firstEvent.start_date) : null;
  }

  async getProgressionData(
    user: AuthUser,
    athleteId: athlete['athlete_id'],
    startDate: Date,
    endDate: Date,
    sport?: sport_type,
  ): Promise<GetProgressionDataResponseDto> {
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', 'athlete')) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const aggregationType: 'week' | 'month' =
      daysDiff <= 120 ? 'week' : 'month';

    // Build where clause
    const whereClause: Prisma.eventWhereInput = {
      athlete_id: athleteId,
      type: event_type.ACTIVITY,
      start_date: {
        gte: startDate,
        lte: endDate,
      },
      activity: {
        isNot: null,
      },
    };

    // Filter by sport if provided
    if (sport) {
      whereClause.activity = {
        isNot: null,
        is: {
          sport,
        },
      };
    }

    // Fetch all activities in the period
    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        activity: true,
      },
      orderBy: {
        start_date: 'asc',
      },
    });

    // Filter to only events with activities
    const activities = events.filter(
      (e): e is event & { activity: event_activity } => e.activity !== null,
    );

    if (activities.length === 0) {
      return {
        data: [],
        aggregationType,
      };
    }

    // Group activities by period
    const grouped = new Map<string, typeof activities>();

    activities.forEach((event) => {
      const eventDate = new Date(event.start_date);
      let periodKey: string;

      if (aggregationType === 'week') {
        // Get start of week (Monday)
        const weekStart = new Date(eventDate);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        periodKey = weekStart.toISOString();
      } else {
        // Get start of month
        const monthStart = new Date(
          eventDate.getFullYear(),
          eventDate.getMonth(),
          1,
        );
        monthStart.setHours(0, 0, 0, 0);
        periodKey = monthStart.toISOString();
      }

      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, []);
      }
      grouped.get(periodKey)!.push(event);
    });

    // Calculate metrics for each period
    const data = Array.from(grouped.entries())
      .map(([period, periodActivities]) => {
        const totalDistance = periodActivities.reduce(
          (sum, e) => sum + (e.activity.distance || 0),
          0,
        );
        const totalElevationGain = periodActivities.reduce(
          (sum, e) => sum + (e.activity.elevation_gain || 0),
          0,
        );
        const activityCount = periodActivities.length;

        // Calculate averages
        const speeds = periodActivities
          .map((e) => e.activity.average_speed)
          .filter((s): s is number => s !== null && s !== undefined);
        const averageSpeed =
          speeds.length > 0
            ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
            : 0;

        const gapSpeeds = periodActivities
          .map((e) => e.activity.average_gap_speed)
          .filter((g): g is number => g !== null && g !== undefined);
        const averageGapSpeed =
          gapSpeeds.length > 0
            ? gapSpeeds.reduce((sum, g) => sum + g, 0) / gapSpeeds.length
            : null;

        const heartrates = periodActivities
          .map((e) => e.activity.average_heartrate)
          .filter((h): h is number => h !== null && h !== undefined);
        const averageHeartrate =
          heartrates.length > 0
            ? heartrates.reduce((sum, h) => sum + h, 0) / heartrates.length
            : null;

        const cadences = periodActivities
          .map((e) => e.activity.average_cadence)
          .filter((c): c is number => c !== null && c !== undefined);
        const averageCadence =
          cadences.length > 0
            ? cadences.reduce((sum, c) => sum + c, 0) / cadences.length
            : null;

        // Calculate efficiency: gap / hr average (if both available)
        const efficiency =
          averageHeartrate !== null &&
          averageGapSpeed !== null &&
          averageHeartrate > 0
            ? averageGapSpeed / averageHeartrate
            : null;

        return {
          period,
          totalDistance,
          averageDistancePerActivity:
            activityCount > 0 ? totalDistance / activityCount : 0,
          averageSpeed,
          averageGapSpeed,
          efficiency,
          totalElevationGain,
          averageElevationGainPerActivity:
            activityCount > 0 ? totalElevationGain / activityCount : 0,
          averageHeartrate,
          averageCadence,
          activityCount,
        };
      })
      .sort(
        (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime(),
      );

    return {
      data,
      aggregationType,
    };
  }
}
