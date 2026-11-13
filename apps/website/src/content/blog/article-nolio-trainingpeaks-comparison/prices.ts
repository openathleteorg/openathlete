import { QUOTED_PRICES } from '@/content/competitors';
import { COACH_PRICING, formatPrice } from '@/content/pricing';

type Locale = 'en' | 'fr' | 'es' | 'it' | 'pt-br' | 'de';

/** Prices quoted in the post, read from the /compare figures. */
export function pricesFor(locale: Locale) {
  const quoted = (key: keyof typeof QUOTED_PRICES) => {
    const [amount, currency] = QUOTED_PRICES[key];
    return formatPrice(amount, currency, locale);
  };
  const coachYear = (id: string, athletes: number) => {
    const plan = COACH_PRICING.find((entry) => entry.id === id)!;
    return formatPrice(plan.yearly(athletes), plan.currency, locale);
  };
  return { quoted, coachYear };
}
