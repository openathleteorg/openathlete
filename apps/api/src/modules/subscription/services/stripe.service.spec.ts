import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType, BillingInterval } from '@openathlete/shared';

import { StripeService } from './stripe.service';

function service(env: Record<string, string> = {}) {
  const stripe = new StripeService({
    get: (key: string) => ({ STRIPE_SECRET_KEY: 'sk_test_fake', ...env })[key],
  } as unknown as ConfigService<ApiEnvSchemaType, true>);
  return stripe;
}

/** What Stripe answers for these lookup keys. */
function catalogue(
  stripe: StripeService,
  prices: {
    id: string;
    lookup_key: string;
    amount: number;
    interval: string;
  }[],
) {
  return jest.spyOn(stripe['stripe'].prices, 'list').mockResolvedValue({
    data: prices.map((price) => ({
      id: price.id,
      lookup_key: price.lookup_key,
      unit_amount: price.amount,
      recurring: { interval: price.interval },
    })),
  } as never);
}

describe('StripeService', () => {
  it('charges tax on an existing customer, at the chosen tier', async () => {
    const stripe = service();
    catalogue(stripe, [
      {
        id: 'price_80',
        lookup_key: 'supporter_8000_year',
        amount: 8000,
        interval: 'year',
      },
    ]);
    const create = jest
      .spyOn(stripe['stripe'].checkout.sessions, 'create')
      .mockResolvedValue({ id: 'cs_1' } as never);

    await stripe.createCheckoutSession(
      'cus_1',
      BillingInterval.YEAR,
      8000,
      'https://app.test/success',
      'https://app.test/cancel',
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        line_items: [{ price: 'price_80', quantity: 1 }],
        automatic_tax: { enabled: true },
        customer_update: { address: 'auto', name: 'auto' },
        tax_id_collection: { enabled: true },
      }),
    );
    expect(create.mock.calls[0][0]).not.toHaveProperty(
      'subscription_data.trial_period_days',
    );
  });

  it('finds every Supporter tier by lookup key', async () => {
    const stripe = service();
    const list = catalogue(stripe, [
      {
        id: 'price_12',
        lookup_key: 'supporter_1200_month',
        amount: 1200,
        interval: 'month',
      },
    ]);

    await expect(stripe.priceIdFor(BillingInterval.MONTH, 1200)).resolves.toBe(
      'price_12',
    );
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        lookup_keys: expect.arrayContaining([
          'supporter_500_month',
          'supporter_800_month',
          'supporter_1200_month',
          'supporter_5000_year',
          'supporter_8000_year',
          'supporter_12000_year',
        ]),
      }),
    );
  });

  it('keeps the prices of STRIPE_PRICE_SUPPORTER_* as the lowest tier', async () => {
    const stripe = service({
      STRIPE_PRICE_SUPPORTER_MONTHLY: 'price_old_month',
      STRIPE_PRICE_SUPPORTER_YEARLY: 'price_old_year',
    });
    catalogue(stripe, []);

    await expect(stripe.priceIdFor(BillingInterval.MONTH, 500)).resolves.toBe(
      'price_old_month',
    );
    await expect(stripe.priceIdFor(BillingInterval.YEAR, 5000)).resolves.toBe(
      'price_old_year',
    );
    await expect(stripe.priceIdFor(BillingInterval.YEAR, 8000)).rejects.toThrow(
      'No Stripe price',
    );
  });

  it('refuses amounts that are not a tier', async () => {
    const stripe = service();
    const list = catalogue(stripe, []);

    await expect(stripe.priceIdFor(BillingInterval.MONTH, 700)).rejects.toThrow(
      'UNKNOWN_TIER',
    );
    expect(list).not.toHaveBeenCalled();
  });

  it('ignores a price whose amount no longer matches its key', async () => {
    const stripe = service();
    catalogue(stripe, [
      {
        id: 'price_edited',
        lookup_key: 'supporter_800_month',
        amount: 900,
        interval: 'month',
      },
    ]);

    await expect(stripe.priceIdFor(BillingInterval.MONTH, 800)).rejects.toThrow(
      'No Stripe price',
    );
  });

  it('asks Stripe again after a failed lookup', async () => {
    const stripe = service();
    const list = jest
      .spyOn(stripe['stripe'].prices, 'list')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        data: [
          {
            id: 'price_8',
            lookup_key: 'supporter_800_month',
            unit_amount: 800,
            recurring: { interval: 'month' },
          },
        ],
      } as never);

    await expect(stripe.priceIdFor(BillingInterval.MONTH, 800)).rejects.toThrow(
      'STRIPE_PRICES_UNAVAILABLE',
    );
    await expect(stripe.priceIdFor(BillingInterval.MONTH, 800)).resolves.toBe(
      'price_8',
    );
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('moves a subscription to another tier with proration', async () => {
    const stripe = service();
    catalogue(stripe, [
      {
        id: 'price_12',
        lookup_key: 'supporter_12000_year',
        amount: 12000,
        interval: 'year',
      },
    ]);
    jest.spyOn(stripe, 'getSubscription').mockResolvedValue({
      items: { data: [{ id: 'si_1' }] },
    } as never);
    const update = jest
      .spyOn(stripe['stripe'].subscriptions, 'update')
      .mockResolvedValue({} as never);

    await stripe.changeSupporterPrice('sub_1', BillingInterval.YEAR, 12000);

    expect(update).toHaveBeenCalledWith('sub_1', {
      items: [{ id: 'si_1', price: 'price_12' }],
      proration_behavior: 'always_invoice',
    });
  });
});
