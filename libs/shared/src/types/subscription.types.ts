import { z } from 'zod';

/**
 * Subscription plans. Everyone gets the full app for free; Supporter funds
 * the project and adds AI on the instance keys and unlimited coached
 * athletes.
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  SUPPORTER = 'SUPPORTER',
}

/** How often a Supporter subscription is billed. */
export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

/** Store that bills a Supporter subscription. */
export enum BillingProvider {
  /** Stripe checkout, on the web */
  STRIPE = 'stripe',
  /** In-app purchase in the iOS app */
  APPLE = 'apple',
}

/** Bundle identifier of the iOS app, the only one selling through Apple. */
export const IOS_APP_BUNDLE_ID = 'org.openathlete';

/**
 * App Store auto-renewable subscription product of each billing interval,
 * created in App Store Connect in the "Supporter" subscription group.
 */
export const APPLE_SUPPORTER_PRODUCT_IDS: Record<BillingInterval, string> = {
  [BillingInterval.MONTH]: 'org.openathlete.supporter.monthly',
  [BillingInterval.YEAR]: 'org.openathlete.supporter.yearly',
};

/** The billing interval of an App Store product; null when it is not ours. */
export function billingIntervalOfAppleProduct(
  productId: string,
): BillingInterval | null {
  const entry = Object.entries(APPLE_SUPPORTER_PRODUCT_IDS).find(
    ([, id]) => id === productId,
  );
  return entry ? (entry[0] as BillingInterval) : null;
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
}

/**
 * Plan configuration with limits and features
 */
export interface PlanConfig {
  plan: SubscriptionPlan;
  /** Price in euros (VAT included) per billing interval; null when free */
  prices: Record<BillingInterval, number> | null;
  /** Athletes a user may coach; null = unlimited */
  maxAthletes: number | null;
  /** AI features on the instance keys, within the monthly AI budget */
  hasAIFeatures: boolean;
}

/**
 * Version (date) of the terms of sale on the website. Change it with the
 * terms: each new subscription records the version its customer accepted.
 */
export const TERMS_OF_SALE_VERSION = '2026-10-05';

/** Athletes a free account may coach on an instance with billing. */
export const FREE_PLAN_MAX_ATHLETES = 5;

/**
 * Plan configurations mapping
 */
export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    plan: SubscriptionPlan.FREE,
    prices: null,
    maxAthletes: FREE_PLAN_MAX_ATHLETES,
    hasAIFeatures: false,
  },
  [SubscriptionPlan.SUPPORTER]: {
    plan: SubscriptionPlan.SUPPORTER,
    prices: { [BillingInterval.MONTH]: 5, [BillingInterval.YEAR]: 50 },
    maxAthletes: null,
    hasAIFeatures: true,
  },
};

/**
 * Get plan configuration
 */
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

/**
 * Check if plan has AI features
 */
export function planHasAIFeatures(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIGS[plan].hasAIFeatures;
}

/**
 * Get max athletes for a plan
 */
export function getMaxAthletes(plan: SubscriptionPlan): number | null {
  return PLAN_CONFIGS[plan].maxAthletes;
}

/**
 * Feature names that can be restricted
 */
export enum FeatureName {
  AI_GENERATION = 'ai-generation',
  AI_RPE_QUESTIONS = 'ai-rpe-questions',
}

/**
 * Zod schema for subscription plan
 */
export const subscriptionPlanSchema = z.nativeEnum(SubscriptionPlan);

export const billingIntervalSchema = z.nativeEnum(BillingInterval);

export const billingProviderSchema = z.nativeEnum(BillingProvider);

/**
 * Zod schema for subscription status
 */
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

// DTOs are exported from ./dtos/subscription
