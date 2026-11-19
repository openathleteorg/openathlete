import posthog, { type CaptureResult, type PostHog } from 'posthog-js';

import { getConsent } from './consent';

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as
  string | undefined;

let errorClient: PostHog | undefined;

/**
 * Errors that are not ours: browser warnings with no effect, scripts from
 * another origin the browser hides ("Script error."), and extensions that
 * inject code into the page (wallets, tab managers).
 */
const NOISE = [
  /^ResizeObserver loop/,
  /^Script error\.?$/,
  /^No Listener: tabs:/,
  /window\.ethereum/,
];

type ExceptionEntry = {
  value?: string;
  stacktrace?: { frames?: { filename?: string }[] };
};

/**
 * Chrome on iOS injects its own scripts (autofill, translation) into the
 * page, and one of them overflows the stack: its frames point into the HTML
 * document, never into our bundles.
 */
function isChromeIosOverflow(
  exception: ExceptionEntry,
  browser: unknown,
): boolean {
  return (
    browser === 'Chrome iOS' &&
    /^Maximum call stack size exceeded/.test(exception.value ?? '') &&
    !exception.stacktrace?.frames?.some((frame) =>
      frame.filename?.includes('/assets/'),
    )
  );
}

export function isBrowserNoise(event: CaptureResult | null): boolean {
  if (event?.event !== '$exception') return false;
  const list = event.properties?.$exception_list as
    ExceptionEntry[] | undefined;
  return (
    !!list?.length &&
    list.every(
      (exception) =>
        NOISE.some((pattern) => pattern.test(exception.value ?? '')) ||
        isChromeIosOverflow(exception, event.properties?.$browser),
    )
  );
}

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
        event?.event === '$exception' &&
        getConsent() !== 'granted' &&
        !isBrowserNoise(event)
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
