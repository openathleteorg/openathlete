import { z } from 'zod';

/**
 * Features that depend on the user's rights on an instance that sells
 * subscriptions. Without billing (self-hosted), every one of them is
 * available to everyone: featureAccess() returns early.
 *
 * Keys are stable: they reach PostHog, the paywall texts and the API errors.
 */
export enum Feature {
  /** Overlaying another period on the statistics ("Compare with") */
  STATISTICS_COMPARE = 'statistics-compare',
  /** The Lab: capacities, trends and records year by year */
  LAB = 'lab',
  /** Choosing the columns of the coach dashboard */
  COACH_COLUMNS = 'coach-columns',
  /** Setting one's own metric alert thresholds */
  COACH_THRESHOLDS = 'coach-thresholds',
  /** Comparing with the previous period, and athletes with each other */
  COACH_COMPARE = 'coach-compare',
  /** Writing to several people at once, now or at a set time */
  COACH_BROADCAST = 'coach-broadcast',
  /** More than one active (not archived) questionnaire */
  COACH_QUESTIONNAIRES = 'coach-questionnaires',
  /** Owning clubs: creating one, inviting, adding members and sessions */
  CLUBS = 'clubs',
  /** Attaching images to notes and messages (storage costs) */
  IMAGES = 'images',
  /** Accent colour themes */
  THEMES = 'themes',
}

/** Who gets a feature once its early access is over */
export type FeaturePerk = 'everyone' | 'supporter' | 'coachTools';

export interface FeatureRule {
  perk: FeaturePerk;
  /**
   * Supporter early access: the day the feature reached the hosted
   * instance (YYYY-MM-DD, UTC) and how long Supporters have it alone.
   * Remove the field once the feature is public (a test reminds).
   */
  earlyAccess?: { since: string; days?: number };
  /** What someone without the rights sees */
  teaser: 'preview' | 'locked-entry' | 'hidden';
  /**
   * False when the API cannot withhold the data, because a free view needs
   * it too (records, statistics of a period): the lock is in the app only.
   */
  serverEnforced: boolean;
}

export const EARLY_ACCESS_DEFAULT_DAYS = 30;

/** Days an early-access entry may stay in FEATURES after going public */
export const EARLY_ACCESS_CLEANUP_DAYS = 60;

export const FEATURES: Record<Feature, FeatureRule> = {
  // Each period stays readable on its own: only the overlay is a perk, so
  // the statistics endpoints keep answering for any period
  [Feature.STATISTICS_COMPARE]: {
    perk: 'supporter',
    teaser: 'locked-entry',
    serverEnforced: false,
  },
  // terrain, cardiac-cost, durability and trends send a teaser; profile,
  // performance and records by year are computed in the app from the
  // records, which the free records page needs
  [Feature.LAB]: { perk: 'supporter', teaser: 'preview', serverEnforced: true },
  [Feature.COACH_COLUMNS]: {
    perk: 'coachTools',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  [Feature.COACH_THRESHOLDS]: {
    perk: 'coachTools',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  // The previous period is a parameter of the dashboard; comparing athletes
  // reads the dashboard rows the coach already has
  [Feature.COACH_COMPARE]: {
    perk: 'coachTools',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  [Feature.COACH_BROADCAST]: {
    perk: 'coachTools',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  [Feature.COACH_QUESTIONNAIRES]: {
    perk: 'coachTools',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  [Feature.CLUBS]: {
    perk: 'supporter',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  [Feature.IMAGES]: {
    perk: 'supporter',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
  [Feature.THEMES]: {
    perk: 'supporter',
    teaser: 'locked-entry',
    serverEnforced: true,
  },
};

/** The rights featureAccess() weighs, from OfferEntitlements */
export interface FeaturePerks {
  supporterPerks: boolean;
  coachTools: boolean;
}

export const featureAccessReasonSchema = z.enum([
  /** Nothing is sold on this instance, or the feature is for everyone */
  'free',
  /** The user's rights include it */
  'perk',
  /** Supporters only until availableToAllOn */
  'early-access',
  /** Needs a perk the user does not have */
  'locked',
]);

export type FeatureAccessReason = z.infer<typeof featureAccessReasonSchema>;

export const featureAccessDtoSchema = z.object({
  available: z.boolean(),
  reason: featureAccessReasonSchema,
  /** End of the early access (YYYY-MM-DD), when there is one */
  availableToAllOn: z.string().nullable(),
});

export type FeatureAccessDto = z.infer<typeof featureAccessDtoSchema>;

export const featureAccessMapSchema = z.record(
  z.nativeEnum(Feature),
  featureAccessDtoSchema,
);

export type FeatureAccessMap = Record<Feature, FeatureAccessDto>;

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid feature date: ${value}`);
  }
  return Date.parse(`${value}T00:00:00Z`);
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The first UTC day a feature in early access is available to all, or null
 * without early access.
 */
export function earlyAccessEnd(rule: FeatureRule): string | null {
  if (!rule.earlyAccess) return null;
  const days = rule.earlyAccess.days ?? EARLY_ACCESS_DEFAULT_DAYS;
  return isoDay(utcDay(rule.earlyAccess.since) + days * DAY_MS);
}

function hasPerk(perk: FeaturePerk, perks: FeaturePerks): boolean {
  if (perk === 'everyone') return true;
  return perk === 'supporter' ? perks.supporterPerks : perks.coachTools;
}

/**
 * Whether a user may use a feature. Pure: the API calls it with its own
 * clock and sends the result to the app, so a device's clock never decides.
 */
export function featureAccess(
  feature: Feature,
  context: { billingEnabled: boolean; perks: FeaturePerks; now: Date },
  registry: Record<string, FeatureRule> = FEATURES,
): FeatureAccessDto {
  const rule = registry[feature];
  const end = earlyAccessEnd(rule);
  const availableToAllOn =
    end !== null && context.now.getTime() < utcDay(end) ? end : null;

  if (!context.billingEnabled) {
    return { available: true, reason: 'free', availableToAllOn: null };
  }
  if (availableToAllOn) {
    return {
      available: context.perks.supporterPerks,
      reason: 'early-access',
      availableToAllOn,
    };
  }
  if (rule.perk === 'everyone') {
    return { available: true, reason: 'free', availableToAllOn: null };
  }
  return hasPerk(rule.perk, context.perks)
    ? { available: true, reason: 'perk', availableToAllOn: null }
    : { available: false, reason: 'locked', availableToAllOn: null };
}

/** featureAccess() for every feature, as the API sends it to the app */
export function featureAccessMap(context: {
  billingEnabled: boolean;
  perks: FeaturePerks;
  now: Date;
}): FeatureAccessMap {
  return Object.fromEntries(
    Object.values(Feature).map((feature) => [
      feature,
      featureAccess(feature, context),
    ]),
  ) as FeatureAccessMap;
}

/**
 * Early-access entries public for longer than EARLY_ACCESS_CLEANUP_DAYS:
 * their earlyAccess field should go.
 */
export function staleEarlyAccess(
  now: Date,
  registry: Record<string, FeatureRule> = FEATURES,
): string[] {
  return Object.entries(registry)
    .filter(([, rule]) => {
      const end = earlyAccessEnd(rule);
      return (
        end !== null &&
        now.getTime() >= utcDay(end) + EARLY_ACCESS_CLEANUP_DAYS * DAY_MS
      );
    })
    .map(([feature]) => feature);
}

/** Error code of a 403 the app turns into the paywall of `feature` */
export const FEATURE_LOCKED_ERROR = 'FEATURE_LOCKED';
