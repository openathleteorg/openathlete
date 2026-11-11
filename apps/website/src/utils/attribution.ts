import { APP_URL } from '@/config';
import { getConsent } from '@/utils/analytics';

import {
  ATTRIBUTION_PARAMS,
  SignupAttribution,
  attributionParams,
  externalReferrerHost,
  readUtm,
  signupAttributionSchema,
} from '@openathlete/shared';

/**
 * Where the visit started: the campaign of the link that brought the
 * visitor, the site that sent them and the first page they saw. Links into
 * the app carry it, so a signup keeps its source.
 *
 * It lives in memory, which lasts across the site's client-side navigation.
 * Only with consent is it also kept in sessionStorage, for pages opened by
 * a full reload: before that, nothing is stored on the device.
 */
const STORAGE_KEY = 'openathlete-website-attribution';

let landing: SignupAttribution | null = null;

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}

function stored(): SignupAttribution | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = signupAttributionSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function captureLanding() {
  if (landing) return;
  landing = (getConsent() === 'granted' && stored()) || {
    ...readUtm(new URLSearchParams(window.location.search)),
    referrer: externalReferrerHost(
      hostOf(document.referrer),
      window.location.hostname,
    ),
    landingPage: window.location.pathname,
  };
  persistLanding();
}

/** Keeps the landing for the rest of the visit, once the visitor accepts. */
export function persistLanding() {
  if (!landing || getConsent() !== 'granted') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(landing));
  } catch {
    // Private mode: memory only
  }
}

const appOrigin = new URL(APP_URL).origin;

/**
 * The link with the visit's attribution, or null when it does not lead to
 * the app. The button's placement moves to `cta`, as the campaign's UTM
 * parameters, when there are some, replace the website's own.
 */
export function attributedAppLink(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.origin !== appOrigin) return null;
  const params = attributionParams({
    ...landing,
    sitePage: window.location.pathname,
    cta:
      url.searchParams.get(ATTRIBUTION_PARAMS.cta) ??
      url.searchParams.get(ATTRIBUTION_PARAMS.utmContent) ??
      undefined,
  });
  for (const [name, value] of params) url.searchParams.set(name, value);
  return url.toString();
}
