import {
  AutoRenewStatus,
  JWSRenewalInfoDecodedPayload,
  JWSTransactionDecodedPayload,
} from '@apple/app-store-server-library';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  BillingProvider,
  BillingInterval as PrismaBillingInterval,
  SubscriptionPlan as PrismaSubscriptionPlan,
  Subscription,
  SubscriptionStatus,
} from '@openathlete/database';
import {
  BillingInterval,
  SubscriptionPlan,
  billingIntervalOfAppleProduct,
  getMaxAthletes,
  planHasAIFeatures,
} from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { StripeService } from './stripe.service';

/**
 * The state of an App Store subscription, from its latest transaction and,
 * when known, its renewal info. Access lasts until the paid period ends, or
 * until the end of Apple's billing grace period; a refund revokes it at once.
 */
export function appleSubscriptionFields(
  transaction: JWSTransactionDecodedPayload,
  renewalInfo: JWSRenewalInfoDecodedPayload | null,
  now: Date,
) {
  const interval = billingIntervalOfAppleProduct(transaction.productId ?? '');
  if (!interval || !transaction.originalTransactionId) {
    throw new BadRequestException('UNKNOWN_APPLE_PRODUCT');
  }
  const date = (ms: number | undefined) =>
    ms !== undefined ? new Date(ms) : null;
  const expires = date(transaction.expiresDate);
  const graceEnd = date(renewalInfo?.gracePeriodExpiresDate);
  const periodEnd =
    graceEnd && (!expires || graceEnd > expires) ? graceEnd : expires;
  const revoked = transaction.revocationDate !== undefined;
  const entitled = !revoked && periodEnd !== null && periodEnd > now;

  return {
    plan: PrismaSubscriptionPlan.SUPPORTER,
    provider: BillingProvider.apple,
    billingInterval:
      interval === BillingInterval.YEAR
        ? PrismaBillingInterval.year
        : PrismaBillingInterval.month,
    status: entitled ? SubscriptionStatus.active : SubscriptionStatus.canceled,
    currentPeriodStart: date(transaction.purchaseDate),
    currentPeriodEnd: periodEnd,
    trialEnd: null,
    appleOriginalTransactionId: transaction.originalTransactionId,
    // Only renewal info tells whether the subscription renews
    ...(renewalInfo && {
      cancelAtPeriodEnd: renewalInfo.autoRenewStatus === AutoRenewStatus.OFF,
    }),
  };
}

export class SubscriptionUserMissingError extends Error {
  constructor(public readonly userId: number) {
    super(`User ${userId} does not exist`);
    this.name = 'SubscriptionUserMissingError';
  }
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Ensure a Stripe customer exists for this user and persist its ID.
   * Useful for flows like opening the billing portal when the user never checked out yet.
   */
  async getOrCreateStripeCustomerId(userId: number): Promise<string> {
    const subscription = await this.getOrCreateSubscription(userId);

    if (subscription.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const customer = await this.stripeService.getOrCreateCustomer(
      userId,
      user.email,
    );

    const updated = await this.prisma.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: { stripeCustomerId: customer.id },
    });

