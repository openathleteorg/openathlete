import { Browser } from '@capacitor/browser';

import { isCapacitor } from './capacitor';
import { withNativeOAuthState } from './native-oauth';

/**
 * Open a provider's consent page: in the in-app browser in the native apps,
 * from which the web callback page sends the code back to the app (see
 * native-oauth.ts), in the same tab on the web.
 */
export async function openOAuthUrl(url: string): Promise<void> {
  if (isCapacitor()) {
    await Browser.open({
      url: withNativeOAuthState(url),
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

/**
 * Set before Strava's consent page when the user turns the activity
 * description on, read back on the OAuth callback to finish the job.
 */
export const ENABLE_DESCRIPTION_AFTER_OAUTH_KEY =
  'oauth_enable_activity_description_STRAVA';
