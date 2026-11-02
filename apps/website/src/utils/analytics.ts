import { useSyncExternalStore } from 'react';

/**
 * Website analytics are consent-based, as in the app: the hosted build sets
 * these variables, and without them nothing is loaded and no banner shows.
 * The host can be the app's /ingest proxy, which ad blockers leave alone.
 */
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/** Bump the version when the list of trackers changes: everyone is asked again. */
const STORAGE_KEY = 'openathlete-website-consent-v1';

type TrackingConsent = 'granted' | 'denied';

const listeners = new Set<() => void>();
let started = false;

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
  // A running tracker cannot be unloaded, and navigation here never reloads
  if (started && value !== 'granted') {
    window.location.reload();
    return;
  }
  if (value === 'granted') startAnalytics();
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

export function initAnalytics() {
  if (getConsent() === 'granted') startAnalytics();
}

function startAnalytics() {
  if (!posthogToken || started) return;
  started = true;
  // Loaded on demand so that visitors who refuse never download the SDK
  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(posthogToken, {
      api_host: posthogHost,
      ui_host: 'https://eu.posthog.com',
      defaults: '2026-01-30',
      // The banner only announces audience measurement
      disable_session_recording: true,
    });
  });
}
