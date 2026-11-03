'use client';

import { buttonStyles } from '@/components/site/button';
import { API_URL, APP_URL } from '@/config';
import { useMessageLocale } from '@/i18n/client';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { track } from '@/utils/analytics';
import { cn } from '@/utils/shadcn';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

import type { SEOPlanData } from '@openathlete/shared';

/**
 * Stores the plan on the API for a few days and opens the app with its
 * token: the app asks for a start date (and an account) and imports it.
 */
export function ImportButton({
  planData,
  placement,
  tone = 'dark',
}: {
  planData: SEOPlanData;
  placement: string;
  tone?: 'dark' | 'light';
}) {
  const ml = useMessageLocale();
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    track('cta_clicked', { placement, cta: 'import_plan' });
    try {
      const response = await fetch(`${API_URL}/seo-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planData }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { token } = (await response.json()) as { token: string };
      window.location.href = `${APP_URL}/dashboard?planToken=${encodeURIComponent(token)}`;
    } catch {
      // The plan could not be stored: an account is still worth creating
      window.location.href = signupUrl(placement);
    }
  };

  return (
    <button
      type="button"
      onClick={handleImport}
      disabled={loading}
      className={cn(
        buttonStyles({
          variant: tone === 'dark' ? 'primary' : 'light',
          size: 'lg',
        }),
        // Long labels (pt-BR, it) wrap on a phone instead of overflowing
        'h-auto min-h-12 max-w-full py-2.5 text-center whitespace-normal disabled:opacity-80',
      )}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" />
          {m.tplan_importing({}, { locale: ml })}
        </>
      ) : (
        <>
          {m.tplan_import({}, { locale: ml })}
          <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
        </>
      )}
    </button>
  );
}
