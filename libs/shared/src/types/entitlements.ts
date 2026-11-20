import { BillingInterval } from './subscription.types';

/**
 * Every offer of the hosted instance, sold or not yet. This table is the
 * only source of prices and limits: the API enforces it, the app and the
 * website display it, and texts receive its values as parameters.
 *
 * Prices are in euro cents, VAT included. Yearly prices cost ten months.
 */
export enum Offer {
  FREE = 'FREE',
  SUPPORTER = 'SUPPORTER',
  COACH = 'COACH',
  COACH_PRO = 'COACH_PRO',
  CLUB = 'CLUB',
  CLUB_PLUS = 'CLUB_PLUS',
  /** Supporter rights a coach gives one of their athletes */
  COACH_SEAT = 'COACH_SEAT',
}

export interface OfferEntitlements {
  offer: Offer;
  /** Sold at checkout today; the others are declared for what comes next */
  onSale: boolean;
  /**
   * Price of each tier, per billing interval. Tiers of one offer have the
   * same content: a higher one is a bigger contribution. Null when free.
   */
  prices: Record<BillingInterval, readonly number[]> | null;
  /** Index of the tier shown first and preselected */
  featuredTier: number;
  /** Athletes coached outside any club; null: unlimited */
  maxCoachedAthletes: number | null;
  /** Coaches the subscription covers; null: unlimited or not applicable */
  includedCoaches: number | null;
  /** Price of each coach beyond the included ones; null: none sold */
  extraCoachPrices: Record<BillingInterval, number> | null;
  /** Athlete members of a club on this offer; null: not a club offer */
  maxClubAthletes: number | null;
  /** Staff (owners, admins, coaches, assistants) of such a club; null: unlimited */
  maxClubStaff: number | null;
  /** AI on the instance keys, within a weekly allowance */
  hostedAi: boolean;
  /** AI review of the training week (not built yet) */
  weeklyReview: boolean;
  /** AI race analyses (not built yet) */
  raceAnalysis: boolean;
  /** Supporter perks of FEATURES: the Lab, comparisons, clubs, images, themes, early access */
  supporterPerks: boolean;
  /** Advanced coach tools of FEATURES; in a club, the owner's rights count */
  coachTools: boolean;
}

const free: OfferEntitlements = {
  offer: Offer.FREE,
  onSale: false,
  prices: null,
  featuredTier: 0,
  maxCoachedAthletes: 5,
  includedCoaches: 1,
  extraCoachPrices: null,
  maxClubAthletes: 10,
  maxClubStaff: 2,
  hostedAi: false,
  weeklyReview: false,
  raceAnalysis: false,
  supporterPerks: false,
  coachTools: false,
};

export const OFFERS: Record<Offer, OfferEntitlements> = {
  [Offer.FREE]: free,
  [Offer.SUPPORTER]: {
    ...free,
    offer: Offer.SUPPORTER,
    onSale: true,
    prices: {
      [BillingInterval.MONTH]: [500, 800, 1200],
      [BillingInterval.YEAR]: [5000, 8000, 12000],
    },
    featuredTier: 1,
    // Unlimited until the Coach offer is on sale: coaches have nothing
    // else to buy yet
    maxCoachedAthletes: null,
    hostedAi: true,
    weeklyReview: true,
    raceAnalysis: true,
    supporterPerks: true,
    // Like unlimited athletes: until the Coach offer is on sale
    coachTools: true,
  },
  [Offer.COACH]: {
    ...free,
    offer: Offer.COACH,
    prices: {
      [BillingInterval.MONTH]: [1500],
      [BillingInterval.YEAR]: [15000],
    },
    maxCoachedAthletes: 30,
    hostedAi: true,
    weeklyReview: true,
    raceAnalysis: true,
    supporterPerks: true,
    coachTools: true,
  },
  [Offer.COACH_PRO]: {
    ...free,
    offer: Offer.COACH_PRO,
    prices: {
      [BillingInterval.MONTH]: [3500],
      [BillingInterval.YEAR]: [35000],
    },
    maxCoachedAthletes: 100,
    includedCoaches: 3,
    extraCoachPrices: {
      [BillingInterval.MONTH]: 500,
      [BillingInterval.YEAR]: 5000,
    },
    hostedAi: true,
    weeklyReview: true,
    raceAnalysis: true,
    supporterPerks: true,
    coachTools: true,
  },
  [Offer.CLUB]: {
    ...free,
    offer: Offer.CLUB,
    prices: {
      [BillingInterval.MONTH]: [2900],
      [BillingInterval.YEAR]: [29000],
    },
    maxClubAthletes: 100,
    maxClubStaff: null,
    hostedAi: true,
    // For the club's staff, in the club; the athletes get nothing more
    coachTools: true,
  },
  [Offer.CLUB_PLUS]: {
    ...free,
    offer: Offer.CLUB_PLUS,
    prices: {
      [BillingInterval.MONTH]: [4900],
      [BillingInterval.YEAR]: [49000],
    },
    maxClubAthletes: 250,
    maxClubStaff: null,
    hostedAi: true,
    // For the club's staff, in the club; the athletes get nothing more
    coachTools: true,
  },
  [Offer.COACH_SEAT]: {
    ...free,
    offer: Offer.COACH_SEAT,
    prices: {
      [BillingInterval.MONTH]: [300],
      [BillingInterval.YEAR]: [3000],
    },
    hostedAi: true,
    weeklyReview: true,
    raceAnalysis: true,
    supporterPerks: true,
  },
};

