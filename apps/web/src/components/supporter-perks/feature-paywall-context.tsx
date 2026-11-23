import { ReactNode, useCallback, useMemo, useState } from 'react';

import { Feature } from '@openathlete/shared';

import { PaywallDialog } from '../paywall/paywall-dialog';
import { FeaturePaywallContext } from './feature-paywall';
import { useGateEvents } from './gate-analytics';

/** One paywall for every lock of the dashboard */
export function FeaturePaywallProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<{
    feature: Feature;
    place: string;
  } | null>(null);
  const events = useGateEvents();

  const open = useCallback(
    (feature: Feature, place: string) => {
      events.clicked(feature, place);
      setShown({ feature, place });
    },
    [events],
  );
  const value = useMemo(() => ({ open }), [open]);

  return (
    <FeaturePaywallContext.Provider value={value}>
      {children}
      {shown && (
        <PaywallDialog
          open
          onOpenChange={(next) => !next && setShown(null)}
          reason="feature"
          feature={shown.feature}
          analyticsSource={shown.place}
        />
      )}
    </FeaturePaywallContext.Provider>
  );
}
