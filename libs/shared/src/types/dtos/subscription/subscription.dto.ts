import { z } from 'zod';

import {
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
});

export type CurrentSubscriptionDto = z.infer<
  typeof currentSubscriptionDtoSchema
>;

/**
 * Create checkout session DTO
 */
export const createCheckoutSessionDtoSchema = z.object({
  plan: subscriptionPlanSchema,
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
