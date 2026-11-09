'use client';

import { buttonStyles } from '@/components/site/button';
import { useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import {
  initAnalytics,
  isConsentRequired,
  setConsent,
  useTrackingConsent,
} from '@/utils/analytics';
import { useEffect } from 'react';

/**
 * Asks before any cookie is set. Refusing is as easy as accepting, and the
 * choice can be changed from the footer.
 */
export function ConsentBanner({
  privacyPolicyHref,
}: {
  privacyPolicyHref: string;
}) {
  const ml = useMessageLocale();
  const consent = useTrackingConsent();

  useEffect(() => {
    initAnalytics();
  }, []);

  if (!isConsentRequired() || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border border-border bg-white p-5 shadow-[0_24px_48px_-16px_rgb(5_12_52/0.35)] sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      <p id="consent-title" className="font-semibold text-ink">
        {m.consent_title({}, { locale: ml })}
      </p>
      <p
        id="consent-description"
        className="mt-1 text-sm text-muted-foreground"
      >
        {m.consent_description({}, { locale: ml })}{' '}
        <a href={privacyPolicyHref} className="underline hover:text-foreground">
          {m.footer_privacy({}, { locale: ml })}
        </a>
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={buttonStyles({
            variant: 'secondary',
            size: 'sm',
            className: 'flex-1',
          })}
          onClick={() => setConsent('denied')}
        >
          {m.consent_refuse({}, { locale: ml })}
        </button>
        <button
          type="button"
          className={buttonStyles({
            variant: 'secondary',
            size: 'sm',
            className: 'flex-1',
          })}
          onClick={() => setConsent('granted')}
        >
          {m.consent_accept({}, { locale: ml })}
        </button>
      </div>
    </div>
  );
}
