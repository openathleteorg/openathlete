import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import {
  isConsentRequired,
  setConsent,
  useTrackingConsent,
} from '@/utils/consent';

/** Current tracking choice, and a way to change it (the banner reappears). */
export function ConsentSettings() {
  const consent = useTrackingConsent();
  if (!isConsentRequired()) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{m.consent_settings_title()}</p>
        <p className="text-sm text-muted-foreground">
          {consent === 'granted'
            ? m.consent_settings_granted()
            : m.consent_settings_denied()}
        </p>
      </div>
      <Button variant="outline" onClick={() => setConsent(null)}>
        {m.consent_settings_change()}
      </Button>
    </div>
  );
}
