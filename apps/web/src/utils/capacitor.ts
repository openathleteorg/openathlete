import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running in a Capacitor native environment
 */
export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if the app is running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if the app is running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * How this build sells the Supporter subscription:
 * - `stripe`: Stripe checkout, on the web;
 * - `app-store`: in-app purchase, in the iOS app (App Store guideline 3.1.1);
 * - `null`: not at all. The Android app sells nothing and never points to a
 *   payment elsewhere, which lets it give Supporters their benefits without
 *   Google Play billing. VITE_DISABLE_PAYMENTS does the same for a web build.
 */
export type PurchaseChannel = 'stripe' | 'app-store' | null;

export function purchaseChannel(): PurchaseChannel {
  if (isIOS()) return 'app-store';
  if (isAndroid() || import.meta.env.VITE_DISABLE_PAYMENTS === 'true') {
    return null;
  }
  return 'stripe';
}

/** Set by the Docker image at container start, see docker/40-api-public-url.sh */
const API_URL_PLACEHOLDER = '__OPENATHLETE_API_BASE_URL__';

/**
 * API URL from index.html. It is read at runtime rather than baked into the
 * hashed (and long-cached) bundles, so changing it on a self-hosted instance
 * reaches browsers that already loaded the app.
 */
function getRuntimeApiBaseUrl(): string | undefined {
  const url = document
    .querySelector<HTMLMetaElement>('meta[name="openathlete-api-base-url"]')
    ?.getAttribute('content');
  // Left as-is when the variable was not set at build time
  if (!url || url.startsWith('%') || url === API_URL_PLACEHOLDER) {
    return undefined;
  }
  return url;
}

/**
 * Get the API base URL, handling both web and native environments
 * In native, you may want to use a different URL or read from Capacitor config
 */
export function getApiBaseUrl(): string {
  const runtimeUrl = getRuntimeApiBaseUrl();
  if (runtimeUrl) {
    return runtimeUrl;
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // If VITE_API_BASE_URL is set (including empty string), use it
  // Empty string means use relative URLs (useful for Docker/Nginx proxy)
  if (envUrl !== undefined && envUrl !== API_URL_PLACEHOLDER) {
    return envUrl;
  }

  if (isCapacitor()) {
    // Try api.openathlete.org first, fallback to openathlete.org
    // You can override this with VITE_API_BASE_URL environment variable
    return 'https://api.openathlete.org';
  }

  return 'http://localhost:3000';
}
