import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType, BillingInterval } from '@openathlete/shared';

import { StripeService } from './stripe.service';

const ENV: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_fake',
  STRIPE_PRICE_SUPPORTER_MONTHLY: 'price_month',
  STRIPE_PRICE_SUPPORTER_YEARLY: 'price_year',
};

describe('StripeService.createCheckoutSession', () => {
  it('charges tax on an existing customer, saving the address Checkout collects', async () => {
    const service = new StripeService({
      get: (key: string) => ENV[key],
    } as unknown as ConfigService<ApiEnvSchemaType, true>);
    const create = jest
      .spyOn(service['stripe'].checkout.sessions, 'create')
      .mockResolvedValue({ id: 'cs_1' } as never);

    await service.createCheckoutSession(
      'cus_1',
      BillingInterval.YEAR,
      'https://app.test/success',
      'https://app.test/cancel',
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        line_items: [{ price: 'price_year', quantity: 1 }],
        automatic_tax: { enabled: true },
        customer_update: { address: 'auto', name: 'auto' },
        tax_id_collection: { enabled: true },
      }),
    );
  });
});
