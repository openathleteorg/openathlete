import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getFirebaseIdTokenForProvider,
  revokeAppleSignIn,
} from './firebase-auth';

const native = vi.hoisted(() => ({
  isCapacitor: vi.fn(() => true),
  isIOS: vi.fn(() => true),
}));
const plugin = vi.hoisted(() => ({
  signInWithApple: vi.fn(),
  signInWithGoogle: vi.fn(),
  getIdToken: vi.fn(),
  getCurrentUser: vi.fn(),
  revokeAccessToken: vi.fn(),
}));

vi.mock('@/utils/capacitor', () => native);
vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: plugin,
}));

describe('getFirebaseIdTokenForProvider in the native apps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    plugin.getIdToken.mockResolvedValue({ token: 'firebase-id-token' });
  });

  it('signs in with Apple natively', async () => {
    await expect(getFirebaseIdTokenForProvider('apple')).resolves.toBe(
      'firebase-id-token',
    );
    expect(plugin.signInWithApple).toHaveBeenCalledOnce();
    expect(plugin.signInWithGoogle).not.toHaveBeenCalled();
  });

  it('signs in with Google natively', async () => {
    await getFirebaseIdTokenForProvider('google');
    expect(plugin.signInWithGoogle).toHaveBeenCalledOnce();
    expect(plugin.signInWithApple).not.toHaveBeenCalled();
  });
});

describe('revokeAppleSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    native.isIOS.mockReturnValue(true);
  });

  it('revokes with a fresh authorization code for an Apple account', async () => {
    plugin.getCurrentUser.mockResolvedValue({
      user: { providerData: [{ providerId: 'apple.com' }] },
    });
    plugin.signInWithApple.mockResolvedValue({
      credential: { authorizationCode: 'auth-code' },
    });

    await revokeAppleSignIn();

    expect(plugin.revokeAccessToken).toHaveBeenCalledWith({
      token: 'auth-code',
    });
  });

  it('leaves Google and email accounts alone', async () => {
    plugin.getCurrentUser.mockResolvedValue({
      user: { providerData: [{ providerId: 'google.com' }] },
    });

    await revokeAppleSignIn();

    expect(plugin.signInWithApple).not.toHaveBeenCalled();
    expect(plugin.revokeAccessToken).not.toHaveBeenCalled();
  });

  it('does nothing outside iOS', async () => {
    native.isIOS.mockReturnValue(false);

    await revokeAppleSignIn();

    expect(plugin.getCurrentUser).not.toHaveBeenCalled();
  });
});
