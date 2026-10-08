import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiBaseUrl, purchaseChannel } from './capacitor';

const platform = vi.hoisted(() => ({ name: 'web' }));
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => platform.name,
    isNativePlatform: () => platform.name !== 'web',
  },
}));

function withMetaUrl(content: string | null) {
  vi.stubGlobal('document', {
    querySelector: () =>
      content === null ? null : { getAttribute: () => content },
  });
}

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('prefers the URL injected into index.html at container start', () => {
    withMetaUrl('https://api.example.org');
    vi.stubEnv('VITE_API_BASE_URL', '__OPENATHLETE_API_BASE_URL__');

    expect(getApiBaseUrl()).toBe('https://api.example.org');
  });

  it('falls back to the build-time URL when nothing was injected', () => {
    withMetaUrl('%VITE_API_BASE_URL%');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.openathlete.org');

    expect(getApiBaseUrl()).toBe('https://api.openathlete.org');
  });

  it('never returns the Docker placeholder', () => {
    withMetaUrl('__OPENATHLETE_API_BASE_URL__');
    vi.stubEnv('VITE_API_BASE_URL', '__OPENATHLETE_API_BASE_URL__');

    expect(getApiBaseUrl()).toBe('http://localhost:3000');
  });
});

describe('purchaseChannel', () => {
  afterEach(() => {
    platform.name = 'web';
    vi.unstubAllEnvs();
  });

  it('sells through Stripe on the web', () => {
    expect(purchaseChannel()).toBe('stripe');
  });

  it('sells through the App Store in the iOS app, whatever the build flag', () => {
    platform.name = 'ios';
    vi.stubEnv('VITE_DISABLE_PAYMENTS', 'true');
    expect(purchaseChannel()).toBe('app-store');
  });

  it('sells nothing in the Android app', () => {
    platform.name = 'android';
    expect(purchaseChannel()).toBeNull();
  });

  it('sells nothing in a web build with payments turned off', () => {
    vi.stubEnv('VITE_DISABLE_PAYMENTS', 'true');
    expect(purchaseChannel()).toBeNull();
  });
});
