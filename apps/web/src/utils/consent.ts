import { useSyncExternalStore } from 'react';

/**
 * Consent for optional tracking (product analytics, session recordings),
 * required by the GDPR and ePrivacy rules before it starts. Error reports
 * without recordings run without it, under legitimate interest.
 *
 * Bump the version when the list of trackers changes: everyone is asked again.
 */
const STORAGE_KEY = 'openathlete-tracking-consent-v1';

export type TrackingConsent = 'granted' | 'denied';

const listeners = new Set<() => void>();
const onGrantedCallbacks: Array<() => void> = [];

/** Whether this build has any tracker that needs consent at all. */
export function isConsentRequired(): boolean {
  return Boolean(
    import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    import.meta.env.VITE_CONTENTSQUARE_TAG_ID ||
    import.meta.env.VITE_ERROR_MONITORING_DSN,
  );
}

export function getConsent(): TrackingConsent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function setConsent(value: TrackingConsent | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode: the choice lasts for this page only
  }
  if (value === 'granted') onGrantedCallbacks.splice(0).forEach((run) => run());
  // Withdrawing consent takes effect on the next load: trackers that already
  // started cannot be fully unloaded
  listeners.forEach((listener) => listener());
}

/** Runs `start` now if consent is given, or as soon as it is. */
export function whenConsentGranted(start: () => void) {
  if (getConsent() === 'granted') start();
  else onGrantedCallbacks.push(start);
}

export function useTrackingConsent(): TrackingConsent | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getConsent,
    () => null,
  );
}

/** Privacy policy on the website, when this deployment has one. */
export function privacyPolicyUrl(): string | null {
  const website = import.meta.env.VITE_WEBSITE_URL as string | undefined;
  return website ? `${website.replace(/\/$/, '')}/privacy-policy` : null;
}
