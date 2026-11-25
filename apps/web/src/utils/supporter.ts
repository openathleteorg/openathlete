import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';

import {
  BillingInterval,
  CurrentSubscriptionDto,
  OFFERS,
  Offer,
  SubscriptionPlan,
  SubscriptionStatus,
  tierPrices,
} from '@openathlete/shared';

/** The Supporter tiers of an interval, in cents, lowest first. */
export function supporterTiers(interval: BillingInterval): readonly number[] {
  return tierPrices(Offer.SUPPORTER, interval);
}

/**
 * The preselected Supporter tier of an interval, in cents: the lowest, so
 * the suggested one is a choice the user makes rather than a default.
 */
export function defaultSupporterTier(interval: BillingInterval): number {
  return supporterTiers(interval)[0]!;
}

/** Index of the suggested tier, with its badge, the same for both intervals. */
export const FEATURED_SUPPORTER_TIER = OFFERS[Offer.SUPPORTER].featuredTier;

/** The same tier position in the other interval (8 €/month ↔ 80 €/year) */
export function sameTierIn(
  amountCents: number,
  from: BillingInterval,
  to: BillingInterval,
): number {
  const index = supporterTiers(from).indexOf(amountCents);
  return supporterTiers(to)[index] ?? defaultSupporterTier(to);
}

/** Euros from cents, without decimals when there are none: 8, 7.99 */
function euros(amountCents: number): string {
  return Number.isInteger(amountCents / 100)
    ? String(amountCents / 100)
    : (amountCents / 100).toFixed(2);
}

/** A Supporter price, e.g. "€8/month" or "80 €/an". */
export function supporterPriceLabel(
  interval: BillingInterval,
  amountCents: number,
): string {
  const price = euros(amountCents);
  return interval === BillingInterval.YEAR
    ? m.supporter_price_year({ price })
    : m.supporter_price_month({ price });
}

/**
 * The terms of sale on the website, in French or English. Only the hosted
 * instance sells subscriptions, so the website defaults to openathlete.org.
 */
export function termsOfSaleUrl(): string {
  const website = (
    (import.meta.env.VITE_WEBSITE_URL as string | undefined) ||
    'https://openathlete.org'
  ).replace(/\/$/, '');
  return `${website}${getLocale() === 'fr' ? '/fr' : ''}/terms-of-sale`;
}

/** A Supporter, or one whose subscription has not run out yet */
export function isActiveSupporter(
  subscription: Pick<CurrentSubscriptionDto, 'plan' | 'status'>,
): boolean {
  return (
    subscription.plan === SubscriptionPlan.SUPPORTER &&
    subscription.status !== SubscriptionStatus.CANCELED
  );
}

/**
 * The plan whose rights the user has now: a Supporter subscription that is
 * cancelled, unpaid or incomplete gives the free plan's, as the API decides
 */
export function currentPlanOf(
  subscription: Pick<CurrentSubscriptionDto, 'plan' | 'status'>,
): SubscriptionPlan {
  const entitled =
    subscription.status === SubscriptionStatus.ACTIVE ||
    subscription.status === SubscriptionStatus.TRIALING;
  return entitled ? subscription.plan : SubscriptionPlan.FREE;
}
