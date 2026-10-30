import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  addListener: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: plugin,
}));
vi.mock('./capacitor', () => ({ isCapacitor: () => true }));
vi.mock('./auth', () => ({ getAccessToken: vi.fn() }));
vi.mock('@/api/user/user.api', () => ({ UserAPI: {} }));

describe('push notifications', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('never shows the system prompt at startup', async () => {
    plugin.checkPermissions.mockResolvedValue({ receive: 'prompt' });
    const { initializePushNotifications } =
      await import('./push-notifications');

    await initializePushNotifications();

    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    expect(plugin.register).not.toHaveBeenCalled();
  });

  it('registers a device that already allows notifications', async () => {
    plugin.checkPermissions.mockResolvedValue({ receive: 'granted' });
    const { initializePushNotifications } =
      await import('./push-notifications');

    await initializePushNotifications();
    await initializePushNotifications();

    expect(plugin.register).toHaveBeenCalledTimes(2);
    expect(plugin.addListener).toHaveBeenCalledTimes(2);
  });

  it('asks when the user turns them on', async () => {
    plugin.requestPermissions.mockResolvedValue({ receive: 'granted' });
    const { enablePushNotifications } = await import('./push-notifications');

    await expect(enablePushNotifications()).resolves.toBe('granted');
    expect(plugin.register).toHaveBeenCalledOnce();
  });
});