    // `customer.id` is always defined; this is just defensive.
    return updated.stripeCustomerId ?? customer.id;
  }

  /**
   * Get current subscription for a user
   */
  async getCurrentSubscription(userId: number): Promise<Subscription | null> {
    return await this.prisma.subscription.findUnique({
      where: { userId: userId },
    });
  }

  /**
   * Get or create subscription (defaults to FREE)
   */
  async getOrCreateSubscription(userId: number): Promise<Subscription> {
    try {
      await this.assertUserExistsForSubscription(userId);
    } catch (e) {
      if (e instanceof SubscriptionUserMissingError) {
        throw new NotFoundException('User not found');
      }
      throw e;
    }

    let subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      // Create free subscription by default
      subscription = await this.prisma.subscription.create({
        data: {
          userId: userId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.active,
        },
      });
    }

    return subscription;
  }

  /**
   * Stores a Stripe subscription for a user, after checkout or from a
   * webhook. Every Stripe subscription is a Supporter one; whether it gives
   * access depends on its status.
   */
  async saveStripeSubscription(
    userId: number,
    customerId: string,
    stripeSubscription: Stripe.Subscription,
  ): Promise<Subscription> {
    await this.assertUserExistsForSubscription(userId);

    const existing = await this.getCurrentSubscription(userId);
    if (
      existing &&
      this.billedByAnotherStore(existing, BillingProvider.stripe)
    ) {
      this.logger.warn(
        `Ignoring Stripe subscription ${stripeSubscription.id}: user ${userId} is billed by the App Store`,
      );
      return existing;
    }

    const data = {
      ...this.fieldsFromStripe(stripeSubscription),
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
    };
    return await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /**
   * Create subscription from Stripe checkout
   */
  async createSubscriptionFromCheckout(
    userId: number,
    customerId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const stripeSubscription =
      await this.stripeService.getSubscription(subscriptionId);
    if (!stripeSubscription) {
      throw new NotFoundException('Stripe subscription not found');
    }
    return this.saveStripeSubscription(userId, customerId, stripeSubscription);
  }

  /**
   * Update subscription from Stripe webhook
   */
  async updateSubscriptionFromWebhook(
    stripeSubscription: Stripe.Subscription,
  ): Promise<Subscription> {
    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (existing) {
      // An old Stripe subscription ending must not undo an App Store one
      if (this.billedByAnotherStore(existing, BillingProvider.stripe)) {
        return existing;
      }
      return await this.prisma.subscription.update({
        where: { subscriptionId: existing.subscriptionId },
        data: this.fieldsFromStripe(stripeSubscription),
      });
    }

    // The webhook can arrive before checkout.session.completed: find the
    // user from the customer
    this.logger.warn(
      `Subscription not found for Stripe subscription ID: ${stripeSubscription.id}, creating from webhook`,
    );
    const customerId = stripeSubscription.customer as string;
    const customer = await this.stripeService.getCustomer(customerId);
    const userId = customer.metadata?.userId;
    if (!userId) {
      throw new NotFoundException('User ID not found in customer metadata');
    }
    return this.saveStripeSubscription(
      Number.parseInt(userId, 10),
      customerId,
      stripeSubscription,
    );
  }

  private fieldsFromStripe(stripeSubscription: Stripe.Subscription) {
    // Billing periods moved to subscription items in recent API versions
    const stripeSub = stripeSubscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };
    const item = stripeSubscription.items?.data?.[0] as
      | (Stripe.SubscriptionItem & {
          current_period_start?: number;
          current_period_end?: number;
        })
      | undefined;
    const date = (seconds: number | null | undefined) =>
      seconds != null ? new Date(seconds * 1000) : null;
    return {
      plan: PrismaSubscriptionPlan.SUPPORTER,
      provider: BillingProvider.stripe,
      billingInterval: this.billingIntervalOf(stripeSubscription),
      status: this.mapStatusToPrisma(stripeSubscription.status),
      currentPeriodStart: date(
        stripeSub.current_period_start ?? item?.current_period_start,
      ),
      currentPeriodEnd: date(
        stripeSub.current_period_end ?? item?.current_period_end,
      ),
      trialEnd: date(stripeSubscription.trial_end),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end ?? false,
    };
  }

  private billingIntervalOf(
    stripeSubscription: Stripe.Subscription,
  ): PrismaBillingInterval | null {
    const price = stripeSubscription.items?.data?.[0]?.price;
    const interval =
      this.stripeService.intervalOfPrice(price?.id) ??
      price?.recurring?.interval;
    switch (interval) {
      case 'month':
        return PrismaBillingInterval.month;
      case 'year':
        return PrismaBillingInterval.year;
      default:
        return null;
    }
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    this.assertNotBilledByAppStore(subscription);

    if (!subscription.stripeSubscriptionId) {
      throw new NotFoundException('Stripe subscription ID not found');
    }

    await this.stripeService.cancelSubscriptionAtPeriodEnd(
      subscription.stripeSubscriptionId,
    );

    return await this.prisma.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(userId: number): Promise<Subscription> {
    const subscription = await this.getCurrentSubscription(userId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    this.assertNotBilledByAppStore(subscription);

    if (!subscription.stripeSubscriptionId) {
      throw new NotFoundException('Stripe subscription ID not found');
    }

    await this.stripeService.resumeSubscription(
      subscription.stripeSubscriptionId,
    );

    return await this.prisma.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: {
        cancelAtPeriodEnd: false,
      },
    });
  }

  /**
   * Get max athletes for a user's plan
   */
  async getMaxAthletesForUser(userId: number): Promise<number | null> {
    // Nothing is sold without billing, so nothing is limited
    if (!this.stripeService.billingEnabled) return null;

    const subscription = await this.getOrCreateSubscription(userId);

    if (!this.isEntitled(subscription)) {
      return getMaxAthletes(SubscriptionPlan.FREE);
    }

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

    const currentCount = await this.prisma.coachAthlete.count({
      where: { userId: userId },
    });

    return currentCount < maxAthletes;
  }

  /**
   * Whether the subscription gives its benefits now. An App Store one also
   * stops at the end of its period, should Apple's notification be missed.
   */
  isEntitled(subscription: Subscription, now = new Date()): boolean {
    const active =
      subscription.status === SubscriptionStatus.active ||
      subscription.status === SubscriptionStatus.trialing;
    if (subscription.provider !== BillingProvider.apple) return active;
    return (
      active &&
      subscription.currentPeriodEnd !== null &&
      subscription.currentPeriodEnd > now
    );
  }

  /** A subscription still running with the other store is left alone */
  private billedByAnotherStore(
    subscription: Subscription,
    provider: BillingProvider,
  ): boolean {
    return (
      subscription.provider !== null &&
      subscription.provider !== provider &&
      this.isEntitled(subscription)
    );
  }

  private assertNotBilledByAppStore(subscription: Subscription): void {
    if (subscription.provider === BillingProvider.apple) {
      throw new ConflictException('MANAGED_BY_APP_STORE');
    }
  }

  /**
   * Stripe checkout and its portal are refused while the App Store bills the
   * user; once that subscription ends, the user may subscribe on the web.
   */
  async assertBilledByStripe(userId: number): Promise<void> {
    const subscription = await this.getCurrentSubscription(userId);
    if (
      subscription?.provider === BillingProvider.apple &&
      this.isEntitled(subscription)
    ) {
      throw new ConflictException('MANAGED_BY_APP_STORE');
    }
  }

  /**
   * The UUID the iOS app passes to StoreKit as appAccountToken, created on
   * first use. Apple reports it with every transaction of the user.
   */
  async getOrCreateAppleAccountToken(userId: number): Promise<string> {
    const subscription = await this.getOrCreateSubscription(userId);
    if (subscription.appleAppAccountToken) {
      return subscription.appleAppAccountToken;
    }
    const updated = await this.prisma.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: { appleAppAccountToken: randomUUID() },
    });
    return updated.appleAppAccountToken!;
  }

  /**
   * Records an App Store purchase or restore sent by the iOS app, after its
   * signature was verified. The transaction must carry this user's account
   * token, or be one no other user has claimed.
   */
  async linkAppleTransaction(
    userId: number,
    transaction: JWSTransactionDecodedPayload,
  ): Promise<Subscription> {
    const subscription = await this.getOrCreateSubscription(userId);

    if (
      transaction.appAccountToken &&
      transaction.appAccountToken !== subscription.appleAppAccountToken
    ) {
      throw new ForbiddenException('APPLE_PURCHASE_OF_ANOTHER_ACCOUNT');
    }
    const owner = await this.prisma.subscription.findUnique({
      where: { appleOriginalTransactionId: transaction.originalTransactionId },
    });
    if (owner && owner.userId !== userId) {
      throw new ForbiddenException('APPLE_PURCHASE_OF_ANOTHER_ACCOUNT');
    }
    if (this.billedByAnotherStore(subscription, BillingProvider.apple)) {
      throw new ConflictException('ALREADY_SUPPORTER');
    }

    return this.applyAppleTransaction(subscription, transaction, null);
  }

  /**
   * Applies an App Store Server Notification to the subscription it belongs
   * to. A purchase the app has not linked yet is skipped: the app links it.
   */
  async applyAppleNotification(
    transaction: JWSTransactionDecodedPayload,
    renewalInfo: JWSRenewalInfoDecodedPayload | null,
  ): Promise<Subscription | null> {
    const subscription =
      (await this.prisma.subscription.findUnique({
        where: {
          appleOriginalTransactionId: transaction.originalTransactionId,
        },
      })) ??
      (transaction.appAccountToken
        ? await this.prisma.subscription.findUnique({
            where: { appleAppAccountToken: transaction.appAccountToken },
          })
        : null);
    if (!subscription) return null;
    if (this.billedByAnotherStore(subscription, BillingProvider.apple)) {
      return subscription;
    }
    return this.applyAppleTransaction(subscription, transaction, renewalInfo);
  }

  private async applyAppleTransaction(
    subscription: Subscription,
    transaction: JWSTransactionDecodedPayload,
    renewalInfo: JWSRenewalInfoDecodedPayload | null,
  ): Promise<Subscription> {
    const fields = appleSubscriptionFields(
      transaction,
      renewalInfo,
      new Date(),
    );

    // Notifications can arrive out of order: an earlier period's transaction
    // only updates the renewal status, unless it was refunded
    const earlierPeriod =
      subscription.provider === BillingProvider.apple &&
      subscription.appleOriginalTransactionId ===
        transaction.originalTransactionId &&
      transaction.revocationDate === undefined &&
      subscription.currentPeriodEnd !== null &&
      fields.currentPeriodEnd !== null &&
      fields.currentPeriodEnd < subscription.currentPeriodEnd;
    const data = earlierPeriod
      ? { cancelAtPeriodEnd: fields.cancelAtPeriodEnd }
      : fields;

    return await this.prisma.subscription.update({
      where: { subscriptionId: subscription.subscriptionId },
      data,
    });
  }

  /**
   * Check if user has access to AI features
   */
  async hasAIFeaturesAccess(userId: number): Promise<boolean> {
    const subscription = await this.getOrCreateSubscription(userId);

    if (!this.isEntitled(subscription)) {
      return false;
    }

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

    const currentCount = await this.prisma.coachAthlete.count({
      where: { userId: userId },
    });

    return currentCount > maxAthletes;
  }

  /**
   * Map Stripe subscription status to Prisma enum
   */
  private mapStatusToPrisma(
    status: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.active;
      case 'canceled':
        return SubscriptionStatus.canceled;
      case 'past_due':
        return SubscriptionStatus.past_due;
      case 'trialing':
        return SubscriptionStatus.trialing;
      case 'incomplete':
        return SubscriptionStatus.incomplete;
      case 'incomplete_expired':
        return SubscriptionStatus.incomplete_expired;
      case 'unpaid':
        return SubscriptionStatus.unpaid;
      default:
        return SubscriptionStatus.active;
    }
  }

  private mapPrismaPlanToEnum(plan: PrismaSubscriptionPlan): SubscriptionPlan {
    return plan === PrismaSubscriptionPlan.SUPPORTER
      ? SubscriptionPlan.SUPPORTER
      : SubscriptionPlan.FREE;
  }

  private async assertUserExistsForSubscription(userId: number): Promise<void> {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!user) {
      throw new SubscriptionUserMissingError(userId);
    }
  }
}
