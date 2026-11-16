import {
  SUPPORTER_MONTHLY_EUR,
  SUPPORTER_MONTHLY_TIERS_EUR,
  SUPPORTER_YEARLY_EUR,
  SUPPORTER_YEARLY_TIERS_EUR,
} from '@/config';
import { formatPrice } from '@/content/pricing';
import { DATE_LOCALES, type SupportedLocale } from '@/utils/locales';

/**
 * Supporter prices formatted for a locale, as message inputs: messages never
 * hold a price, so that the offers table stays the only source.
 * - `month`, `year`: the lowest tier ("from" phrasing, coach price);
 * - `monthTiers`, `yearTiers`: every tier, as "5 €, 8 € or 12 €".
 */
export function supporterPriceVars(locale: SupportedLocale) {
  const intl = DATE_LOCALES[locale];
  const price = (amount: number) => formatPrice(amount, 'EUR', intl);
  const tiers = (amounts: readonly number[]) =>
    new Intl.ListFormat(intl, { type: 'disjunction' }).format(
      amounts.map(price),
    );
  return {
    month: price(SUPPORTER_MONTHLY_EUR),
    year: price(SUPPORTER_YEARLY_EUR),
    monthTiers: tiers(SUPPORTER_MONTHLY_TIERS_EUR),
    yearTiers: tiers(SUPPORTER_YEARLY_TIERS_EUR),
  };
}

/**
 * The Supporter plan as schema.org offers: one per tier and billing period,
 * since tiers differ only in price.
 */
export function supporterOffers(url?: string): Record<string, unknown>[] {
  const offer = (price: number, duration: 'P1M' | 'P1Y') => ({
    '@type': 'Offer',
    name: `Supporter (${duration === 'P1M' ? 'monthly' : 'yearly'}, ${price} EUR)`,
    ...(url ? { url } : {}),
    price: String(price),
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'EUR',
      valueAddedTaxIncluded: true,
      billingDuration: duration,
    },
  });
  return [
    ...SUPPORTER_MONTHLY_TIERS_EUR.map((price) => offer(price, 'P1M')),
    ...SUPPORTER_YEARLY_TIERS_EUR.map((price) => offer(price, 'P1Y')),
  ];
}
