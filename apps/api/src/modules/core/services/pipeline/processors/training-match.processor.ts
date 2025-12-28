import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TRAINING_MATCH_THRESHOLD } from '../constants';
import { ActivityPipelineContext, ActivityProcessor } from '../types';

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
      },
    });

    if (trainingSessions.length === 0) {
      this.logger.debug(
        `No unlinked training sessions found for activity ${ctx.eventActivityId} on ${activityDate.toISOString()}`,
      );
      return;
    }

    // Calculate match score for each training session
    let bestMatch: {
      training: (typeof trainingSessions)[0];
      score: number;
    } | null = null;

    for (const training of trainingSessions) {
      const score = this.calculateMatchScore(activity, training);

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
        `✓ Activity ${ctx.eventActivityId} automatically linked to training "${bestMatch.training.event.name}" (score: ${bestMatch.score}%)`,
      );
    } else {
      this.logger.debug(
        `No training session matched threshold (${TRAINING_MATCH_THRESHOLD}%) for activity ${ctx.eventActivityId}`,
      );
    }
  }

  /**
   * Calculate match score between an activity and a training session
   * Returns a percentage (0-100)
   *
   * Criteria:
   * - Sport match: 40% weight
   * - Duration match: 30% weight (if goal_duration specified)
   * - Distance match: 30% weight (if goal_distance specified)
   *
   * If duration or distance are not specified in training, those points are redistributed
   */
  private calculateMatchScore(
    activity: {
      sport: string;
      distance: number;
      movingTime: number;
    },
    training: {
      sport: string;
      goalDistance: number | null;
      goalDuration: number | null;
    },
  ): number {
    let totalWeight = 0;
    let achievedScore = 0;

    // Sport matching (40% weight)
    const sportWeight = 40;
    totalWeight += sportWeight;
    if (activity.sport === training.sport) {
      achievedScore += sportWeight;
    }

    // Duration matching (30% weight if specified)
    const durationWeight = 30;
    if (training.goalDuration !== null && training.goalDuration > 0) {
      totalWeight += durationWeight;
      const durationRatio = Math.min(
        activity.movingTime / training.goalDuration,
        training.goalDuration / activity.movingTime,
      );
      achievedScore += durationRatio * durationWeight;
    }

    // Distance matching (30% weight if specified)
    const distanceWeight = 30;
    if (training.goalDistance !== null && training.goalDistance > 0) {
      totalWeight += distanceWeight;
      const distanceRatio = Math.min(
        activity.distance / training.goalDistance,
        training.goalDistance / activity.distance,
      );
      achievedScore += distanceRatio * distanceWeight;
    }

    // If neither duration nor distance is specified, redistribute to sport
    if (totalWeight === sportWeight) {
      // Only sport was weighted, make it 100%
      return activity.sport === training.sport ? 100 : 0;
    }

    // Calculate percentage
    return Math.round((achievedScore / totalWeight) * 100);
  }
}
