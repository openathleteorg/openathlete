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
  Prisma,
  BillingInterval as PrismaBillingInterval,
  SubscriptionPlan as PrismaSubscriptionPlan,
  Subscription,
  SubscriptionStatus,
} from '@openathlete/database';
import {
  BillingInterval,
  Offer,
  OfferEntitlements,
  SubscriptionPlan,
  appleSupporterProduct,
  entitlementsOf,
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
  const product = appleSupporterProduct(transaction.productId ?? '');
  if (!product || !transaction.originalTransactionId) {
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
      product.interval === BillingInterval.YEAR
        ? PrismaBillingInterval.year
        : PrismaBillingInterval.month,
    // Apple charges its nearest price point; the tier is what it stands for
    amountCents: product.amountCents,
    currency: 'eur',
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

/** Statuses after which a subscription is over for good, founder's included */
const ENDED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.canceled,
  SubscriptionStatus.incomplete_expired,
];

/**
 * A founder stays one for as long as the subscription they had runs: it
 * ends with it, and a new subscription (another Stripe id or App Store
 * original transaction) is one at today's prices.
 */
export function keepsFounder(
  existing: Pick<
    Subscription,
    'isFounder' | 'stripeSubscriptionId' | 'appleOriginalTransactionId'
  > | null,
  next: {
    status: SubscriptionStatus;
    stripeSubscriptionId?: string | null;
    appleOriginalTransactionId?: string | null;
  },
): boolean {
  if (!existing?.isFounder || ENDED_STATUSES.includes(next.status)) {
    return false;
  }
  if (
    next.stripeSubscriptionId !== undefined &&
    next.stripeSubscriptionId !== existing.stripeSubscriptionId
  ) {
    return false;
  }
  if (
    next.appleOriginalTransactionId !== undefined &&
    next.appleOriginalTransactionId !== existing.appleOriginalTransactionId
  ) {
    return false;
  }
  return true;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /** People whose Supporter subscription is running, the App Store's included */
  async countSupporters(): Promise<number> {
    return this.prisma.subscription.count({
      where: {
        plan: PrismaSubscriptionPlan.SUPPORTER,
        status: {
          in: [SubscriptionStatus.active, SubscriptionStatus.trialing],
        },
      },
    });
  }

  /** Shows or hides the user on the Supporter wall; an empty name: the first name */
  async updateSupporterWall(
    userId: number,
    { show, name }: { show: boolean; name?: string | null },
  ): Promise<Subscription> {
    await this.getOrCreateSubscription(userId);
    return this.prisma.subscription.update({
      where: { userId },
      data: {
        showOnSupporterWall: show,
        // Absent: keep the name chosen before
        ...(name !== undefined && { wallName: name?.trim() || null }),
      },
    });
  }

  async updateSupporterBadge(
    userId: number,
    show: boolean,
  ): Promise<Subscription> {
    await this.getOrCreateSubscription(userId);
    return this.prisma.subscription.update({
      where: { userId },
      data: { showSupporterBadge: show },
    });
  }

  /**
   * Which of these users show the Supporter badge to the viewer: running
   * Supporters who kept it on, among the people the viewer sees in the app
   * (their coaches and athletes, club mates, conversation partners), so the
   * endpoint cannot be used to probe anyone's subscription.
   */
  async supporterBadges(
    viewerId: number,
    userIds: number[],
  ): Promise<number[]> {
    if (userIds.length === 0) return [];
    const known = await this.usersSeenBy(viewerId, userIds);
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId: { in: [...known] },
        plan: PrismaSubscriptionPlan.SUPPORTER,
        showSupporterBadge: true,
      },
    });
    return subscriptions
      .filter((subscription) => this.isEntitled(subscription))
      .map((subscription) => subscription.userId);
  }

  private async usersSeenBy(
    viewerId: number,
    userIds: number[],
  ): Promise<Set<number>> {
    const asked = { in: userIds };
    const [athletes, coaches, clubMates, partners] = await Promise.all([
      this.prisma.coachAthlete.findMany({
        where: { userId: viewerId, athlete: { userId: asked } },
        select: { athlete: { select: { userId: true } } },
      }),
      this.prisma.coachAthlete.findMany({
        where: { athlete: { userId: viewerId }, userId: asked },
        select: { userId: true },
      }),
      this.prisma.clubMember.findMany({
        where: {
          userId: asked,
          club: { members: { some: { userId: viewerId } } },
        },
        select: { userId: true },
      }),
      this.prisma.messageThreadParticipant.findMany({
        where: {
          userId: asked,
          thread: { participants: { some: { userId: viewerId } } },
        },
        select: { userId: true },
      }),
    ]);
    return new Set([
      ...(userIds.includes(viewerId) ? [viewerId] : []),
      ...athletes.map((link) => link.athlete.userId),
      ...coaches.map((link) => link.userId),
      ...clubMates.map((member) => member.userId),
      ...partners.map((participant) => participant.userId),
    ]);
  }

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

    const subscription = await this.getCurrentSubscription(userId);
    if (subscription) return subscription;

    // Create free subscription by default
    try {
      return await this.prisma.subscription.create({
        data: {
          userId: userId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.active,
        },
      });
    } catch (error) {
      // A new account's first screens ask for it several times at once:
      // all find nothing, and the database keeps the first one created
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return await this.prisma.subscription.findUniqueOrThrow({
          where: { userId },
        });
      }
      throw error;
    }
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

    const fields = this.fieldsFromStripe(stripeSubscription);
    const data = {
      ...fields,
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      isFounder: keepsFounder(existing, {
        status: fields.status,
        stripeSubscriptionId: stripeSubscription.id,
      }),
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
      const fields = this.fieldsFromStripe(stripeSubscription);
      return await this.prisma.subscription.update({
        where: { subscriptionId: existing.subscriptionId },
        data: {
          ...fields,
          isFounder: keepsFounder(existing, { status: fields.status }),
        },
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
    const price = item?.price;
    return {
      plan: PrismaSubscriptionPlan.SUPPORTER,
      provider: BillingProvider.stripe,
      billingInterval: this.billingIntervalOf(price),
      // Founders keep the price they subscribed at, whatever it was
      amountCents: price?.unit_amount ?? null,
      currency: price?.currency ?? null,
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
    price: Stripe.Price | undefined,
  ): PrismaBillingInterval | null {
    switch (price?.recurring?.interval) {
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
    return this.entitlements(subscription).maxCoachedAthletes;
  }

  /** The offer a subscription gives right now. */
  offerOf(subscription: Subscription, now = new Date()): Offer {
    return this.isEntitled(subscription, now) &&
      subscription.plan === PrismaSubscriptionPlan.SUPPORTER
      ? Offer.SUPPORTER
      : Offer.FREE;
  }

  /** What a subscription gives right now, founders' rights included. */
  entitlements(
    subscription: Subscription,
    now = new Date(),
  ): OfferEntitlements {
    const offer = this.offerOf(subscription, now);
    return entitlementsOf(offer, subscription.isFounder);
  }

  /** The offer and founder status of a user, for their AI allowance. */
  async offerForUser(
    userId: number,
  ): Promise<{ offer: Offer; isFounder: boolean }> {
    const subscription = await this.getOrCreateSubscription(userId);
    const offer = this.offerOf(subscription);
    return {
      offer,
      isFounder: offer !== Offer.FREE && subscription.isFounder,
    };
  }

  /**
   * Check if user can add more athletes
   */
  async canAddAthlete(userId: number): Promise<boolean> {
    const maxAthletes = await this.getMaxAthletesForUser(userId);
    if (maxAthletes === null) {
      return true; // Unlimited
    }

    // Athletes coached through a club do not count: clubs are free for now
    const currentCount = await this.prisma.coachAthlete.count({
      where: { userId: userId, clubId: null },
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
      : {
          ...fields,
          isFounder: keepsFounder(subscription, {
            status: fields.status,
            appleOriginalTransactionId: fields.appleOriginalTransactionId,
          }),
        };

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
    return this.entitlements(subscription).hostedAi;
  }

  /**
   * Check if user is over athlete limit (for downgrade handling)
   */
  async isOverAthleteLimit(userId: number): Promise<boolean> {
    const maxAthletes = await this.getMaxAthletesForUser(userId);
    if (maxAthletes === null) {
      return false; // Unlimited
    }

    // Athletes coached through a club do not count: clubs are free for now
    const currentCount = await this.prisma.coachAthlete.count({
      where: { userId: userId, clubId: null },
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
