import Stripe from 'stripe';

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ApiEnvSchemaType,
  BillingInterval,
  TERMS_OF_SALE_VERSION,
} from '@openathlete/shared';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;
  /** Supporter prices, the only plan for sale */
  private readonly priceIds: Record<BillingInterval, string | undefined>;

  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.client = new Stripe(secretKey, {
        apiVersion: '2025-11-17.clover',
      });
    } else {
      // Billing is optional: self-hosted instances run without Stripe.
      this.client = null;
      this.logger.warn('STRIPE_SECRET_KEY is not set, billing is disabled');
    }

    this.priceIds = {
      [BillingInterval.MONTH]: this.configService.get(
        'STRIPE_PRICE_SUPPORTER_MONTHLY',
      ),
      [BillingInterval.YEAR]: this.configService.get(
        'STRIPE_PRICE_SUPPORTER_YEARLY',
      ),
    };
  }

  /**
   * The instance sells Supporter subscriptions. Without billing (self-hosted
   * instances) there is nothing to buy, so plan limits do not apply.
   */
  get billingEnabled(): boolean {
    return this.client !== null;
  }

  private get stripe(): Stripe {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Billing is not configured on this instance',
      );
    }
    return this.client;
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
   * Create a checkout session for the Supporter subscription. There is no
   * trial: the free plan already has the whole app.
   */
  async createCheckoutSession(
    customerId: string,
    interval: BillingInterval,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    return await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: this.priceIdFor(interval), quantity: 1 }],
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: 'auto',
      // The customer exists before Checkout: without this, Stripe refuses
      // automatic tax and tax ids, having nowhere to save what is entered.
      customer_update: { address: 'auto', name: 'auto' },
      tax_id_collection: { enabled: true },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Proof of the customer's acceptance and request to start at once
      subscription_data: {
        metadata: {
          terms_of_sale_version: TERMS_OF_SALE_VERSION,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });
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
   * The billing interval of a Supporter price, or null for a price this
   * instance does not sell (an old plan, another product).
   */
  intervalOfPrice(priceId: string | undefined): BillingInterval | null {
    if (!priceId) return null;
    for (const interval of Object.values(BillingInterval)) {
      if (this.priceIds[interval] === priceId) return interval;
    }
    this.logger.warn(`Price ID ${priceId} is not a Supporter price`);
    return null;
  }

  private priceIdFor(interval: BillingInterval): string {
    const priceId = this.priceIds[interval];
    if (!priceId) {
      throw new ServiceUnavailableException(
        `No Stripe price is configured for the ${interval}ly Supporter subscription`,
      );
    }
    return priceId;
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
   * Cancel subscription immediately, e.g. when the account is deleted.
   * A subscription Stripe no longer knows is already gone.
   */
  async cancelSubscriptionNow(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.code === 'resource_missing'
      ) {
        return;
      }
      throw error;
    }
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

  /** Switches a Supporter subscription between monthly and yearly billing. */
  async changeBillingInterval(
    subscriptionId: string,
    interval: BillingInterval,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: this.priceIdFor(interval),
        },
      ],
      proration_behavior: 'always_invoice',
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new ServiceUnavailableException('STRIPE_WEBHOOK_SECRET is not set');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
