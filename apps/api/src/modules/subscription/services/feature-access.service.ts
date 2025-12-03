import { Injectable } from '@nestjs/common';

import { FeatureName } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class FeatureAccessService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Check if user can access a specific feature
   */
  async canAccessFeature(
    userId: number,
    featureName: FeatureName,
  ): Promise<boolean> {
    switch (featureName) {
      case FeatureName.AI_GENERATION:
      case FeatureName.AI_RPE_QUESTIONS:
        return await this.subscriptionService.hasAIFeaturesAccess(userId);
      default:
        return false;
    }
  }

  /**
   * Check if athlete or their coach can access a specific feature
   * Returns true if either the athlete or any of their coaches has access
   */
  async canAccessFeatureForAthlete(
    athleteId: number,
    featureName: FeatureName,
  ): Promise<boolean> {
    // First check if athlete has access
    const athlete = await this.prisma.athlete.findUnique({
      where: { athlete_id: athleteId },
      include: {
        user: true,
        coach_athletes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!athlete) {
      return false;
    }

    // Check athlete's subscription
    const athleteHasAccess = await this.canAccessFeature(
      athlete.user_id,
      featureName,
    );

    if (athleteHasAccess) {
      return true;
    }

    // Check all coaches' subscriptions
    for (const coachAthlete of athlete.coach_athletes) {
      const coachHasAccess = await this.canAccessFeature(
        coachAthlete.user_id,
        featureName,
      );
      if (coachHasAccess) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get max athletes for user
   */
  async getMaxAthletes(userId: number): Promise<number | null> {
    return await this.subscriptionService.getMaxAthletesForUser(userId);
  }

  /**
   * Check if user can add an athlete
   */
  async checkAthleteLimit(userId: number): Promise<boolean> {
    return await this.subscriptionService.canAddAthlete(userId);
  }
}
