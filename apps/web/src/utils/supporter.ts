import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';

import {
  BillingInterval,
  CurrentSubscriptionDto,
  PLAN_CONFIGS,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/shared';

const SUPPORTER_PRICES = PLAN_CONFIGS[SubscriptionPlan.SUPPORTER].prices!;

/** A Supporter price, e.g. "€5/month" or "50 €/an". */
export function supporterPriceLabel(interval: BillingInterval): string {
  const price = SUPPORTER_PRICES[interval];
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
