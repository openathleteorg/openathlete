import { Browser } from '@capacitor/browser';

import { isCapacitor } from './capacitor';

/**
 * Open a URL for OAuth flow, using Capacitor Browser in native or window.open in web
 * In native, the OAuth provider will redirect back to the app via deep link
 * The deep link format: org.openathlete://auth/callback/:provider?code=...
 */
export async function openOAuthUrl(url: string): Promise<void> {
  if (isCapacitor()) {
    // Use Capacitor Browser plugin for native apps
    // The OAuth provider will redirect back to our app via deep link
    await Browser.open({
      url,
      windowName: '_self',
      presentationStyle: 'popover',
    });
  } else {
    // Use window.open for web
    window.open(url, '_self')?.focus();
  }
}

/**
 * Close the OAuth browser if it's open
 */
export async function closeOAuthBrowser(): Promise<void> {
  if (isCapacitor()) {
    await Browser.close();
  }
}
