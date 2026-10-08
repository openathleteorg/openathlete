import Stripe from 'stripe';

import { BillingInterval } from '@openathlete/shared';

import {
  appleRenewalInfo,
  appleTransaction,
} from '../apple/apple-store.fixture';
import { StripeService } from './stripe.service';
import {
  SubscriptionService,
  appleSubscriptionFields,
} from './subscription.service';

const PRICES: Record<string, BillingInterval> = {
  price_month: BillingInterval.MONTH,
  price_year: BillingInterval.YEAR,
};

function stripeSubscription(
  overrides: Partial<Stripe.Subscription> = {},
  priceId = 'price_year',
  recurring: 'month' | 'year' = 'year',
): Stripe.Subscription {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    cancel_at_period_end: false,
    trial_end: null,
    items: {
      data: [
        {
          id: 'si_1',
          current_period_start: 1_790_000_000,
          current_period_end: 1_821_536_000,
          price: { id: priceId, recurring: { interval: recurring } },
        },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function setup({
  billingEnabled = true,
  stored = null as Record<string, unknown> | null,
  coachedAthletes = 0,
} = {}) {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ userId: 7 }) },
    subscription: {
      findUnique: jest.fn().mockResolvedValue(stored),
      create: jest.fn(({ data }) =>
        Promise.resolve({ subscriptionId: 1, ...data }),
      ),
      update: jest.fn(({ data }) => Promise.resolve({ ...stored, ...data })),
      upsert: jest.fn(({ create }) => Promise.resolve(create)),
    },
    coachAthlete: { count: jest.fn().mockResolvedValue(coachedAthletes) },
  };
  const stripe = {
    billingEnabled,
    intervalOfPrice: (priceId?: string) => (priceId && PRICES[priceId]) ?? null,
    getSubscription: jest.fn().mockResolvedValue(stripeSubscription()),
    getCustomer: jest
      .fn()
      .mockResolvedValue({ id: 'cus_1', metadata: { userId: '7' } }),
  };
  const service = new SubscriptionService(
    prisma as never,
    stripe as unknown as StripeService,
  );
  return { prisma, stripe, service };
}

describe('SubscriptionService', () => {
  describe('athletes a user may coach', () => {
    it('limits free accounts to five athletes', async () => {
      const { service } = setup({
        stored: { plan: 'FREE', status: 'active' },
        coachedAthletes: 5,
      });

      await expect(service.getMaxAthletesForUser(7)).resolves.toBe(5);
      await expect(service.canAddAthlete(7)).resolves.toBe(false);
    });

    it('lets Supporters coach any number of athletes', async () => {
      const { service } = setup({
        stored: { plan: 'SUPPORTER', status: 'active' },
        coachedAthletes: 40,
      });

      await expect(service.getMaxAthletesForUser(7)).resolves.toBeNull();
      await expect(service.canAddAthlete(7)).resolves.toBe(true);
    });

    it('falls back to the free limit when a payment fails', async () => {
      const { service } = setup({
        stored: { plan: 'SUPPORTER', status: 'past_due' },
      });

      await expect(service.getMaxAthletesForUser(7)).resolves.toBe(5);
    });

    it('limits nobody on an instance without billing', async () => {
      const { service } = setup({
        billingEnabled: false,
        stored: { plan: 'FREE', status: 'active' },
        coachedAthletes: 30,
      });

      await expect(service.canAddAthlete(7)).resolves.toBe(true);
    });
  });

  it('gives AI on the instance keys to active Supporters only', async () => {
    const supporter = setup({
      stored: { plan: 'SUPPORTER', status: 'active' },
    });
    const free = setup({ stored: { plan: 'FREE', status: 'active' } });
    const canceled = setup({
      stored: { plan: 'SUPPORTER', status: 'canceled' },
    });

    await expect(supporter.service.hasAIFeaturesAccess(7)).resolves.toBe(true);
    await expect(free.service.hasAIFeaturesAccess(7)).resolves.toBe(false);
    await expect(canceled.service.hasAIFeaturesAccess(7)).resolves.toBe(false);
  });

  describe('Stripe subscriptions', () => {
    it('records a checkout as a yearly Supporter subscription', async () => {
      const { prisma, service } = setup();

      await service.createSubscriptionFromCheckout(7, 'cus_1', 'sub_1');

      expect(prisma.subscription.upsert).toHaveBeenCalledWith({
        where: { userId: 7 },
        create: expect.objectContaining({
          userId: 7,
          plan: 'SUPPORTER',
          billingInterval: 'year',
          status: 'active',
          stripeCustomerId: 'cus_1',
          stripeSubscriptionId: 'sub_1',
          currentPeriodStart: new Date(1_790_000_000 * 1000),
          currentPeriodEnd: new Date(1_821_536_000 * 1000),
        }),
        update: expect.objectContaining({ plan: 'SUPPORTER' }),
      });
    });

    it('follows interval changes and cancellations from webhooks', async () => {
      const { prisma, service } = setup({
        stored: { subscriptionId: 3, plan: 'SUPPORTER' },
      });

      await service.updateSubscriptionFromWebhook(
        stripeSubscription(
          { status: 'active', cancel_at_period_end: true },
          'price_month',
          'month',
        ),
      );

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { subscriptionId: 3 },
        data: expect.objectContaining({
          billingInterval: 'month',
          cancelAtPeriodEnd: true,
        }),
      });
    });

    it('reads the interval from Stripe for a price it does not know', async () => {
      const { prisma, service } = setup({
        stored: { subscriptionId: 3, plan: 'SUPPORTER' },
      });

      await service.updateSubscriptionFromWebhook(
        stripeSubscription({}, 'price_promo', 'month'),
      );

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ billingInterval: 'month' }),
        }),
      );
    });

    it('creates the subscription when the webhook comes before checkout', async () => {
      const { prisma, service } = setup();

      await service.updateSubscriptionFromWebhook(stripeSubscription());

      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 7 },
          create: expect.objectContaining({ stripeSubscriptionId: 'sub_1' }),
        }),
      );
    });
  });
});

