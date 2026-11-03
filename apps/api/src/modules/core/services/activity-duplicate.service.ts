import { Injectable, Logger, Optional } from '@nestjs/common';

import { EventType, Prisma } from '@openathlete/database';

import { CalendarWebSocketService } from '../../calendar/services/calendar-websocket.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import {
  DUPLICATE_START_TOLERANCE_MS,
  DuplicateCandidate,
  SavedActivity,
  activitySource,
  findDuplicateGroups,
  isSameWorkout,
  pickActivityToKeep,
} from '../helpers/activity-duplicates';
import { EventService } from './event.service';

type Db = PrismaService | Prisma.TransactionClient;

type GroupedActivity = SavedActivity & {
  eventId: number;
  relatedTrainingId: number | null;
  relatedCompetitionId: number | null;
};

/**
 * One workout synced from two sources (say COROS and Strava) showed twice in
 * the calendar and counted twice in the training load. Imports skip the
 * second copy, and the athlete can remove the copies saved before.
 */
@Injectable()
export class ActivityDuplicateService {
  private readonly logger = new Logger(ActivityDuplicateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventService,
    @Optional()
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {}

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

  /**
   * Keeps one activity of each group of copies and deletes the others the
   * way deleting an event does. Running it again finds nothing left to do.
   */
  async removeDuplicates(
    athleteId: number,
  ): Promise<{ groups: number; removed: number }> {
    const events = await this.prisma.event.findMany({
      where: { athleteId, type: EventType.ACTIVITY, activity: { isNot: null } },
      select: {
        eventId: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        activity: {
          select: {
            eventActivityId: true,
            provider: true,
            externalId: true,
            movingTime: true,
            relatedTraining: { select: { eventTrainingId: true } },
            relatedCompetition: { select: { eventCompetitionId: true } },
            messageThread: {
              select: { _count: { select: { messages: true } } },
            },
            _count: {
              select: {
                feedbackQuestions: { where: { answerText: { not: null } } },
              },
            },
          },
        },
      },
    });

    const activities: GroupedActivity[] = events.flatMap((event) => {
      const activity = event.activity;
      if (!activity) return [];
      return [
        {
          eventId: event.eventId,
          eventActivityId: activity.eventActivityId,
          source: activitySource(activity),
          startDate: event.startDate,
          endDate: event.endDate,
          movingTime: activity.movingTime,
          createdAt: event.createdAt,
          relatedTrainingId: activity.relatedTraining?.eventTrainingId ?? null,
          relatedCompetitionId:
            activity.relatedCompetition?.eventCompetitionId ?? null,
          linkedToPlan: Boolean(
            activity.relatedTraining || activity.relatedCompetition,
          ),
          hasConversation:
            (activity.messageThread?._count.messages ?? 0) > 0 ||
            activity._count.feedbackQuestions > 0,
        },
      ];
    });

    const groups = findDuplicateGroups(activities);
    let removed = 0;
    for (const group of groups) {
      const kept = pickActivityToKeep(group);
      const others = group.filter((activity) => activity !== kept);
      await this.moveLinks(kept, others);
      for (const activity of others) {
        await this.events.removeEvent(activity.eventId, { notify: false });
        removed++;
      }
    }

    this.logger.log(
      `Athlete ${athleteId}: ${removed} duplicate activities removed in ${groups.length} groups`,
    );
    if (removed > 0) {
      // One refresh for the whole cleanup: the calendar and the training
      // load, which is computed from the remaining activities
      this.calendarWebSocketService?.notifyWeeklyLoadUpdated(athleteId, {
        reason: 'event_deleted',
      });
    }
    return { groups: groups.length, removed };
  }

  /**
   * The planned session a deleted copy was linked to stays done: its link
   * moves to the kept copy when that one has none.
   */
  private async moveLinks(kept: GroupedActivity, others: GroupedActivity[]) {
    if (kept.relatedTrainingId === null) {
      const linked = others.find((other) => other.relatedTrainingId !== null);
      if (linked?.relatedTrainingId) {
        await this.prisma.eventTraining.update({
          where: { eventTrainingId: linked.relatedTrainingId },
          data: { relatedActivityId: kept.eventActivityId },
        });
      }
    }
    if (kept.relatedCompetitionId === null) {
      const linked = others.find(
        (other) => other.relatedCompetitionId !== null,
      );
      if (linked?.relatedCompetitionId) {
        await this.prisma.eventCompetition.update({
          where: { eventCompetitionId: linked.relatedCompetitionId },
          data: { relatedActivityId: kept.eventActivityId },
        });
      }
    }
  }
}
