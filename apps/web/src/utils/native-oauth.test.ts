import { describe, expect, it } from 'vitest';

import {
  NATIVE_OAUTH_STATE,
  callbackPathFromAppUrl,
  nativeReturnUrl,
  withNativeOAuthState,
} from './native-oauth';

describe('withNativeOAuthState', () => {
  it('adds the state to the consent URL and keeps its parameters', () => {
    const uri = withNativeOAuthState(
      'https://www.strava.com/oauth/authorize?client_id=1&redirect_uri=https%3A%2F%2Fapp.openathlete.org%2Fauth%2Fcallback%2FSTRAVA',
    );
    const url = new URL(uri);
    expect(url.searchParams.get('state')).toBe(NATIVE_OAUTH_STATE);
    expect(url.searchParams.get('client_id')).toBe('1');
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://app.openathlete.org/auth/callback/STRAVA',
    );
  });
});

describe('nativeReturnUrl', () => {
  it('sends a connection started in the app back to it', () => {
    expect(
      nativeReturnUrl(
        'STRAVA',
        `?state=${NATIVE_OAUTH_STATE}&code=abc&scope=read,activity:read_all`,
      ),
    ).toBe(
      `org.openathlete://auth/callback/STRAVA?state=${NATIVE_OAUTH_STATE}&code=abc&scope=read%2Cactivity%3Aread_all`,
    );
  });

  it('forwards a refusal too, so the app reports it', () => {
    expect(
      nativeReturnUrl(
        'GARMIN',
        `?error=access_denied&state=${NATIVE_OAUTH_STATE}`,
      ),
    ).toContain('error=access_denied');
  });

  it('leaves a connection started on the web alone', () => {
    expect(nativeReturnUrl('STRAVA', '?code=abc')).toBeNull();
    expect(nativeReturnUrl('STRAVA', '?code=abc&state=other')).toBeNull();
  });

  it('refuses an odd provider segment', () => {
    expect(
      nativeReturnUrl('x/../y', `?state=${NATIVE_OAUTH_STATE}&code=a`),
    ).toBeNull();
  });
});

describe('callbackPathFromAppUrl', () => {
  it('maps the app URL to the callback route', () => {
    expect(
      callbackPathFromAppUrl(
        'org.openathlete://auth/callback/GARMIN?code=abc&state=openathlete-native',
      ),
    ).toBe('/auth/callback/GARMIN?code=abc&state=openathlete-native');
  });

  it('ignores other URLs', () => {
    expect(callbackPathFromAppUrl('org.openathlete://settings')).toBeNull();
    expect(
      callbackPathFromAppUrl(
        'https://app.openathlete.org/auth/callback/STRAVA',
      ),
    ).toBeNull();
    expect(callbackPathFromAppUrl('not a url')).toBeNull();
    expect(
      callbackPathFromAppUrl('org.openathlete://auth/callback/STRAVA/extra'),
    ).toBeNull();
  });
});
