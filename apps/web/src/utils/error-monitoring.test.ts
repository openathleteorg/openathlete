import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { init } = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock('posthog-js', () => ({ default: { init } }));

async function load() {
  vi.resetModules();
  return import('./error-monitoring');
}

describe('error monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubEnv('DEV', false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('starts nothing without a token', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', '');

    (await load()).initErrorMonitoring();

    expect(init).not.toHaveBeenCalled();
  });

  it('keeps only exceptions, stored nowhere, until consent', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');

    (await load()).initErrorMonitoring();

    const config = init.mock.calls[0][1];
    expect(config.persistence).toBe('memory');
    expect(config.disable_session_recording).toBe(true);
    const exception = { event: '$exception' };
    expect(config.before_send(exception)).toBe(exception);
    expect(config.before_send({ event: '$pageview' })).toBeNull();
  });

  it('leaves exceptions to the main instance once consent is given', async () => {
    vi.stubEnv('VITE_PUBLIC_POSTHOG_PROJECT_TOKEN', 'phc_test');
    const { setConsent } = await import('./consent');

    (await load()).initErrorMonitoring();
    setConsent('granted');

    const config = init.mock.calls[0][1];
    expect(config.before_send({ event: '$exception' })).toBeNull();
  });
});
