import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '@openathlete/database';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TRAINING_MATCH_THRESHOLD } from '../constants';
import { ActivityPipelineContext, ActivityProcessor } from '../types';
import { MatchMetrics, calculateMatchScore } from './training-match.score';

/** A workout's steps, with their repeat blocks' children */
const WORKOUT_STEPS_INCLUDE = {
  steps: {
    include: {
      targets: true,
      repeatBlock: {
        include: {
          childSteps: {
            include: { targets: true },
            orderBy: { orderIndex: 'asc' as const },
          },
        },
      },
    },
    orderBy: { orderIndex: 'asc' as const },
  },
} satisfies Prisma.WorkoutInclude;

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

    const activityDate = new Date(activity.event.startDate);
    const dayStart = new Date(activityDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(activityDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all training sessions scheduled for the same day
    const trainingSessions = await this.prisma.eventTraining.findMany({
      where: {
        event: {
          athleteId: activity.event.athleteId,
          startDate: {
            gte: dayStart,
            lte: dayEnd,
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
        // Lap-button and other open-ended steps make the planned totals minimums
        workout: { include: WORKOUT_STEPS_INCLUDE },
      },
    });

    if (trainingSessions.length === 0) {
      this.logger.debug(
        `No unlinked training sessions found for activity ${ctx.eventActivityId} on ${activityDate.toISOString()}`,
      );
      return;
    }

    // The athlete's paces estimate the workouts' totals, as in the app
    const { athleteId } = activity.event;
    const metrics =
      athleteId !== null &&
      trainingSessions.some((training) => training.workout)
        ? await this.latestMetrics(athleteId)
        : {};

    // Calculate match score for each training session
    let bestMatch: {
      training: (typeof trainingSessions)[0];
      score: number;
    } | null = null;

    for (const training of trainingSessions) {
      const score = calculateMatchScore(activity, training, metrics);

      this.logger.debug(
        `Training ${training.eventTrainingId} (${training.event.name}) match score: ${score}%`,
      );

      if (score >= TRAINING_MATCH_THRESHOLD) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { training, score };
        }
      }
    }

    // Link activity to best matching training
    if (bestMatch) {
      await this.prisma.eventTraining.update({
        where: {
          eventTrainingId: bestMatch.training.eventTrainingId,
        },
        data: {
          relatedActivityId: ctx.eventActivityId,
        },
      });

      this.logger.log(
        `Ã¢Å“â€œ Activity ${ctx.eventActivityId} automatically linked to training "${bestMatch.training.event.name}" (score: ${bestMatch.score}%)`,
      );
    } else {
      this.logger.debug(
        `No training session matched threshold (${TRAINING_MATCH_THRESHOLD}%) for activity ${ctx.eventActivityId}`,
      );
    }
  }

  /** The athlete's latest value of each metric, as the app reads them */
  private async latestMetrics(athleteId: number): Promise<MatchMetrics> {
    const metrics = await this.prisma.athleteMetric.findMany({
      where: { athleteId },
      orderBy: { date: 'desc' },
      select: { type: true, value: true },
    });
    const latest: MatchMetrics = {};
    for (const { type, value } of metrics) {
      latest[type] ??= { value };
    }
    return latest;
  }
}
