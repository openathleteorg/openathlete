import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import posthog from 'posthog-js';

import type { User } from '@openathlete/shared';

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
      // The host can be our /ingest proxy, which ad blockers leave alone
      ui_host: 'https://eu.posthog.com',
      defaults: '2026-01-30',
      capture_exceptions: true,
      capture_dead_clicks: true,
      // The screens show health data: recordings keep the layout and the
      // clicks, never the text
      session_recording: { maskAllInputs: true, maskTextSelector: '*' },
    });
    // Sent with every event, so that each chart splits by app
    posthog.register({ platform: analyticsPlatform() });
    if (Capacitor.isNativePlatform()) {
      void App.getInfo()
        .then(({ version, build }) =>
          posthog.register({ app_version: version, app_build: build }),
        )
        .catch(() => undefined);
    }
  }

  if (contentsquareTagId && !import.meta.env.DEV) {
    const script = document.createElement('script');
    script.src = `https://t.contentsquare.net/uxa/${encodeURIComponent(contentsquareTagId)}.js`;
    script.async = true;
    document.head.appendChild(script);
  }
}

export type AnalyticsPlatform = 'web' | 'ios' | 'android';

export function analyticsPlatform(): AnalyticsPlatform {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android' ? platform : 'web';
}

type AnalyticsUser = Pick<
  User,
  'roles' | 'language' | 'onboardingCompleted' | 'createdAt'
> &
  Partial<Pick<User, 'acquisitionSource'>>;

/**
 * Person properties for segmenting charts. Only categories and dates: never
 * the name or the email.
 */
export function analyticsPersonProperties(
  user: AnalyticsUser,
  plan?: string,
): {
  set: Record<string, unknown>;
  setOnce: Record<string, unknown>;
} {
  const roles = user.roles ?? [];
  return {
    set: {
      roles,
      is_coach: roles.includes('COACH'),
      language: user.language,
      onboarding_completed: user.onboardingCompleted,
      platform: analyticsPlatform(),
      ...(plan ? { plan } : {}),
      ...(user.acquisitionSource
        ? { acquisition_source: user.acquisitionSource }
        : {}),
    },
    setOnce: {
      signed_up_at: new Date(user.createdAt).toISOString(),
    },
  };
}
