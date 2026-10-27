// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  bindLocalHealthSession,
  clearLocalHealthSession,
  hasLocalHealthKit,
} from './healthkit';

const native = vi.hoisted(() => ({
  platform: 'web',
  available: false,
  bindSession: vi.fn(),
  updateCredentials: vi.fn(),
  resetSession: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => native.platform,
    isPluginAvailable: () => native.available,
  },
  registerPlugin: () => native,
}));

describe('local HealthKit session', () => {
  afterEach(() => {
    native.platform = 'web';
    native.available = false;
    vi.clearAllMocks();
  });

  it('does not invoke native APIs on the web or Android', async () => {
    for (const platform of ['web', 'android']) {
      native.platform = platform;
      native.available = true;
      expect(hasLocalHealthKit()).toBe(false);
      await clearLocalHealthSession();
      await bindLocalHealthSession({
        apiBaseURL: 'https://train.example.org/api',
        accountID: '1',
      });
    }
    expect(native.bindSession).not.toHaveBeenCalled();
    expect(native.resetSession).not.toHaveBeenCalled();
  });

  it('allows older iOS app builds without the plugin to keep working', async () => {
    native.platform = 'ios';
    await clearLocalHealthSession();
    expect(native.resetSession).not.toHaveBeenCalled();
  });

  it('binds local data to the actual API URL/account and clears it on logout', async () => {
    native.platform = 'ios';
    native.available = true;
    const binding = {
      apiBaseURL: 'https://train.example.org/api',
      accountID: '42',
    };
    await bindLocalHealthSession(binding);
    await clearLocalHealthSession();
    expect(native.bindSession).toHaveBeenCalledWith(binding);
    expect(native.resetSession).toHaveBeenCalledOnce();
  });
});
