import {
  SignupAttribution,
  externalReferrerHost,
  readAttribution,
  signupAttributionSchema,
} from '@openathlete/shared';

/**
 * Where a visitor came from, kept in sessionStorage from the first page of
 * the visit until the onboarding sends it to the API. It survives moving
 * between sign-up, OAuth and onboarding, and is gone with the tab.
 */
const STORAGE_KEY = 'openathlete-signup-attribution';

/**
 * Remembers the campaign and referring site of the first page of the visit.
 * The website passes them in the link; a direct link to the app has its own
 * UTM parameters and referrer.
 */
export function captureSignupAttribution(
  location: Pick<Location, 'search' | 'hostname'> = window.location,
  referrer = document.referrer,
) {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const attribution = readAttribution(new URLSearchParams(location.search));
    attribution.referrer ??= externalReferrerHost(
      hostOf(referrer),
      location.hostname,
    );
    if (!attribution.referrer) delete attribution.referrer;
    if (Object.keys(attribution).length === 0) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage can be blocked: the signup then has no attribution
  }
}

/** The host of a URL, or undefined for an empty or invalid one */
export function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}

export function readSignupAttribution(): SignupAttribution | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = signupAttributionSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function forgetSignupAttribution() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to forget
  }
}
