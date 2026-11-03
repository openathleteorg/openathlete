/**
 * Competitors' list prices for the cost comparisons. Every figure comes from
 * the vendor's own pricing page on PRICES_CHECKED_ON; update the date with
 * the figures. Prices in USD are before tax, as the vendors show them.
 */
export const PRICES_CHECKED_ON = '2026-11-03';

export type Currency = 'EUR' | 'USD';

export interface CoachPricing {
  id: string;
  name: string;
  currency: Currency;
  source: string;
  /** Yearly cost for a coach with `athletes` athletes. */
  yearly: (athletes: number) => number;
}

/** OpenAthlete: five coached athletes free, unlimited with Supporter. */
export function openAthleteYearly(athletes: number): number {
  return athletes <= 5 ? 0 : 50;
}

/**
 * TrainingPeaks Coach Edition with athletes on Premium, so that planned
 * workouts reach their watches (a Premium feature): $21.99 a month including
 * one Premium athlete, then a per-athlete rate that falls with the count.
 */
function trainingPeaksPremiumYearly(athletes: number): number {
  const extra = Math.max(0, athletes - 1);
  const rate =
    athletes < 10 ? 9 : athletes < 20 ? 8.55 : athletes < 50 ? 8.1 : 7.65;
  return round2((21.99 + extra * rate) * 12);
}

/** Nolio coach plans, billed monthly. */
function nolioYearly(athletes: number): number {
  let monthly: number;
  if (athletes <= 3) monthly = 19.9;
  else if (athletes <= 25) monthly = 29.9;
  else if (athletes <= 30) monthly = 39.9;
  else if (athletes <= 50) monthly = 39.9 + (athletes - 30) * 1.5;
  else monthly = 39.9 + 20 * 1.5 + (athletes - 50) * 1;
  return round2(monthly * 12);
}

/** Final Surge coach plans, billed monthly. */
function finalSurgeYearly(athletes: number): number {
  return (athletes <= 5 ? 19 : 39) * 12;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export const COACH_PRICING: CoachPricing[] = [
  {
    id: 'trainingpeaks',
    name: 'TrainingPeaks',
    currency: 'USD',
    source: 'https://www.trainingpeaks.com/pricing/for-coaches/',
    yearly: trainingPeaksPremiumYearly,
  },
  {
    id: 'nolio',
    name: 'Nolio',
    currency: 'EUR',
    source: 'https://www.nolio.io/en/pricing',
    yearly: nolioYearly,
  },
  {
    id: 'final-surge',
    name: 'Final Surge',
    currency: 'USD',
    source: 'https://www.finalsurge.com/pricing',
    yearly: finalSurgeYearly,
  },
];

/** What a self-coached athlete pays per year for the paid tier. */
export const ATHLETE_PRICING = [
  { id: 'openathlete', name: 'OpenAthlete', currency: 'EUR', yearly: 0 },
  { id: 'intervals-icu', name: 'intervals.icu', currency: 'USD', yearly: 48 },
  { id: 'strava', name: 'Strava', currency: 'EUR', yearly: 59.99 },
  { id: 'nolio', name: 'Nolio Premium', currency: 'EUR', yearly: 82.8 },
  { id: 'runna', name: 'Runna', currency: 'EUR', yearly: 119.99 },
  {
    id: 'trainingpeaks',
    name: 'TrainingPeaks Premium',
    currency: 'USD',
    yearly: 134.99,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  currency: Currency;
  yearly: number;
}>;

export function formatPrice(
  amount: number,
  currency: Currency,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
