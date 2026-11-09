import { useSyncExternalStore } from 'react';

/**
 * Every visit is measured, without cookies until the visitor accepts: PostHog
 * then identifies them by a daily hash computed on its servers, and storage
 * only starts with consent. The hosted build sets these variables; without
 * them nothing is loaded and no banner shows. The host can be the app's
 * /ingest proxy, which ad blockers leave alone.
 */
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/** Bump the version when the list of trackers changes: everyone is asked again. */
const STORAGE_KEY = 'openathlete-website-consent-v1';

type TrackingConsent = 'granted' | 'denied';

const listeners = new Set<() => void>();
let started = false;
type PostHog = typeof import('posthog-js').default;
let client: PostHog | null = null;
/** Events fired while the SDK downloads, sent once it is ready. */
const pending: Array<[string, Record<string, unknown>]> = [];

export function isConsentRequired(): boolean {
  return Boolean(posthogToken);
}

function getConsent(): TrackingConsent | null {
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
  if (client) applyConsent(client);
  listeners.forEach((listener) => listener());
}

export function useTrackingConsent(): TrackingConsent | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getConsent,
    // Pages are prerendered: no banner in the HTML of visitors who already chose
    () => 'denied',
  );
}

/**
 * Switches PostHog between cookies (accepted) and cookieless (refused or not
 * chosen yet). Opting out also deletes the cookie set by an earlier consent.
 */
function applyConsent(posthog: PostHog) {
  const granted = getConsent() === 'granted';
  if (granted === posthog.has_opted_in_capturing()) return;
  if (granted) posthog.opt_in_capturing({ captureEventName: false });
  else posthog.opt_out_capturing();
}

export function initAnalytics() {
  if (!posthogToken || started) return;
  started = true;
  // Loaded after the page so that it never delays rendering
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogToken, {
      api_host: posthogHost,
      ui_host: 'https://eu.posthog.com',
      defaults: '2026-01-30',
      // Visitors who have not accepted count as opted out, which captures
      // without cookies or storage. Needs cookieless mode enabled in the
      // PostHog project settings, or these events are dropped.
      cookieless_mode: 'on_reject',
      opt_out_capturing_by_default: true,
      // The banner only announces audience measurement
      disable_session_recording: true,
      // Same cookie on app.openathlete.org: a visitor who signs up after
      // reading the site keeps one identity across both
      cross_subdomain_cookie: true,
    });
    applyConsent(posthog);
    client = posthog;
    for (const [event, properties] of pending.splice(0)) {
      posthog.capture(event, properties);
    }
  });
}

/**
 * Conversion events of the website, sent with or without consent. On a build
 * without PostHog they go nowhere.
 */
export type SiteEvent =
  | 'cta_clicked'
  | 'supporter_clicked'
  | 'donation_clicked'
  | 'github_clicked'
  | 'self_host_clicked'
  | 'pricing_period_changed'
  | 'cost_calculator_changed'
  | 'faq_opened'
  | 'language_changed'
  | 'mobile_waitlist_clicked';

export function track(event: SiteEvent, properties: Record<string, unknown>) {
  if (!started) return;
  if (client) client.capture(event, properties);
  else pending.push([event, properties]);
}
