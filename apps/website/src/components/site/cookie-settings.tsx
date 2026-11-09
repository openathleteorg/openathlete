'use client';

import { useMessageLocale } from '@/i18n/client';
import { m } from '@/paraglide/messages';
import { isConsentRequired, setConsent } from '@/utils/analytics';
import { useSyncExternalStore } from 'react';

/** Reopens the consent banner. Only shown on builds with analytics. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const ml = useMessageLocale();
  // The button depends on a build variable, but keep server and client HTML equal
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted || !isConsentRequired()) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() => setConsent(null)}
    >
      {m.site_footer_cookies({}, { locale: ml })}
    </button>
  );
}
