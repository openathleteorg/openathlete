import { Injectable } from '@nestjs/common';

import {
  Prisma,
  event,
  event_activity,
  event_activity_normalization,
  event_activity_weather,
  sport_type,
} from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * Activity search criteria
 */
interface ActivitySearchCriteria {
  athleteId: number;
  activityId?: number;
  date?: Date; // Specific date (will search for activities on that day)
  name?: string; // Partial match, case-insensitive
  position?: 'last' | 'first'; // Most recent or oldest
  sport?: sport_type;
}

/**
 * Full activity with related data
 */
type FullActivity = event & {
  activity: event_activity & {
    weather?: event_activity_weather;
    normalization?: event_activity_normalization;
  };
};

@Injectable()
export class ActivityDetailService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a single activity based on search criteria
   */
  async findActivity(
    criteria: ActivitySearchCriteria,
  ): Promise<FullActivity | null> {
    const { athleteId, activityId, date, name, position, sport } = criteria;

    // Build where clause
    const whereClause: Prisma.eventWhereInput = {
      athlete_id: athleteId,
      type: 'ACTIVITY',
      activity: {
        isNot: null,
      },
    };

    // Filter by sport if provided
    if (sport) {
      whereClause.activity!.is = {
        sport,
      };
    }

    // If activity ID is provided, use it directly for precise lookup
    if (activityId) {
      whereClause.event_id = activityId;
    }

    // If date is provided, search for activities on that day
    if (date) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.start_date = {
        gte: date,
        lt: nextDay,
      };
    }

    // If name is provided, search by name
    if (name) {
      whereClause.name = {
        contains: name,
        mode: 'insensitive' as const,
      };
    }

    // Determine ordering
    const orderBy = position === 'first' ? 'asc' : 'desc';

    // Fetch activity with all related data
    const event = await this.prisma.event.findFirst({
      where: whereClause,
      orderBy: {
        start_date: orderBy,
      },
      include: {
        activity: {
          include: {
            weather: true,
            normalization: {
              include: {
                factors: true,
              },
            },
          },
        },
      },
    });

    if (!event || !event.activity) {
      return null;
    }

    return event as FullActivity;
  }

  /**
   * Get activity by ID (simplified method)
   */
  async getActivityById(
    athleteId: number,
    activityId: number,
  ): Promise<FullActivity | null> {
    return this.findActivity({ athleteId, activityId });
  }

  /**
   * Get most recent activity
   */
  async getLastActivity(
    athleteId: number,
    sport?: sport_type,
  ): Promise<FullActivity | null> {
    return this.findActivity({ athleteId, position: 'last', sport });
  }

  /**
   * Get activity by date
   */
  async getActivityByDate(
    athleteId: number,
    date: Date,
    sport?: sport_type,
  ): Promise<FullActivity | null> {
    return this.findActivity({ athleteId, date, sport });
  }

  /**
   * Search activities by name
   */
  async searchActivityByName(
    athleteId: number,
    name: string,
    sport?: sport_type,
  ): Promise<FullActivity | null> {
    return this.findActivity({ athleteId, name, sport });
  }
}
