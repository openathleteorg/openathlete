import { Injectable, Logger } from '@nestjs/common';

import {
  addDaysToDateKey,
  startOfZonedDay,
  validTimeZone,
  zonedClock,
} from 'src/common/utils/time-zone';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ActivityPipelineContext, ActivityProcessor } from '../types';
import { pickTraining } from './training-match.score';

@Injectable()
export class TrainingMatchProcessor implements ActivityProcessor {
  name = 'training-match';
  private readonly logger = new Logger(TrainingMatchProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ActivityPipelineContext) {
    this.logger.log(
      `Training match processor running for activity ${ctx.eventActivityId}`,
    );

    // Load the imported activity
    const activity = await this.prisma.eventActivity.findUnique({
      where: { eventActivityId: ctx.eventActivityId },
      include: {
        event: {
          select: {
            eventId: true,
            startDate: true,
            endDate: true,
            athleteId: true,
            athlete: { select: { user: { select: { timeZone: true } } } },
          },
        },
        relatedTraining: {
          select: {
            eventTrainingId: true,
          },
        },
      },
    });

    if (!activity || !activity.event) {
      this.logger.warn(
        `Activity ${ctx.eventActivityId} not found or has no event`,
      );
      return;
    }

    // Skip if activity is already linked to a training
    if (activity.relatedTraining) {
      this.logger.debug(
        `Activity ${ctx.eventActivityId} is already linked to a training`,
      );
      return;
    }

    // The calendar day is the athlete's, not the server's: an evening
    // activity must not be matched against the next day's sessions
    const activityDate = new Date(activity.event.startDate);
    const timeZone = validTimeZone(activity.event.athlete?.user.timeZone);
    const { date } = zonedClock(activityDate, timeZone);
    const dayStart = startOfZonedDay(date, timeZone);
    const dayEnd = startOfZonedDay(addDaysToDateKey(date, 1), timeZone);

    // Find all training sessions scheduled for the same day
    const trainingSessions = await this.prisma.eventTraining.findMany({
      where: {
        event: {
          athleteId: activity.event.athleteId,
          startDate: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        relatedActivityId: null, // Not already linked to an activity
      },
      include: {
        event: {
          select: {
            eventId: true,
            startDate: true,
            name: true,
          },
        },
      },
      orderBy: { event: { startDate: 'asc' } },
    });

    // Same sport, enough of the session done; the closest one if several
    const match = pickTraining(
      { ...activity, startDate: activityDate },
      trainingSessions.map((training) => ({
        ...training,
        startDate: training.event.startDate,
      })),
    );

    if (!match) {
      this.logger.debug(
        `No training session matched activity ${ctx.eventActivityId} on ${date}`,
      );
      return;
    }

    await this.prisma.eventTraining.update({
      where: {
        eventTrainingId: match.training.eventTrainingId,
      },
      data: {
        relatedActivityId: ctx.eventActivityId,
      },
    });

    this.logger.log(
      `✓ Activity ${ctx.eventActivityId} automatically linked to training "${match.training.event.name}" (score: ${match.score}%)`,
    );
  }
}
