import { describe, expect, it } from 'vitest';

import { SubscriptionPlan, SubscriptionStatus } from '@openathlete/shared';

import { currentPlanOf } from './supporter';

describe('currentPlanOf', () => {
  it.each([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING])(
    'is Supporter while the subscription is %s',
    (status) => {
      expect(currentPlanOf({ plan: SubscriptionPlan.SUPPORTER, status })).toBe(
        SubscriptionPlan.SUPPORTER,
      );
    },
  );

  it.each([
    SubscriptionStatus.CANCELED,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.INCOMPLETE,
  ])('is free once a Supporter subscription is %s', (status) => {
    expect(currentPlanOf({ plan: SubscriptionPlan.SUPPORTER, status })).toBe(
      SubscriptionPlan.FREE,
    );
  });
});
