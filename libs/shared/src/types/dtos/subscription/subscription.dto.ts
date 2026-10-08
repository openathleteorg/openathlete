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
  /** Store billing the subscription; null on the free plan */
  provider: billingProviderSchema.nullable(),
  /** Athletes the user may coach right now; null = unlimited */
  maxAthletes: z.number().nullable(),
  /** The instance sells subscriptions (Stripe is configured) */
  billingEnabled: z.boolean(),
  /** The iOS app can sell subscriptions (App Store purchases are configured) */
  appStoreEnabled: z.boolean(),
});

export type CurrentSubscriptionDto = z.infer<
  typeof currentSubscriptionDtoSchema
>;

/**
 * Create checkout session DTO
 */
export const createCheckoutSessionDtoSchema = z.object({
  /** Supporter is the only plan for sale; the interval picks its price */
  interval: billingIntervalSchema,
  /**
   * The customer accepts the terms of sale and asks for the subscription to
   * start at once, within the withdrawal period. Required to subscribe, not
   * to switch interval.
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
