import Stripe from 'stripe';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  subscription,
  subscription_plan,
  subscription_status,
} from '@openathlete/database';
import {
  SubscriptionPlan,
  getMaxAthletes,
  planHasAIFeatures,
} from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Get current subscription for a user
   */
  async getCurrentSubscription(userId: number): Promise<subscription | null> {
    return await this.prisma.subscription.findUnique({
      where: { user_id: userId },
    });
  }

  /**
   * Get or create subscription (defaults to FREE)
   */
  async getOrCreateSubscription(userId: number): Promise<subscription> {
    let subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      // Create free subscription by default
      subscription = await this.prisma.subscription.create({
        data: {
          user_id: userId,
          plan: subscription_plan.FREE,
          status: subscription_status.active,
        },
      });
    }

    return subscription;
  }

  /**
   * Create subscription from Stripe checkout
   */
  async createSubscriptionFromCheckout(
    userId: number,
    customerId: string,
    subscriptionId: string,
    plan: SubscriptionPlan,
  ): Promise<subscription> {
    const stripeSubscription =
      await this.stripeService.getSubscription(subscriptionId);
    if (!stripeSubscription) {
      throw new NotFoundException('Stripe subscription not found');
    }

    // Check if subscription already exists
    const existing = await this.prisma.subscription.findUnique({
      where: { user_id: userId },
    });

    const subscriptionData = {
      user_id: userId,
      plan: this.mapPlanToPrisma(plan),
      status: this.mapStatusToPrisma(
        stripeSubscription.status as Stripe.Subscription.Status,
      ),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stripeSubscription as any).current_period_start != null
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            new Date((stripeSubscription as any).current_period_start * 1000)
          : new Date(),
      current_period_end:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stripeSubscription as any).current_period_end != null
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            new Date((stripeSubscription as any).current_period_end * 1000)
          : new Date(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end ?? false,
    };

    if (existing) {
      return await this.prisma.subscription.update({
        where: { subscription_id: existing.subscription_id },
        data: subscriptionData,
      });
    }

    return await this.prisma.subscription.create({
      data: subscriptionData,
    });
  }

  /**
   * Update subscription from Stripe webhook
   */
  async updateSubscriptionFromWebhook(
    stripeSubscription: Stripe.Subscription,
  ): Promise<subscription> {
    let subscription = await this.prisma.subscription.findUnique({
      where: {
        stripe_subscription_id: stripeSubscription.id,
      },
    });

    // If subscription doesn't exist yet (webhook arrived before checkout.session.completed),
    // create it from the Stripe subscription data
    if (!subscription) {
      this.logger.warn(
        `Subscription not found for Stripe subscription ID: ${stripeSubscription.id}, creating from webhook`,
      );

      // Get customer to find user_id
      const customer = await this.stripeService.getCustomer(
        stripeSubscription.customer as string,
      );

      if (customer.deleted || !('metadata' in customer)) {
        throw new NotFoundException('Customer not found');
      }

      const userId = customer.metadata?.userId;
      if (!userId) {
        throw new NotFoundException('User ID not found in customer metadata');
      }

      const plan =
        (stripeSubscription.metadata?.plan as SubscriptionPlan | undefined) ||
        SubscriptionPlan.FREE;

      subscription = await this.createSubscriptionFromCheckout(
        parseInt(userId, 10),
        stripeSubscription.customer as string,
        stripeSubscription.id,
        plan,
      );
    }

    this.logger.log(
      `Fetching full subscription ${stripeSubscription.id} to extract plan from price ID (source of truth)`,
    );
    const fullSubscription = await this.stripeService.getSubscription(
      stripeSubscription.id,
    );

    let plan: SubscriptionPlan;

    if (!fullSubscription) {
      this.logger.error(
        `Failed to fetch subscription ${stripeSubscription.id} from Stripe`,
      );
      // Fallback: try metadata if available, otherwise use existing plan
      if (stripeSubscription.metadata?.plan) {
        plan = stripeSubscription.metadata.plan as SubscriptionPlan;
        this.logger.warn(
          `Using metadata plan ${plan} as fallback (subscription fetch failed)`,
        );
      } else {
        plan = subscription.plan
          ? this.mapPrismaPlanToEnum(subscription.plan)
          : SubscriptionPlan.FREE;
        this.logger.warn(
          `Using existing plan ${plan} as fallback (subscription fetch failed and no metadata)`,
        );
      }
    } else {
      const priceId = fullSubscription.items?.data?.[0]?.price?.id;
      if (priceId) {
        this.logger.log(
          `Extracting plan from price ID: ${priceId} for subscription ${stripeSubscription.id}`,
        );
        plan = this.stripeService.getPlanFromPriceId(priceId);
        this.logger.log(
          `Plan extracted from price ID ${priceId}: ${plan} for subscription ${stripeSubscription.id}`,
        );
        // Log if metadata differs from price ID (indicates stale metadata)
        if (
          stripeSubscription.metadata?.plan &&
          stripeSubscription.metadata.plan !== plan
        ) {
          this.logger.warn(
            `Metadata plan (${stripeSubscription.metadata.plan}) differs from price ID plan (${plan}). Using price ID as source of truth.`,
          );
        }
      } else {
        // Fallback: try metadata if available, otherwise use existing plan
        if (stripeSubscription.metadata?.plan) {
          plan = stripeSubscription.metadata.plan as SubscriptionPlan;
          this.logger.warn(
            `Using metadata plan ${plan} as fallback (price ID not found)`,
          );
        } else {
          plan = subscription.plan
            ? this.mapPrismaPlanToEnum(subscription.plan)
            : SubscriptionPlan.FREE;
          this.logger.warn(
            `Could not extract plan from subscription ${stripeSubscription.id}. Price ID: ${priceId}, Items: ${JSON.stringify(fullSubscription.items?.data?.map((item) => ({ id: item.id, priceId: item.price?.id })))}. Using existing plan: ${plan}`,
          );
        }
      }
    }

    // Safely extract period dates from Stripe subscription
    const currentPeriodStart =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stripeSubscription as any).current_period_start != null
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Date((stripeSubscription as any).current_period_start * 1000)
        : subscription.current_period_start || new Date();

    const currentPeriodEnd =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stripeSubscription as any).current_period_end != null
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Date((stripeSubscription as any).current_period_end * 1000)
        : subscription.current_period_end || new Date();

    return await this.prisma.subscription.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        plan: this.mapPlanToPrisma(plan),
        status: this.mapStatusToPrisma(stripeSubscription.status),
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end ?? false,
      },
    });
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(userId: number): Promise<subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.stripe_subscription_id) {
      throw new NotFoundException('Stripe subscription ID not found');
    }

    await this.stripeService.cancelSubscriptionAtPeriodEnd(
      subscription.stripe_subscription_id,
    );

    return await this.prisma.subscription.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        cancel_at_period_end: true,
      },
    });
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(userId: number): Promise<subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.stripe_subscription_id) {
      throw new NotFoundException('Stripe subscription ID not found');
    }

    await this.stripeService.resumeSubscription(
      subscription.stripe_subscription_id,
    );

    return await this.prisma.subscription.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        cancel_at_period_end: false,
      },
    });
  }

  /**
   * Get max athletes for a user's plan
   */
  async getMaxAthletesForUser(userId: number): Promise<number | null> {
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = this.mapPrismaPlanToEnum(subscription.plan);
    return getMaxAthletes(plan);
  }

  /**
   * Check if user can add more athletes
   */
  async canAddAthlete(userId: number): Promise<boolean> {
    const maxAthletes = await this.getMaxAthletesForUser(userId);
    if (maxAthletes === null) {
      return true; // Unlimited
    }

    const currentCount = await this.prisma.coach_athlete.count({
      where: { user_id: userId },
    });

    return currentCount < maxAthletes;
  }

  /**
   * Check if user has access to AI features
   */
  async hasAIFeaturesAccess(userId: number): Promise<boolean> {
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = this.mapPrismaPlanToEnum(subscription.plan);
    return planHasAIFeatures(plan);
  }

  /**
   * Check if user is over athlete limit (for downgrade handling)
   */
  async isOverAthleteLimit(userId: number): Promise<boolean> {
    const maxAthletes = await this.getMaxAthletesForUser(userId);
    if (maxAthletes === null) {
      return false; // Unlimited
    }

    const currentCount = await this.prisma.coach_athlete.count({
      where: { user_id: userId },
    });

    return currentCount > maxAthletes;
  }

  /**
   * Map Stripe subscription status to Prisma enum
   */
  private mapStatusToPrisma(
    status: Stripe.Subscription.Status,
  ): subscription_status {
    switch (status) {
      case 'active':
        return subscription_status.active;
      case 'canceled':
        return subscription_status.canceled;
      case 'past_due':
        return subscription_status.past_due;
      case 'trialing':
        return subscription_status.trialing;
      case 'incomplete':
        return subscription_status.incomplete;
      case 'incomplete_expired':
        return subscription_status.incomplete_expired;
      case 'unpaid':
        return subscription_status.unpaid;
      default:
        return subscription_status.active;
    }
  }

  /**
   * Map SubscriptionPlan enum to Prisma enum
   */
  private mapPlanToPrisma(plan: SubscriptionPlan): subscription_plan {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return subscription_plan.FREE;
      case SubscriptionPlan.ATHLETE_PRO:
        return subscription_plan.ATHLETE_PRO;
      case SubscriptionPlan.COACH_PRO:
        return subscription_plan.COACH_PRO;
      case SubscriptionPlan.COACH_ULTRA:
        return subscription_plan.COACH_ULTRA;
      case SubscriptionPlan.CLUB_PRO:
        return subscription_plan.CLUB_PRO;
      case SubscriptionPlan.CLUB_ULTRA:
        return subscription_plan.CLUB_ULTRA;
    }
  }

  /**
   * Map Prisma enum to SubscriptionPlan enum
   */
  private mapPrismaPlanToEnum(plan: subscription_plan): SubscriptionPlan {
    switch (plan) {
      case subscription_plan.FREE:
        return SubscriptionPlan.FREE;
      case subscription_plan.ATHLETE_PRO:
        return SubscriptionPlan.ATHLETE_PRO;
      case subscription_plan.COACH_PRO:
        return SubscriptionPlan.COACH_PRO;
      case subscription_plan.COACH_ULTRA:
        return SubscriptionPlan.COACH_ULTRA;
      case subscription_plan.CLUB_PRO:
        return SubscriptionPlan.CLUB_PRO;
      case subscription_plan.CLUB_ULTRA:
        return SubscriptionPlan.CLUB_ULTRA;
    }
  }
}
