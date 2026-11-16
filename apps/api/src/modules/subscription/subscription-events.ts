import { Subscription } from '@openathlete/database';
import { Offer } from '@openathlete/shared';

/**
 * Properties of the billing events sent to PostHog from webhooks. They are
 * sent whatever the user's analytics consent, as billing facts, so they
 * carry the pseudonymous user id and nothing that identifies the person.
 */
export function billingEventProperties(
  subscription: Pick<
    Subscription,
    | 'plan'
    | 'amountCents'
    | 'currency'
    | 'billingInterval'
    | 'provider'
    | 'isFounder'
  >,
) {
  return {
    offer: subscription.plan === 'SUPPORTER' ? Offer.SUPPORTER : Offer.FREE,
    amount_cents: subscription.amountCents,
    currency: subscription.currency,
    interval: subscription.billingInterval,
    quantity: 1,
    provider: subscription.provider,
    founder: subscription.isFounder,
  };
}
