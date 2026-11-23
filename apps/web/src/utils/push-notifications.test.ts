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

  describe('token decoding', () => {
    const fcm = `${'d'.repeat(22)}:APA91b${'x_-'.repeat(46)}`;
    const hex = (text: string) =>
      [...text]
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');

    it('keeps an FCM token as it is', async () => {
      const { validateAndDecodeToken } = await import('./push-notifications');
      expect(validateAndDecodeToken(fcm)).toBe(fcm);
    });

    it('decodes an FCM token sent as hex by iOS', async () => {
      const { validateAndDecodeToken } = await import('./push-notifications');
      expect(validateAndDecodeToken(hex(fcm))).toBe(fcm);
    });

    it('drops a device token that decodes to binary bytes', async () => {
      const { validateAndDecodeToken } = await import('./push-notifications');
      // 80 bytes of an APNs token, with a NUL and a dash once decoded
      const apns = `2d00${'a3'.repeat(78)}`;
      expect(validateAndDecodeToken(apns)).toBeNull();
      expect(validateAndDecodeToken('ab'.repeat(32))).toBeNull();
    });
  });
});