describe('appleSubscriptionFields', () => {
  const now = new Date('2026-10-08T12:00:00Z');
  const at = (iso: string) => new Date(iso).getTime();
  const transaction = (overrides: Record<string, unknown> = {}) =>
    appleTransaction({
      purchaseDate: at('2026-10-01T12:00:00Z'),
      expiresDate: at('2026-11-01T12:00:00Z'),
      ...overrides,
    }) as never;

  it('gives access until the paid period ends', () => {
    expect(appleSubscriptionFields(transaction(), null, now)).toMatchObject({
      plan: 'SUPPORTER',
      provider: 'apple',
      billingInterval: 'month',
      status: 'active',
      currentPeriodStart: new Date('2026-10-01T12:00:00Z'),
      currentPeriodEnd: new Date('2026-11-01T12:00:00Z'),
      appleOriginalTransactionId: '2000000000000001',
    });
  });

  it('reads the yearly product', () => {
    const fields = appleSubscriptionFields(
      transaction({ productId: 'org.openathlete.supporter.yearly' }),
      null,
      now,
    );
    expect(fields.billingInterval).toBe('year');
  });

  it('ends access once the period is over', () => {
    const fields = appleSubscriptionFields(
      transaction({ expiresDate: at('2026-10-07T12:00:00Z') }),
      null,
      now,
    );
    expect(fields.status).toBe('canceled');
  });

  it("keeps access through Apple's billing grace period", () => {
    const fields = appleSubscriptionFields(
      transaction({ expiresDate: at('2026-10-07T12:00:00Z') }),
      appleRenewalInfo({
        gracePeriodExpiresDate: at('2026-10-14T12:00:00Z'),
      }) as never,
      now,
    );
    expect(fields).toMatchObject({
      status: 'active',
      currentPeriodEnd: new Date('2026-10-14T12:00:00Z'),
    });
  });

  it('ends access at once after a refund', () => {
    const fields = appleSubscriptionFields(
      transaction({ revocationDate: at('2026-10-05T12:00:00Z') }),
      null,
      now,
    );
    expect(fields.status).toBe('canceled');
  });

  it('reads whether the subscription renews from the renewal info only', () => {
    expect(
      appleSubscriptionFields(transaction(), null, now),
    ).not.toHaveProperty('cancelAtPeriodEnd');
    const off = appleRenewalInfo({ autoRenewStatus: 0 }) as never;
    expect(appleSubscriptionFields(transaction(), off, now)).toMatchObject({
      cancelAtPeriodEnd: true,
    });
  });

  it('refuses products that are not the Supporter subscription', () => {
    expect(() =>
      appleSubscriptionFields(
        transaction({ productId: 'org.openathlete.other' }),
        null,
        now,
      ),
    ).toThrow('UNKNOWN_APPLE_PRODUCT');
  });
});
