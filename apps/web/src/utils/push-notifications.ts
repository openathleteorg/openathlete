import { UserAPI } from '@/api/user/user.api';
import { PushNotifications } from '@capacitor/push-notifications';

import { getAccessToken } from './auth';
import { isCapacitor } from './capacitor';

let pendingToken: string | null = null;

export async function initializePushNotifications(): Promise<void> {
  if (!isCapacitor()) {
    return;
  }

  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return;
    }

    PushNotifications.addListener('registration', async (token) => {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        pendingToken = token.value;
        return;
      }

      try {
        await UserAPI.updatePushToken(token.value);
        pendingToken = null;
      } catch (error) {
        console.error(
          '[PushNotifications] Failed to update push token:',
          error,
        );
        pendingToken = token.value;
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error(
        '[PushNotifications] Registration error:',
        JSON.stringify(error),
      );
    });

    await PushNotifications.register();

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        const data = action.notification.data;
        if (data?.type === 'activity_processed' && data?.eventId) {
          window.location.href = `/dashboard/calendar/${data.eventId}`;
        }
      },
    );
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
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

    await UserAPI.updatePushToken(pendingToken);
    pendingToken = null;
  } catch (error) {
    console.error('[PushNotifications] Failed to send pending token:', error);
  }
}
