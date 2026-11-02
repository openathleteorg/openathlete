import { UserAPI } from '@/api/user/user.api';
import { PushNotifications } from '@capacitor/push-notifications';

import { getAccessToken } from './auth';
import { isCapacitor } from './capacitor';

let pendingToken: string | null = null;

function validateAndDecodeToken(token: string): string | null {
  if (/^[0-9A-Fa-f]{64}$/.test(token)) {
    console.error(
      '[PushNotifications] Received APNs token instead of FCM token, ignoring',
    );
    return null;
  }

  // Check if token looks like a valid FCM token (already decoded)
  if ((token.includes(':') || token.includes('-')) && token.length > 50) {
    return token;
  }

  if (!token.includes(':') && !token.includes('-')) {
    try {
      const base64Decoded = atob(token);
      if (base64Decoded.includes(':') || base64Decoded.includes('-')) {
        if (!/^[0-9A-Fa-f]{64}$/.test(base64Decoded)) {
          return base64Decoded;
        }
      }
    } catch {
      // Not base64, continue to hex check
    }
  }

  if (/^[0-9A-Fa-f]+$/.test(token) && token.length % 2 === 0) {
    try {
      const hexPairs = token.match(/.{1,2}/g);
      if (hexPairs) {
        const decoded = hexPairs
          .map((hex) => String.fromCharCode(parseInt(hex, 16)))
          .join('');
        if (decoded.includes(':') || decoded.includes('-')) {
          if (decoded.length !== 64) {
            return decoded;
          }
        }
      }
    } catch {
      // If decoding fails, return null
    }
  }

  return null;
}

async function handleFCMToken(token: string): Promise<void> {
  const validatedToken = validateAndDecodeToken(token);

  if (!validatedToken) {
    return;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    pendingToken = validatedToken;
    return;
  }

  try {
    await UserAPI.updatePushToken(validatedToken);
    pendingToken = null;
  } catch (error) {
    console.error(
      '[PushNotifications] Failed to update token in backend:',
      error,
    );
    pendingToken = validatedToken;
  }
}

export type PushPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

let listening = false;

/** Again at each sign-in: the token goes to whoever is signed in now. */
async function register(): Promise<void> {
  if (!listening) {
    listening = true;
    PushNotifications.addListener('registration', async (token) => {
      await handleFCMToken(token.value);
    });
    PushNotifications.addListener('registrationError', (error) => {
      console.error(
        '[PushNotifications] Registration error:',
        JSON.stringify(error),
      );
    });
  }

  await PushNotifications.register();
}

function toPermission(receive: string): PushPermission {
  if (receive === 'granted' || receive === 'denied') return receive;
  return 'prompt';
}

export async function getPushPermission(): Promise<PushPermission> {
  if (!isCapacitor()) return 'unsupported';
  const { receive } = await PushNotifications.checkPermissions();
  return toPermission(receive);
}

/**
 * Registers a device that already allows notifications. It never asks: the
 * system prompt is shown once, so it waits for a reason the user can see,
 * through enablePushNotifications.
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    if ((await getPushPermission()) === 'granted') await register();
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
}

/** Shows the system prompt, from a tap on an explained action. */
export async function enablePushNotifications(): Promise<PushPermission> {
  if (!isCapacitor()) return 'unsupported';
  const { receive } = await PushNotifications.requestPermissions();
  const permission = toPermission(receive);
  if (permission === 'granted') await register();
  return permission;
}

/**
 * Send pending token if user is now authenticated
 * Call this after user authentication
 */
export async function sendPendingTokenIfAny(): Promise<void> {
  if (!pendingToken) {
    return;
  }

  if (!isCapacitor()) {
    return;
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return;
    }

    // Validate and decode token if it's encoded (hex or base64)
    const validatedToken = validateAndDecodeToken(pendingToken);
    if (!validatedToken) {
      // Invalid token, clear it
      pendingToken = null;
      return;
    }
    await UserAPI.updatePushToken(validatedToken);
    pendingToken = null;
  } catch (error) {
    console.error('[PushNotifications] Failed to send pending token:', error);
  }
}
