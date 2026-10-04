import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import {
  isConsentRequired,
  privacyPolicyUrl,
  setConsent,
  useTrackingConsent,
} from '@/utils/consent';

/**
 * Asks before any optional tracking starts. Refusing is as easy as
 * accepting, and the choice can be changed in Settings > Profile.
 */
export function ConsentBanner() {
  const consent = useTrackingConsent();
  if (!isConsentRequired() || consent !== null) return null;
  const policyUrl = privacyPolicyUrl();

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-lg border bg-background p-4 shadow-lg pb-[calc(1rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4"
    >
      <p id="consent-title" className="font-medium">
        {m.consent_title()}
      </p>
      <p
        id="consent-description"
        className="mt-1 text-sm text-muted-foreground"
      >
        {m.consent_description()}{' '}
        {policyUrl && (
          <a
            href={policyUrl}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            {m.consent_privacy_policy()}
          </a>
        )}
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setConsent('denied')}
        >
          {m.consent_refuse()}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setConsent('granted')}
        >
          {m.consent_accept()}
        </Button>
      </div>
    </div>
  );
}
