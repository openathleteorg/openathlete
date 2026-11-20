import { z } from 'zod';

import {
  billingIntervalSchema,
  billingProviderSchema,
  subscriptionPlanSchema,
  subscriptionStatusSchema,
} from '../../subscription.types';

/**
 * Current subscription DTO
 */
export const currentSubscriptionDtoSchema = z.object({
  subscriptionId: z.number(),
  plan: subscriptionPlanSchema,
  status: subscriptionStatusSchema,
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  trialEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  /** Billing interval of a Supporter subscription */
  billingInterval: billingIntervalSchema.nullable(),
  /** Price of its tier, in cents (VAT included); null on the free plan */
  amountCents: z.number().int().nullable(),
  /** ISO currency of amountCents, lowercase */
  currency: z.string().nullable(),
  /** The subscription gives its benefits now (paid and running) */
  entitled: z.boolean(),
  /** Subscribed before the tiered pricing: keeps their price and rights */
  isFounder: z.boolean(),
  /** Store billing the subscription; null on the free plan */
  provider: billingProviderSchema.nullable(),
  /** Athletes the user may coach right now; null = unlimited */
  maxAthletes: z.number().nullable(),
  /** The instance sells subscriptions (Stripe is configured) */
  billingEnabled: z.boolean(),
  /** The iOS app can sell subscriptions (App Store purchases are configured) */
  appStoreEnabled: z.boolean(),
  /** The user agreed to appear on the Supporter wall of the website */
  showOnSupporterWall: z.boolean(),
  /** Name shown there instead of the first name */
  wallName: z.string().nullable(),
});

export type CurrentSubscriptionDto = z.infer<
  typeof currentSubscriptionDtoSchema
>;

/** How many people are Supporters today, and the goal */
export const supporterCountDtoSchema = z.object({
  count: z.number().int().nonnegative(),
  goal: z.number().int().positive(),
});

export type SupporterCountDto = z.infer<typeof supporterCountDtoSchema>;

/** Longest name a Supporter may show on the wall */
export const SUPPORTER_WALL_NAME_MAX_LENGTH = 30;

/**
 * What the public transparency page of the website reads. Strict: no
 * amount, no email and no full name may ever be added to it, since the
 * revenue and the funding thresholds stay private.
 */
export const transparencyDtoSchema = z
  .object({
    supporters: supporterCountDtoSchema,
    /**
     * Progress of each funding tier, in whole percent of its own step (from
     * the previous threshold to its own). Null when the thresholds are not
     * configured.
     */
    tiers: z.array(z.number().int().min(0).max(100)).max(5).nullable(),
    /** First names or chosen names of the Supporters who agreed, oldest first */
    wall: z.array(z.string()),
  })
  .strict();

export type TransparencyDto = z.infer<typeof transparencyDtoSchema>;

/** Appear on the Supporter wall, under a chosen name or the first name */
export const updateSupporterWallDtoSchema = z.object({
  show: z.boolean(),
  /** Empty or absent: the first name */
  name: z
    .string()
    .trim()
    .max(SUPPORTER_WALL_NAME_MAX_LENGTH)
    .nullable()
    .optional(),
});

export type UpdateSupporterWallDto = z.infer<
  typeof updateSupporterWallDtoSchema
>;

/**
 * Create checkout session DTO
 */
export const createCheckoutSessionDtoSchema = z.object({
  /** Supporter is the only offer for sale; interval and tier pick its price */
  interval: billingIntervalSchema,
  /**
   * Price of the chosen Supporter tier for the interval, in cents. Defaults
   * to the featured tier. Already a Supporter: the tier to move to.
   */
  amountCents: z.number().int().positive().optional(),
  /**
   * The customer accepts the terms of sale and asks for the subscription to
   * start at once, within the withdrawal period. Required to subscribe, not
   * to switch tier or interval.
   */
  acceptTerms: z.literal(true).optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateCheckoutSessionDto = z.infer<
  typeof createCheckoutSessionDtoSchema
>;

/**
 * Checkout session response DTO
 */
export const checkoutSessionResponseDtoSchema = z.object({
  sessionId: z.string(),
  url: z.string().url(),
});

export type CheckoutSessionResponseDto = z.infer<
  typeof checkoutSessionResponseDtoSchema
>;

/**
 * Invoice DTO
 */
export const invoiceDtoSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  createdAt: z.date(),
  invoiceUrl: z.string().url().nullable(),
  invoicePdf: z.string().url().nullable(),
});

export type InvoiceDto = z.infer<typeof invoiceDtoSchema>;

/**
 * Customer portal response DTO
 */
export const customerPortalResponseDtoSchema = z.object({
  url: z.string().url(),
});

export type CustomerPortalResponseDto = z.infer<
  typeof customerPortalResponseDtoSchema
>;

/**
 * The UUID the iOS app passes to StoreKit as appAccountToken, so that the
 * App Store reports every purchase and renewal with the user it belongs to.
 */
export const appleAccountTokenDtoSchema = z.object({
  appAccountToken: z.string().uuid(),
});

export type AppleAccountTokenDto = z.infer<typeof appleAccountTokenDtoSchema>;

/**
 * A StoreKit 2 transaction as signed by the App Store (its
 * jwsRepresentation), sent by the iOS app after a purchase or a restore.
 */
export const appleTransactionDtoSchema = z.object({
  signedTransaction: z.string().min(1).max(20_000),
});

export type AppleTransactionDto = z.infer<typeof appleTransactionDtoSchema>;

/** An App Store Server Notification V2, as Apple posts it. */
export const appleNotificationDtoSchema = z.object({
  signedPayload: z.string().min(1).max(100_000),
});

export type AppleNotificationDto = z.infer<typeof appleNotificationDtoSchema>;
