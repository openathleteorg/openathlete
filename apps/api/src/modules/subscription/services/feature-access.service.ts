import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ClubRole } from '@openathlete/database';
import {
  ApiEnvSchemaType,
  FEATURE_LOCKED_ERROR,
  Feature,
  FeatureAccessDto,
  FeatureAccessMap,
  FeatureName,
  FeaturePerks,
  featureAccess,
  featureAccessMap,
} from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';

/** Where a feature is used: in a club, the owner's rights count too */
export interface FeatureContext {
  clubId?: number | null;
}

const NO_PERKS: FeaturePerks = { supporterPerks: false, coachTools: false };

@Injectable()
export class FeatureAccessService {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  /**
   * Today for the feature registry. FEATURES_CLOCK moves it, for the E2E
   * tests and local reviews of early access; billing still decides first.
   */
  now(): Date {
    const clock = this.configService.get('FEATURES_CLOCK', { infer: true });
    return clock ? new Date(`${clock}T12:00:00Z`) : new Date();
  }

  /** The user's own perks, from their subscription */
  async perksOf(userId: number): Promise<FeaturePerks> {
    const subscription =
      await this.subscriptionService.getOrCreateSubscription(userId);
    const { supporterPerks, coachTools } =
      this.subscriptionService.entitlements(subscription);
    return { supporterPerks, coachTools };
  }

  /**
   * A club's rights come from its owner: a Supporter owner gives the
   * club's staff the coach tools, in the club.
   */
  async clubPerks(clubId: number): Promise<FeaturePerks> {
    const owner = await this.prisma.clubMember.findFirst({
      where: { clubId, role: ClubRole.OWNER },
      select: { userId: true },
    });
    if (!owner) return NO_PERKS;
    const perks = await this.perksOf(owner.userId);
    return {
      supporterPerks: perks.supporterPerks,
      coachTools: perks.coachTools || perks.supporterPerks,
    };
  }

  private async perksIn(
    userId: number,
    context: FeatureContext,
  ): Promise<FeaturePerks> {
    const own = await this.perksOf(userId);
    if (!context.clubId) return own;
    const club = await this.clubPerks(context.clubId);
    // Never less than the user's own rights
    return {
      supporterPerks: own.supporterPerks,
      coachTools: own.coachTools || club.coachTools,
    };
  }

  async access(
    userId: number,
    feature: Feature,
    context: FeatureContext = {},
  ): Promise<FeatureAccessDto> {
    const billingEnabled = this.stripeService.billingEnabled;
    // Without billing nothing is locked: no database read needed
    const perks = billingEnabled
      ? await this.perksIn(userId, context)
      : NO_PERKS;
    return featureAccess(feature, { billingEnabled, perks, now: this.now() });
  }

  async can(
    userId: number,
    feature: Feature,
    context: FeatureContext = {},
  ): Promise<boolean> {
    return (await this.access(userId, feature, context)).available;
  }

  /** Throws the 403 the app turns into the feature's paywall */
  async assert(
    userId: number,
    feature: Feature,
    context: FeatureContext = {},
  ): Promise<void> {
    if (!(await this.can(userId, feature, context))) {
      throw featureLockedException(feature);
    }
  }

  /**
   * A coach tool the user may use on these athletes: with their own rights,
   * or for athletes they reach only through clubs whose owner is a
   * Supporter. Without athletes (a whole dashboard): their own rights, or
   * staff of such a club.
   */
  async canAsCoach(
    userId: number,
    feature: Feature,
    athletes: { athleteIds?: number[]; athleteUserIds?: number[] } = {},
  ): Promise<boolean> {
    const own = await this.access(userId, feature);
    if (own.available) return true;
    if (own.reason !== 'locked') return false;

    const ids = athletes.athleteIds ?? [];
    const userIds = athletes.athleteUserIds ?? [];
    if (ids.length === 0 && userIds.length === 0) {
      const staffOf = await this.prisma.clubMember.findMany({
        where: { userId, role: { not: ClubRole.ATHLETE } },
        select: { clubId: true },
      });
      for (const { clubId } of staffOf) {
        if ((await this.clubPerks(clubId)).coachTools) return true;
      }
      return false;
    }

    const links = await this.prisma.coachAthlete.findMany({
      where: {
        userId,
        clubId: { not: null },
        OR: [
          ...(ids.length ? [{ athleteId: { in: ids } }] : []),
          ...(userIds.length ? [{ athlete: { userId: { in: userIds } } }] : []),
        ],
      },
      select: {
        athleteId: true,
        clubId: true,
        athlete: { select: { userId: true } },
      },
    });
    const clubs = new Map<number, boolean>();
    const covered = new Set<string>();
    for (const link of links) {
      const clubId = link.clubId as number;
      if (!clubs.has(clubId)) {
        clubs.set(clubId, (await this.clubPerks(clubId)).coachTools);
      }
      if (clubs.get(clubId)) {
        covered.add(`a${link.athleteId}`);
        covered.add(`u${link.athlete.userId}`);
      }
    }
    return (
      ids.every((id) => covered.has(`a${id}`)) &&
      userIds.every((id) => covered.has(`u${id}`))
    );
  }

  /** canAsCoach, or the 403 the app turns into the paywall */
  async assertAsCoach(
    userId: number,
    feature: Feature,
    athletes: { athleteIds?: number[]; athleteUserIds?: number[] } = {},
  ): Promise<void> {
    if (!(await this.canAsCoach(userId, feature, athletes))) {
      throw featureLockedException(feature);
    }
  }

  /**
   * Whether a club may grow: new members, invitations, join links and
   * sessions need a Supporter owner. What the club has keeps running.
   */
  async clubIsOpen(clubId: number): Promise<boolean> {
    if (!this.stripeService.billingEnabled) return true;
    return (await this.clubPerks(clubId)).supporterPerks;
  }

  /** clubIsOpen, or the 403 the app turns into the Clubs paywall */
  async assertClubOpen(clubId: number): Promise<void> {
    if (!(await this.clubIsOpen(clubId))) {
      throw featureLockedException(Feature.CLUBS);
    }
  }

  /** Every feature for the user, as the app reads it */
  async accessMap(userId: number): Promise<FeatureAccessMap> {
    const billingEnabled = this.stripeService.billingEnabled;
    const perks = billingEnabled ? await this.perksOf(userId) : NO_PERKS;
    // Staff of a club whose owner is a Supporter get the coach tools there:
    // the app shows them unlocked, the API checks each athlete
    if (billingEnabled && !perks.coachTools) {
      perks.coachTools = await this.canAsCoach(userId, Feature.COACH_COLUMNS);
    }
    return featureAccessMap({ billingEnabled, perks, now: this.now() });
  }

  /**
   * AI on the instance keys (FeatureName): a matter of hostedAi, not of the
   * perks of FEATURES.
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
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: athleteId },
      include: {
        user: true,
        coachAthletes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!athlete) {
      return false;
    }

    if (await this.canAccessFeature(athlete.userId, featureName)) {
      return true;
    }

    for (const coachAthlete of athlete.coachAthletes) {
      if (await this.canAccessFeature(coachAthlete.userId, featureName)) {
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

export function featureLockedException(feature: Feature): ForbiddenException {
  return new ForbiddenException({
    statusCode: 403,
    code: FEATURE_LOCKED_ERROR,
    feature,
    message: `Feature '${feature}' is a Supporter perk`,
  });
}
