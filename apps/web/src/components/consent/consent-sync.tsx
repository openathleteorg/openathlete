import { useCurrentSubscription } from '@/api/subscription/subscription.hooks';
import { UserAPI } from '@/api/user/user.api';
import { useAuthContext } from '@/contexts/auth';
import { analyticsPersonProperties } from '@/utils/analytics';
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
  const granted = consent === 'granted';

  useEffect(() => {
    if (!userId || !isConsentRequired()) return;
    void UserAPI.setAnalyticsConsent(granted).catch(() => undefined);
  }, [userId, granted]);

  // The plan only refines the person: identify without it rather than wait
  const tracked = Boolean(user) && granted && isConsentRequired();
  const { data: subscription } = useCurrentSubscription({ enabled: tracked });
  const plan = subscription?.plan;

  useEffect(() => {
    if (!user || !tracked) return;
    const { set, setOnce } = analyticsPersonProperties(user, plan);
    posthog.identify(user.userId.toString(), set, setOnce);
  }, [user, tracked, plan]);

  return null;
}
