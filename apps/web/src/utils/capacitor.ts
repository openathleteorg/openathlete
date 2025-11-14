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
 * Get the API base URL, handling both web and native environments
 * In native, you may want to use a different URL or read from Capacitor config
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (isCapacitor()) {
    // Try api.openathlete.org first, fallback to openathlete.org
    // You can override this with VITE_API_BASE_URL environment variable
    return 'https://api.openathlete.org';
  }

  if (envUrl) {
    return envUrl;
  }

  return 'http://localhost:3000';
}
