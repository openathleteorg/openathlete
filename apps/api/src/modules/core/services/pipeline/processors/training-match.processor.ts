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
    const activity = await this.prisma.event_activity.findUnique({
      where: { event_activity_id: ctx.eventActivityId },
      include: {
        event: {
          select: {
            event_id: true,
            start_date: true,
            end_date: true,
            athlete_id: true,
          },
        },
        related_training: {
          select: {
            event_training_id: true,
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
    if (activity.related_training) {
      this.logger.debug(
        `Activity ${ctx.eventActivityId} is already linked to a training`,
      );
      return;
    }

    const activityDate = new Date(activity.event.start_date);
    const dayStart = new Date(activityDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(activityDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all training sessions scheduled for the same day
    const trainingSessions = await this.prisma.event_training.findMany({
      where: {
        event: {
          athlete_id: activity.event.athlete_id,
          start_date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        related_activity_id: null, // Not already linked to an activity
      },
      include: {
        event: {
          select: {
            event_id: true,
            start_date: true,
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
        `Training ${training.event_training_id} (${training.event.name}) match score: ${score}%`,
      );

      if (score >= TRAINING_MATCH_THRESHOLD) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { training, score };
        }
      }
    }

    // Link activity to best matching training
    if (bestMatch) {
      await this.prisma.event_training.update({
        where: {
          event_training_id: bestMatch.training.event_training_id,
        },
        data: {
          related_activity_id: ctx.eventActivityId,
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
      moving_time: number;
    },
    training: {
      sport: string;
      goal_distance: number | null;
      goal_duration: number | null;
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
    if (training.goal_duration !== null && training.goal_duration > 0) {
      totalWeight += durationWeight;
      const durationRatio = Math.min(
        activity.moving_time / training.goal_duration,
        training.goal_duration / activity.moving_time,
      );
      achievedScore += durationRatio * durationWeight;
    }

    // Distance matching (30% weight if specified)
    const distanceWeight = 30;
    if (training.goal_distance !== null && training.goal_distance > 0) {
      totalWeight += distanceWeight;
      const distanceRatio = Math.min(
        activity.distance / training.goal_distance,
        training.goal_distance / activity.distance,
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
