import { z } from 'zod';

/**
 * Subscription plans stored on a user's subscription. Everyone gets the full
 * app for free; Supporter funds the project. What each one gives is in
 * OFFERS (entitlements.ts).
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
 * Version (date) of the terms of sale on the website. Change it with the
 * terms: each new subscription records the version its customer accepted.
 */
export const TERMS_OF_SALE_VERSION = '2026-11-16';

/**
 * Where the count of Supporters is headed: enough to cover the costs and
 * give the project more time. Said in the app and in the Supporter email.
 */
export const SUPPORTER_GOAL = 100;

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
