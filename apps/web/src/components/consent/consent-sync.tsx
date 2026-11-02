import { UserAPI } from '@/api/user/user.api';
import { useAuthContext } from '@/contexts/auth';
import { isConsentRequired, useTrackingConsent } from '@/utils/consent';
import posthog from 'posthog-js';
import { useEffect } from 'react';

/**
 * Tells the API the choice made in the banner, which it follows for the events
 * only it can see, and ties the browser's events to the user. It has to wait
 * for both the user and the consent, which come in any order.
 */
export function ConsentSync() {
  const { user } = useAuthContext();
  const consent = useTrackingConsent();
  const userId = user?.userId;
  const roles = user?.roles;

  useEffect(() => {
    if (!userId || !isConsentRequired()) return;
    const granted = consent === 'granted';
    void UserAPI.setAnalyticsConsent(granted).catch(() => undefined);
    if (granted) posthog.identify(userId.toString(), { roles });
  }, [userId, consent]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