/**
 * Founders subscribed before this pricing: they keep their price and their
 * rights (unlimited coached athletes), and get every Supporter perk.
 */
export const FOUNDER_ENTITLEMENTS: OfferEntitlements = {
  ...OFFERS[Offer.SUPPORTER],
  maxCoachedAthletes: null,
};

/** The rights of a subscriber, founders included. */
export function entitlementsOf(
  offer: Offer,
  isFounder = false,
): OfferEntitlements {
  return isFounder && offer === Offer.SUPPORTER
    ? FOUNDER_ENTITLEMENTS
    : OFFERS[offer];
}

/** Tier prices of an offer for an interval; empty when free. */
export function tierPrices(
  offer: Offer,
  interval: BillingInterval,
): readonly number[] {
  return OFFERS[offer].prices?.[interval] ?? [];
}

/** The preselected tier price of an offer for an interval. */
export function featuredPrice(
  offer: Offer,
  interval: BillingInterval,
): number | null {
  const prices = tierPrices(offer, interval);
  return prices[OFFERS[offer].featuredTier] ?? prices[0] ?? null;
}

export function isTierPrice(
  offer: Offer,
  interval: BillingInterval,
  amountCents: number,
): boolean {
  return tierPrices(offer, interval).includes(amountCents);
}

/** Months the yearly price covers (the other two are free). */
export const MONTHS_PAID_PER_YEAR = 10;

/**
 * The reference monthly price of an offer, in euros: its cheapest yearly
 * tier over twelve months, plus the extra coaches. The hosted AI allowance
 * is a share of it, so every tier of an offer gets the same allowance.
 */
export function referenceMonthlyPriceEur(
  offer: Offer,
  extraCoaches = 0,
): number {
  const entitlements = OFFERS[offer];
  const yearly = entitlements.prices?.[BillingInterval.YEAR][0] ?? 0;
  const extra =
    (entitlements.extraCoachPrices?.[BillingInterval.YEAR] ?? 0) *
    Math.max(0, extraCoaches);
  return (yearly + extra) / 100 / 12;
}

/**
 * Stable Stripe lookup key of an offer's price, so that the API and the
 * setup script find prices without one environment variable each.
 */
export function stripeLookupKey(
  offer: Offer,
  interval: BillingInterval,
  amountCents: number,
): string {
  return `${offer.toLowerCase()}_${amountCents}_${interval}`;
}

/** Every Supporter price of the Stripe catalogue, with its lookup key. */
export function supporterStripePrices(): {
  lookupKey: string;
  interval: BillingInterval;
  amountCents: number;
}[] {
  return Object.values(BillingInterval).flatMap((interval) =>
    tierPrices(Offer.SUPPORTER, interval).map((amountCents) => ({
      lookupKey: stripeLookupKey(Offer.SUPPORTER, interval, amountCents),
      interval,
      amountCents,
    })),
  );
}

/** Athletes a free account may coach on an instance with billing. */
export const FREE_PLAN_MAX_ATHLETES = OFFERS[Offer.FREE]
  .maxCoachedAthletes as number;

/**
 * App Store auto-renewable subscriptions of the "Supporter" group in App
 * Store Connect, one per tier and interval. Apple charges its own nearest
 * price point; amountCents is the tier it stands for. The first two were
 * sold before the tiers and stand for the lowest one.
 */
export interface AppleSupporterProduct {
  productId: string;
  interval: BillingInterval;
  amountCents: number;
}

export const APPLE_SUPPORTER_PRODUCTS: readonly AppleSupporterProduct[] = [
  {
    productId: 'org.openathlete.supporter.monthly',
    interval: BillingInterval.MONTH,
    amountCents: 500,
  },
  {
    productId: 'org.openathlete.supporter.monthly.800',
    interval: BillingInterval.MONTH,
    amountCents: 800,
  },
  {
    productId: 'org.openathlete.supporter.monthly.1200',
    interval: BillingInterval.MONTH,
    amountCents: 1200,
  },
  {
    productId: 'org.openathlete.supporter.yearly',
    interval: BillingInterval.YEAR,
    amountCents: 5000,
  },
  {
    productId: 'org.openathlete.supporter.yearly.8000',
    interval: BillingInterval.YEAR,
    amountCents: 8000,
  },
  {
    productId: 'org.openathlete.supporter.yearly.12000',
    interval: BillingInterval.YEAR,
    amountCents: 12000,
  },
];

/** The tier and interval of an App Store product; null when it is not ours. */
export function appleSupporterProduct(
  productId: string,
): AppleSupporterProduct | null {
  return (
    APPLE_SUPPORTER_PRODUCTS.find((item) => item.productId === productId) ??
    null
  );
}

/** The App Store product of a tier, if one is sold for it. */
export function appleProductFor(
  interval: BillingInterval,
  amountCents: number,
): AppleSupporterProduct | null {
  return (
    APPLE_SUPPORTER_PRODUCTS.find(
      (item) => item.interval === interval && item.amountCents === amountCents,
    ) ?? null
  );
}
