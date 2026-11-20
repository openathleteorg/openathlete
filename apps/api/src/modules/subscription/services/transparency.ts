import {
  BillingInterval,
  Offer,
  SUPPORTER_WALL_NAME_MAX_LENGTH,
  tierPrices,
} from '@openathlete/shared';

/**
 * French VAT, taken out of every price. Customers in other EU countries
 * pay their own rate: the revenue is an estimate, which percentages of
 * progress can afford.
 */
export const VAT_RATE = 0.2;

export interface PaidSubscription {
  /** Price of the tier, VAT included; null on rows older than the tiers */
  amountCents: number | null;
  billingInterval: BillingInterval | null;
}

/**
 * Monthly revenue of the running subscriptions, in euros excluding VAT: a
 * yearly price counts for a twelfth each month.
 */
export function monthlyRevenueEur(subscriptions: PaidSubscription[]): number {
  let cents = 0;
  for (const { amountCents, billingInterval } of subscriptions) {
    const interval = billingInterval ?? BillingInterval.MONTH;
    // Rows from before the tiers paid the lowest one
    const price = amountCents ?? tierPrices(Offer.SUPPORTER, interval)[0];
    cents += interval === BillingInterval.YEAR ? price / 12 : price;
  }
  return cents / (1 + VAT_RATE) / 100;
}

/**
 * Progress of each funding tier, in whole percent of its own step: tier n
 * goes from threshold n-1 (0 for the first) to threshold n. Rounded down,
 * so that 100 means reached. Null unless every threshold is set and they
 * increase, since a partial ladder would be wrong.
 */
export function tierProgress(
  revenueEur: number,
  thresholds: ReadonlyArray<number | undefined>,
): number[] | null {
  if (thresholds.length === 0) return null;
  const valid = thresholds.every(
    (value, index): value is number =>
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > (index === 0 ? 0 : (thresholds[index - 1] as number)),
  );
  if (!valid) return null;

  return (thresholds as number[]).map((threshold, index) => {
    const start = index === 0 ? 0 : (thresholds[index - 1] as number);
    if (revenueEur >= threshold) return 100;
    if (revenueEur <= start) return 0;
    return Math.min(
      99,
      Math.floor(((revenueEur - start) / (threshold - start)) * 100),
    );
  });
}

export interface WallCandidate {
  showOnSupporterWall: boolean;
  wallName: string | null;
  firstName: string;
}

/**
 * Names on the wall, in the order given: the chosen name, else the first
 * name. Callers pass running Supporter subscriptions only.
 */
export function wallNames(candidates: WallCandidate[]): string[] {
  return candidates
    .filter((candidate) => candidate.showOnSupporterWall)
    .map((candidate) =>
      (candidate.wallName?.trim() || candidate.firstName.trim()).slice(
        0,
        SUPPORTER_WALL_NAME_MAX_LENGTH,
      ),
    )
    .filter((name) => name.length > 0);
}
