import {
  ATHLETE_PRICING,
  COACH_PRICING,
  PRICES_CHECKED_ON,
  formatPrice,
} from '@/content/pricing';
import {
  DATE_LOCALES,
  type SupportedLocale,
  formatLongDate,
} from '@/utils/locales';

function coachYearly(id: string, athletes: number, locale: string): string {
  const plan = COACH_PRICING.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown coach pricing: ${id}`);
  return formatPrice(plan.yearly(athletes), plan.currency, locale);
}

function athleteYearly(id: string, locale: string): string {
  const plan = ATHLETE_PRICING.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown athlete pricing: ${id}`);
  return formatPrice(plan.yearly, plan.currency, locale);
}

/** Figures quoted in the article, from the dated price list. */
export function articlePrices(locale: SupportedLocale) {
  const intl = DATE_LOCALES[locale];
  return {
    checkedOn: formatLongDate(PRICES_CHECKED_ON, locale),
    tpPremiumYear: athleteYearly('trainingpeaks', intl),
    nolioPremiumYear: athleteYearly('nolio', intl),
    intervalsYear: athleteYearly('intervals-icu', intl),
    tpCoach10: coachYearly('trainingpeaks', 10, intl),
    nolioCoach10: coachYearly('nolio', 10, intl),
    finalSurgeCoach10: coachYearly('final-surge', 10, intl),
  };
}
