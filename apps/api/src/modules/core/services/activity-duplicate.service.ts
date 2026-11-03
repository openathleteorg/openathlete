import { Injectable } from '@nestjs/common';

import { EventType, Prisma } from '@openathlete/database';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  DUPLICATE_START_TOLERANCE_MS,
  DuplicateCandidate,
  activitySource,
  isSameWorkout,
} from '../helpers/activity-duplicates';

type Db = PrismaService | Prisma.TransactionClient;

/**
 * One workout synced from two sources (say COROS and Strava) showed twice in
 * the calendar and counted twice in the training load. Imports skip the
 * second copy.
 */
@Injectable()
export class ActivityDuplicateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The athlete's activity from another source that records the same
   * workout as `candidate`, if one is saved.
   */
  async findDuplicate(
    athleteId: number,
    candidate: DuplicateCandidate,
    db: Db = this.prisma,
  ): Promise<{ eventId: number; eventActivityId: number } | null> {
    const start = candidate.startDate.getTime();
    if (!Number.isFinite(start)) return null;
    const nearby = await db.event.findMany({
      where: {
        athleteId,
        type: EventType.ACTIVITY,
        startDate: {
          gte: new Date(start - DUPLICATE_START_TOLERANCE_MS),
          lte: new Date(start + DUPLICATE_START_TOLERANCE_MS),
        },
      },
      select: {
        eventId: true,
        startDate: true,
        endDate: true,
        activity: {
          select: {
            eventActivityId: true,
            provider: true,
            externalId: true,
            movingTime: true,
          },
        },
      },
      orderBy: { eventId: 'asc' },
    });
    for (const event of nearby) {
      if (!event.activity) continue;
      const saved: DuplicateCandidate = {
        source: activitySource(event.activity),
        startDate: event.startDate,
        endDate: event.endDate,
        movingTime: event.activity.movingTime,
      };
      if (isSameWorkout(candidate, saved)) {
        return {
          eventId: event.eventId,
          eventActivityId: event.activity.eventActivityId,
        };
      }
    }
    return null;
  }
}
