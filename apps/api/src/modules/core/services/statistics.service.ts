import { ForbiddenException, Injectable } from '@nestjs/common';

import {
  Athlete,
  Event,
  EventActivity,
  EventType,
} from '@openathlete/database';
import { SPORT_TYPE } from '@openathlete/shared';
import { GetStatisticsForPeriodDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  private computeBasicStatisticsForActivities(
    activities: (Event & { activity: EventActivity | null })[],
  ): {
    duration: number;
    distance: number;
    elevationGain: number;
    count: number;
  } {
    const duration = activities.reduce((acc, activity) => {
      const start = new Date(activity.startDate);
      const end = new Date(activity.endDate);
      const diff = end.getTime() - start.getTime();
      const seconds = diff / 1000;
      return acc + seconds;
    }, 0);
    const distance = activities.reduce((acc, activity) => {
      if (activity.activity?.distance) {
        return acc + activity.activity.distance;
      }
      return acc;
    }, 0);
    const elevationGain = activities.reduce((acc, activity) => {
      if (activity.activity?.elevationGain) {
        return acc + activity.activity.elevationGain;
      }
      return acc;
    }, 0);

    return {
      duration,
      distance,
      elevationGain,
      count: activities.length,
    };
  }

  async getStatisticsForPeriod(
    user: AuthUser,
    athleteId: Athlete['athleteId'],
    startDate: Date,
    endDate: Date,
  ): Promise<GetStatisticsForPeriodDto> {
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', 'athlete')) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    const events = await this.prisma.event.findMany({
      where: {
        athleteId: athleteId,
        type: EventType.ACTIVITY,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        activity: true,
      },
    });

    const groupedBySport = events.reduce(
      (acc, event) => {
        const sport = event.activity?.sport as SPORT_TYPE;
        if (!acc[sport]) {
          acc[sport] = [];
        }
        acc[sport].push(event);
        return acc;
      },
      {} as Record<SPORT_TYPE, (Event & { activity: EventActivity | null })[]>,
    );

    const sportStatistics = Object.entries(groupedBySport).map(
      ([sport, events]) => {
        return {
          sport: sport as SPORT_TYPE,
          ...this.computeBasicStatisticsForActivities(events),
        };
      },
    );

    return {
      ...this.computeBasicStatisticsForActivities(events),
      sports: sportStatistics,
    };
  }
}
