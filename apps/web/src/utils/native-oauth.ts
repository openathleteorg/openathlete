import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

import { isProviderOAuthNonce } from './provider-oauth-storage';

/**
 * Provider OAuth from the native apps.
 *
 * Providers only accept the web callback page as redirect URI, so after the
 * consent page the in-app browser lands on the web app, where the user is not
 * signed in and the PKCE verifier is missing: both live in the app's WebView.
 * The app marks its consent URL with this state, and the web callback page
 * hands the code back to the app through its URL scheme.
 */
export const NATIVE_OAUTH_STATE = 'openathlete-native';

/** Registered in Info.plist and AndroidManifest.xml */
export const APP_URL_SCHEME = 'org.openathlete';

export function withOAuthState(uri: string, state: string): string {
  const url = new URL(uri);
  url.searchParams.set('state', state);
  return url.toString();
}

/** Keep the PKCE nonce on the native browser's round trip. */
export function withNativeOAuthState(uri: string, nonce?: string): string {
  return withOAuthState(
    uri,
    nonce ? `${NATIVE_OAUTH_STATE}.${nonce}` : NATIVE_OAUTH_STATE,
  );
}

export function providerOAuthNonce(
  state: string | null,
  native: boolean,
): string | null {
  if (!state) return null;
  const prefix = `${NATIVE_OAUTH_STATE}.`;
  if (native && !state.startsWith(prefix)) return null;
  const nonce = native ? state.slice(prefix.length) : state;
  return isProviderOAuthNonce(nonce) ? nonce : null;
}

/**
 * Where the web callback page sends the user back to the app, when the
 * connection was started there.
 */
export function nativeReturnUrl(
  provider: string | undefined,
  search: string,
): string | null {
  const params = new URLSearchParams(search);
  const state = params.get('state');
  if (state !== NATIVE_OAUTH_STATE && !providerOAuthNonce(state, true))
    return null;
  if (!provider || !/^[a-z]+$/i.test(provider)) return null;
  return `${APP_URL_SCHEME}://auth/callback/${provider}?${params.toString()}`;
}

/**
 * The app's callback route for a URL opened through its scheme, or null
 * when the URL is not a provider callback.
 */
export function callbackPathFromAppUrl(appUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    return null;
  }
  if (url.protocol !== `${APP_URL_SCHEME}:`) return null;
  // org.openathlete://auth/callback/STRAVA: "auth" is the host
  const path = `/${url.host}${url.pathname}`;
  const match = /^\/auth\/callback\/([a-z]+)\/?$/i.exec(path);
  if (!match) return null;
  return `/auth/callback/${match[1]}${url.search}`;
}

/**
 * Opens the callback route when the web callback page hands a provider's
 * code back to the app, whether the app was running or relaunched for it.
 */
export function listenForNativeOAuthReturn(
  navigate: (path: string) => void,
): () => void {
  const open = (appUrl: string | undefined) => {
    const path = appUrl && callbackPathFromAppUrl(appUrl);
    if (!path) return;
    // Android cannot close a Custom Tab: bringing the app forward did
    Browser.close().catch(() => undefined);
    navigate(path);
  };

  void App.getLaunchUrl().then((launch) => open(launch?.url));
  const listener = App.addListener('appUrlOpen', (event) => open(event.url));
  return () => {
    void listener.then((handle) => handle.remove());
  };
}
