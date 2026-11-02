import posthog, { type PostHog } from 'posthog-js';

import { getConsent } from './consent';

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as
  string | undefined;

let errorClient: PostHog | undefined;

/**
 * Error reports are legitimate interest, so they run before and without
 * consent, on their own PostHog instance: it stores nothing on the device and
 * can only send exceptions. Once consent is given the main instance takes over,
 * which ties errors to the user and their session recording.
 *
 * Unset token: nothing starts, so self-hosted instances report nothing.
 */
export function initErrorMonitoring() {
  if (errorClient || import.meta.env.DEV || !posthogToken) return;

  errorClient = posthog.init(
    posthogToken,
    {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined,
      persistence: 'memory',
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_performance: false,
      rageclick: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
      capture_exceptions: true,
      before_send: (event) =>
        event?.event === '$exception' && getConsent() !== 'granted'
          ? event
          : null,
    },
    'errors',
  );
}

/** Reports an error the app caught, which autocapture cannot see. */
export function reportError(error: unknown) {
  const client = getConsent() === 'granted' ? posthog : errorClient;
  if (client?.__loaded) client.captureException(error);
}
