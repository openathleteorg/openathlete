import { isAxiosError } from 'axios';
import { createContext, useContext } from 'react';

import { FEATURE_LOCKED_ERROR, Feature } from '@openathlete/shared';

export interface FeaturePaywall {
  /** Opens the paywall of a feature, after a click (never on its own) */
  open: (feature: Feature, place: string) => void;
}

export const FeaturePaywallContext = createContext<FeaturePaywall | null>(null);

export function useFeaturePaywall(): FeaturePaywall {
  const context = useContext(FeaturePaywallContext);
  // Outside the dashboard (tests, public pages) a lock does nothing
  return context ?? { open: () => undefined };
}

/** The feature an API refusal (403 FEATURE_LOCKED) is about, if any */
export function lockedFeatureOf(error: unknown): Feature | null {
  if (!isAxiosError(error) || error.response?.status !== 403) return null;
  const data = error.response.data as
    { code?: unknown; feature?: unknown } | undefined;
  return data?.code === FEATURE_LOCKED_ERROR &&
    Object.values(Feature).includes(data.feature as Feature)
    ? (data.feature as Feature)
    : null;
}

const LOCKED_VALUE = 'locked:';

/** The value of a LockedOption in a Select */
export function lockedOptionValue(feature: Feature, value: string): string {
  return `${LOCKED_VALUE}${feature}:${value}`;
}

/** onValueChange of a Select holding LockedOptions */
export function useLockedSelect(
  place: string,
  onChange: (value: string) => void,
) {
  const paywall = useFeaturePaywall();
  return (value: string) => {
    if (!value.startsWith(LOCKED_VALUE)) return onChange(value);
    const feature = value.slice(LOCKED_VALUE.length).split(':')[0] as Feature;
    paywall.open(feature, place);
  };
}
