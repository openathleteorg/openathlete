import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

// Fresh module per test: it keeps callbacks waiting for consent
async function load() {
  vi.resetModules();
  return import('./consent');
}

describe('tracking consent', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('starts nothing before the user decides', async () => {
    const { getConsent, whenConsentGranted } = await load();
    const start = vi.fn();

    whenConsentGranted(start);

    expect(getConsent()).toBeNull();
    expect(start).not.toHaveBeenCalled();
  });

  it('starts trackers once, when consent is given', async () => {
    const { setConsent, whenConsentGranted } = await load();
    const start = vi.fn();
    whenConsentGranted(start);

    setConsent('granted');
    setConsent('granted');

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('never starts them when the user refuses', async () => {
    const { getConsent, setConsent, whenConsentGranted } = await load();
    const start = vi.fn();
    whenConsentGranted(start);

    setConsent('denied');

    expect(start).not.toHaveBeenCalled();
    expect(getConsent()).toBe('denied');
  });

  it('remembers the choice across page loads', async () => {
    (await load()).setConsent('granted');
    const { getConsent, whenConsentGranted } = await load();
    const start = vi.fn();

    whenConsentGranted(start);

    expect(getConsent()).toBe('granted');
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('asks only when this build has trackers', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', '');
    vi.stubEnv('VITE_CONTENTSQUARE_TAG_ID', '');
    vi.stubEnv('VITE_ERROR_MONITORING_DSN', '');
    expect((await load()).isConsentRequired()).toBe(false);

    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
    expect((await load()).isConsentRequired()).toBe(true);
  });
});
