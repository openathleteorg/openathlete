import posthog from 'posthog-js';

import { whenConsentGranted } from './consent';

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as
  string | undefined;
const contentsquareTagId = import.meta.env.VITE_CONTENTSQUARE_TAG_ID as
  string | undefined;

/**
 * Product analytics are opt-in: the hosted instance sets these variables at
 * build time, self-hosted builds leave them empty and send nothing.
 *
 * Without a token, or before consent, PostHog is not initialized, so the
 * `posthog.capture()` and `identify()` calls spread through the app are
 * silent no-ops.
 */
export function initAnalytics() {
  // Nothing is loaded or sent before the user accepts tracking
  whenConsentGranted(startAnalytics);
}

function startAnalytics() {
  if (posthogToken) {
    posthog.init(posthogToken, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined,
      defaults: '2026-01-30',
    });
  }

  if (contentsquareTagId && !import.meta.env.DEV) {
    const script = document.createElement('script');
    script.src = `https://t.contentsquare.net/uxa/${encodeURIComponent(contentsquareTagId)}.js`;
    script.async = true;
    document.head.appendChild(script);
  }
}
