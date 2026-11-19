import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType, Offer } from '@openathlete/shared';

import { AiPolicyService, WEEKS_PER_MONTH } from './ai-policy.service';

// Arbitrary values for the tests: the production share is set in the
// hosting platform only
function policy(env: Record<string, string | number | undefined>) {
  const service = new AiPolicyService({
    get: (key: string) => env[key],
  } as unknown as ConfigService<ApiEnvSchemaType, true>);
  const error = jest
    .spyOn(service['logger'], 'error')
    .mockImplementation(() => undefined);
  return { service, error };
}

const STRIPE = { STRIPE_SECRET_KEY: 'sk_test' };

describe('AiPolicyService.weeklyAllowanceUsd', () => {
  it("is a share of the offer's cheapest yearly price, a month's worth spread over its weeks", () => {
    const { service } = policy({
      ...STRIPE,
      AI_HOSTED_BUDGET_SHARE: '0.5',
      AI_EUR_TO_USD: '1',
    });

    // Supporter: 50 € a year
    expect(service.weeklyAllowanceUsd(Offer.SUPPORTER)).toBeCloseTo(
      ((50 / 12) * 0.5) / WEEKS_PER_MONTH,
    );
    // Coach Pro with two extra coaches: (350 € + 2 × 50 €) a year
    expect(service.weeklyAllowanceUsd(Offer.COACH_PRO, 2)).toBeCloseTo(
      ((450 / 12) * 0.5) / WEEKS_PER_MONTH,
    );
  });

  it('converts euros to dollars', () => {
    const { service } = policy({
      ...STRIPE,
      AI_HOSTED_BUDGET_SHARE: '0.5',
      AI_EUR_TO_USD: '2',
    });

    expect(service.weeklyAllowanceUsd(Offer.SUPPORTER)).toBeCloseTo(
      ((50 / 12) * 0.5 * 2) / WEEKS_PER_MONTH,
    );
  });

  it("lets an offer's own share override the general one", () => {
    const { service } = policy({
      ...STRIPE,
      AI_HOSTED_BUDGET_SHARE: '0.5',
      AI_HOSTED_BUDGET_SHARE_CLUB: '0.25',
      AI_EUR_TO_USD: '1',
    });

    expect(service.weeklyAllowanceUsd(Offer.CLUB)).toBeCloseTo(
      ((290 / 12) * 0.25) / WEEKS_PER_MONTH,
    );
    expect(service.weeklyAllowanceUsd(Offer.CLUB_PLUS)).toBeCloseTo(
      ((490 / 12) * 0.5) / WEEKS_PER_MONTH,
    );
  });

  it('spreads the older monthly budget over the weeks when no share is set', () => {
    const { service } = policy({ ...STRIPE, AI_HOSTED_MONTHLY_BUDGET_USD: 2 });

    expect(service.weeklyAllowanceUsd(Offer.SUPPORTER)).toBeCloseTo(
      2 / WEEKS_PER_MONTH,
    );
  });

  it('gives nothing with Stripe but no share, and says so at boot without failing', () => {
    const { service, error } = policy({ ...STRIPE });

    expect(() => service.onApplicationBootstrap()).not.toThrow();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('AI_HOSTED_BUDGET_SHARE'),
    );
    expect(service.weeklyAllowanceUsd(Offer.SUPPORTER)).toBe(0);
  });

  it.each(['1.5', '-0.1', 'abc', ''])(
    'treats the invalid share %p as missing',
    (share) => {
      const { service, error } = policy({
        ...STRIPE,
        AI_HOSTED_BUDGET_SHARE: share,
        AI_EUR_TO_USD: '1',
      });

      service.onApplicationBootstrap();
      expect(error).toHaveBeenCalled();
      expect(service.weeklyAllowanceUsd(Offer.SUPPORTER)).toBe(0);
    },
  );

  it('needs the exchange rate too', () => {
    const { service } = policy({ ...STRIPE, AI_HOSTED_BUDGET_SHARE: '0.5' });

    expect(service.weeklyAllowanceUsd(Offer.SUPPORTER)).toBe(0);
  });

  it('limits nobody on an instance without Stripe', () => {
    const { service, error } = policy({});

    service.onApplicationBootstrap();
    expect(error).not.toHaveBeenCalled();
    expect(service.weeklyAllowanceUsd(Offer.FREE)).toBeUndefined();
  });

  it("applies a self-hoster's monthly budget to everyone", () => {
    const { service } = policy({ AI_HOSTED_MONTHLY_BUDGET_USD: 4 });

    expect(service.weeklyAllowanceUsd(Offer.FREE)).toBeCloseTo(
      4 / WEEKS_PER_MONTH,
    );
  });
});
