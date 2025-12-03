import Stripe from 'stripe';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SubscriptionPlan } from '@openathlete/shared';
import { ApiEnvSchemaType } from '@openathlete/shared';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly priceIds: Record<SubscriptionPlan, string>;

  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
    });

    // Parse price IDs from environment variable
    const priceIdsJson = process.env.STRIPE_PRICE_IDS;
    if (!priceIdsJson) {
      throw new Error('STRIPE_PRICE_IDS is not set');
    }

    try {
      this.priceIds = JSON.parse(priceIdsJson) as Record<
        SubscriptionPlan,
        string
      >;
    } catch (error) {
      throw new Error(
        `Failed to parse STRIPE_PRICE_IDS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  async getOrCreateCustomer(
    userId: number,
    email: string,
  ): Promise<Stripe.Customer> {
    // Try to find existing customer by metadata
    const existingCustomers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      // Verify it's the right customer by checking metadata
      if (customer.metadata?.userId === userId.toString()) {
        return customer;
      }
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId: userId.toString(),
      },
    });

    return customer;
  }

  /**
   * Retrieve a Stripe customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.retrieve(customerId);
    if (customer.deleted || !('metadata' in customer)) {
      throw new Error(`Customer not found or deleted: ${customerId}`);
    }
    return customer;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    plan: SubscriptionPlan,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    const priceId = this.priceIds[plan];
    if (!priceId) {
      throw new Error(`Price ID not found for plan: ${plan}`);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan,
      },
      subscription_data: {
        metadata: {
          plan,
        },
      },
    });

    return session;
  }

  /**
   * Create customer portal session
   */
  async createCustomerPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(
    customerId: string,
    limit = 10,
  ): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  }

  /**
   * Get plan from price ID (reverse lookup)
   */
  getPlanFromPriceId(priceId: string): SubscriptionPlan {
    // Reverse lookup: find which plan has this price ID
    for (const [plan, id] of Object.entries(this.priceIds)) {
      if (id === priceId) {
        return plan as SubscriptionPlan;
      }
    }
    // If not found, return FREE as fallback
    this.logger.warn(
      `Price ID ${priceId} not found in priceIds mapping, defaulting to FREE`,
    );
    return SubscriptionPlan.FREE;
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    try {
      // Expand items to get price information
      return await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      });
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeError &&
        error.statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscriptionAtPeriodEnd(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Resume subscription (remove cancellation)
   */
  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Update subscription to a new plan
   */
  async updateSubscriptionPlan(
    subscriptionId: string,
    newPlan: SubscriptionPlan,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPriceId = this.priceIds[newPlan];
    if (!newPriceId) {
      throw new Error(`Price ID not found for plan: ${newPlan}`);
    }

    // Update subscription with proration
    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
      metadata: {
        plan: newPlan,
      },
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
