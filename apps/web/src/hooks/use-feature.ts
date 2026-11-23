import { useCurrentSubscription } from '@/api/subscription';
import { purchaseChannel } from '@/utils/capacitor';

import { FEATURES, Feature, FeatureAccessReason } from '@openathlete/shared';

export interface FeatureState {
  /** The user may use the feature now */
  available: boolean;
  /** Shown with a lock: the user may discover it and open the paywall */
  locked: boolean;
  /** Not shown at all: a build that sells nothing, or a `hidden` teaser */
  hidden: boolean;
  /** Supporters only until availableToAllOn */
  earlyAccess: boolean;
  reason: FeatureAccessReason | null;
  availableToAllOn: string | null;
  isLoading: boolean;
}

/**
 * What the user may do with a feature of FEATURES, as the API decided it
 * (its clock, the user's rights, billing). Until the answer arrives the
 * feature counts as available: the API refuses what it must, and nobody
 * sees a lock flash on an instance that locks nothing.
 */
export function useFeature(feature: Feature): FeatureState {
  const { data, isLoading } = useCurrentSubscription();
  const access = data?.features?.[feature];
  const available = access?.available ?? true;
  // The Android app sells nothing and points to no payment: it never shows
  // a lock or mentions Supporter
  const hidden =
    !available &&
    (FEATURES[feature].teaser === 'hidden' || purchaseChannel() === null);

  return {
    available,
    locked: !available && !hidden,
    hidden,
    earlyAccess: access?.reason === 'early-access',
    reason: access?.reason ?? null,
    availableToAllOn: access?.availableToAllOn ?? null,
    isLoading,
  };
}
