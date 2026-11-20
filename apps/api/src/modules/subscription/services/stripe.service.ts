import Stripe from 'stripe';

import {
  BadRequestException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ApiEnvSchemaType,
  BillingInterval,
  Offer,
  TERMS_OF_SALE_VERSION,
  isTierPrice,
  stripeLookupKey,
  supporterStripePrices,
  tierPrices,
} from '@openathlete/shared';

/** A Supporter price of the Stripe catalogue. */
export interface SupporterStripePrice {
  priceId: string;
  interval: BillingInterval;
  amountCents: number;
}

@Injectable()
export class StripeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;
  /**
   * Prices set by STRIPE_PRICE_SUPPORTER_*, from before lookup keys: they
   * stand for the lowest tier when the catalogue has no price for it.
   */
  private readonly legacyPriceIds: Record<BillingInterval, string | undefined>;
  /** The Supporter prices, by lookup key, found on first use */
  private catalog: Promise<Map<string, SupporterStripePrice>> | null = null;

  constructor(
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (secretKey) {
      // Tests point the client at stripe-mock; production never sets it
      const apiUrl = this.configService.get('STRIPE_API_URL');
      const target = apiUrl ? new URL(apiUrl) : null;
      this.client = new Stripe(secretKey, {
        apiVersion: '2025-11-17.clover',
        ...(target && {
          host: target.hostname,
          port: target.port || undefined,
          protocol: target.protocol.replace(':', '') as 'http' | 'https',
        }),
      });
    } else {
      // Billing is optional: self-hosted instances run without Stripe.
      this.client = null;
      this.logger.warn('STRIPE_SECRET_KEY is not set, billing is disabled');
    }

    this.legacyPriceIds = {
      [BillingInterval.MONTH]: this.configService.get(
        'STRIPE_PRICE_SUPPORTER_MONTHLY',
      ),
      [BillingInterval.YEAR]: this.configService.get(
        'STRIPE_PRICE_SUPPORTER_YEARLY',
      ),
    };
  }

  /** Finds the prices at boot, so a missing one shows in the logs at once. */
  onApplicationBootstrap(): void {
    if (!this.client) return;
    void this.supporterPrices().catch(() => undefined);
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
    amountCents: number,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    const price = await this.priceIdFor(interval, amountCents);
    return await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
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
   * The Supporter prices of the catalogue, by lookup key (created by
   * scripts/stripe/setup-pricing-v2.ts). A failed lookup is retried on the
   * next call instead of being kept.
   */
  supporterPrices(): Promise<Map<string, SupporterStripePrice>> {
    if (!this.catalog) {
      this.catalog = this.loadSupporterPrices().catch((error: unknown) => {
        this.catalog = null;
        this.logger.error(
          `Could not read the Supporter prices from Stripe: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new ServiceUnavailableException('STRIPE_PRICES_UNAVAILABLE');
      });
    }
    return this.catalog;
  }

  private async loadSupporterPrices(): Promise<
    Map<string, SupporterStripePrice>
  > {
    const wanted = supporterStripePrices();
    const found = await this.stripe.prices.list({
      lookup_keys: wanted.map((price) => price.lookupKey),
      active: true,
      limit: 100,
    });
    const prices = new Map<string, SupporterStripePrice>();
    for (const price of found.data) {
      const tier = wanted.find((item) => item.lookupKey === price.lookup_key);
      // A price edited by hand that no longer matches its key is not sold
      if (
        tier &&
        price.unit_amount === tier.amountCents &&
        price.recurring?.interval === tier.interval
      ) {
        prices.set(tier.lookupKey, { priceId: price.id, ...tier });
      }
    }
    for (const interval of Object.values(BillingInterval)) {
      const lowest = tierPrices(Offer.SUPPORTER, interval)[0];
      const key = stripeLookupKey(Offer.SUPPORTER, interval, lowest);
      const legacy = this.legacyPriceIds[interval];
      if (!prices.has(key) && legacy) {
        prices.set(key, { priceId: legacy, interval, amountCents: lowest });
      }
    }
    const missing = wanted.filter((price) => !prices.has(price.lookupKey));
    if (missing.length) {
      this.logger.warn(
        `Stripe has no active price for ${missing.map((price) => price.lookupKey).join(', ')}: run scripts/stripe/setup-pricing-v2.ts`,
      );
    }
    return prices;
  }

  /** The Stripe price of a Supporter tier. */
  async priceIdFor(
    interval: BillingInterval,
    amountCents: number,
  ): Promise<string> {
    if (!isTierPrice(Offer.SUPPORTER, interval, amountCents)) {
      throw new BadRequestException('UNKNOWN_TIER');
    }
    const prices = await this.supporterPrices();
    const price = prices.get(
      stripeLookupKey(Offer.SUPPORTER, interval, amountCents),
    );
    if (!price) {
      throw new ServiceUnavailableException(
        `No Stripe price is configured for the ${amountCents / 100} € ${interval}ly Supporter tier`,
      );
    }
    return price.priceId;
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

  /**
   * Moves a Supporter subscription to another tier or interval, at once.
   * The unused part of the period is credited and the difference invoiced.
   */
  async changeSupporterPrice(
    subscriptionId: string,
    interval: BillingInterval,
    amountCents: number,
  ): Promise<Stripe.Subscription> {
    const price = await this.priceIdFor(interval, amountCents);
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [{ id: subscription.items.data[0].id, price }],
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
