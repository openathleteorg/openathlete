import { AnalyticsEvent } from '@/utils/analytics-events';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { Feature } from '@openathlete/shared';

/** Gates already reported this session, per screen */
const viewed = new Set<string>();

/** Reports a lock once per screen and per session */
export function useGateViewed(feature: Feature, shown: boolean, place: string) {
  const posthog = usePostHog();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!shown) return;
    const key = `${feature}:${pathname}`;
    if (viewed.has(key)) return;
    viewed.add(key);
    posthog?.capture(AnalyticsEvent.supporter_gate_viewed, {
      feature,
      place,
    });
  }, [feature, shown, place, pathname, posthog]);
}

export function useGateEvents() {
  const posthog = usePostHog();
  return {
    clicked: useCallback(
      (feature: Feature, place: string) =>
        posthog?.capture(AnalyticsEvent.supporter_gate_clicked, {
          feature,
          place,
        }),
      [posthog],
    ),
    dismissed: useCallback(
      (feature: Feature, place: string) =>
        posthog?.capture(AnalyticsEvent.supporter_gate_dismissed, {
          feature,
          place,
        }),
      [posthog],
    ),
  };
}

/** Test only: forget the gates reported */
export function resetGateViews() {
  viewed.clear();
}
