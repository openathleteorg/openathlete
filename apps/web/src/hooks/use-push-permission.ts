import {
  type PushPermission,
  enablePushNotifications,
  getPushPermission,
  sendPendingTokenIfAny,
} from '@/utils/push-notifications';
import { useCallback, useEffect, useState } from 'react';

/** Whether this device gets notifications, and the way to allow them. */
export function usePushPermission() {
  const [permission, setPermission] = useState<PushPermission>('unsupported');

  useEffect(() => {
    const refresh = () => void getPushPermission().then(setPermission);
    refresh();
    // Back from the system settings, where it can change
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);

  const enable = useCallback(async () => {
    const next = await enablePushNotifications();
    setPermission(next);
    if (next === 'granted') await sendPendingTokenIfAny();
    return next;
  }, []);

  return { permission, enable };
}
