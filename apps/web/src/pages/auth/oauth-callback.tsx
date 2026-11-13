import { ProviderAPI, useSetOAuthTokenMutation } from '@/api/provider';
import { LoadingScreen } from '@/components/loading-screen';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import {
  AnalyticsEvent,
  type OauthConnectSource,
  analyticsErrorCodeFromUnknown,
  consumeOauthConnectSource,
} from '@/utils/analytics-events';
import { ENABLE_DESCRIPTION_AFTER_OAUTH_KEY } from '@/utils/oauth';
import { useQueryClient } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConnectorProvider } from '@openathlete/shared';

/** The user came back from Strava's consent page to turn the analysis on */
function takeDescriptionIntent() {
  try {
    const intent = localStorage.getItem(ENABLE_DESCRIPTION_AFTER_OAUTH_KEY);
    localStorage.removeItem(ENABLE_DESCRIPTION_AFTER_OAUTH_KEY);
    return intent === '1';
  } catch {
    return false;
  }
}

async function enableActivityDescription(grantedScope: string | null) {
  // Strava lets the user untick write access on its consent page
  if (!grantedScope?.split(/[\s,]+/).includes('activity:write')) {
    toast.warning(m.activity_description_write_refused());
    return;
  }
  try {
    await ProviderAPI.updatePreferences('STRAVA', {
      activityDescriptionEnabled: true,
    });
    toast.success(m.activity_description_enabled());
  } catch {
    toast.error(m.activity_description_update_failed());
  }
}

/** Where the connection was started: the onboarding picks up from there */
function pathAfterConnect(source: OauthConnectSource) {
  return source === 'onboarding'
    ? getPath(['dashboard', 'onboarding'])
    : getPath(['dashboard', 'settings']);
}

export function OAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const hasInitialized = useRef(false);
  const queryClient = useQueryClient();
  const setOAuthTokenMutation = useSetOAuthTokenMutation({
    onSuccess: async (_, { provider: connected, scope }) => {
      const source = consumeOauthConnectSource();
      const finalProvider = (provider || '').toUpperCase();
      posthog.capture(AnalyticsEvent.provider_connect_completed, {
        provider: finalProvider,
        source,
      });
      toast.success(m.connected_successfully());
      if (connected === 'STRAVA' && takeDescriptionIntent()) {
        await enableActivityDescription(scope ?? null);
        await queryClient.invalidateQueries();
      }
      nav(pathAfterConnect(source));
    },
    onError: (error) => {
      takeDescriptionIntent();
      const source = consumeOauthConnectSource();
      const finalProvider = (provider || '').toUpperCase();
      posthog.capture(AnalyticsEvent.provider_connect_failed, {
        provider: finalProvider,
        source,
        error_code: analyticsErrorCodeFromUnknown(error),
      });
      toast.error(error.message);
      nav(pathAfterConnect(source));
    },
  });

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const code = searchParams.get('code');
    const finalProvider = (provider || '').toUpperCase();
    const validProviders = ['STRAVA', 'GARMIN', 'SUUNTO', 'COROS', 'POLAR'];

    const failInvalid = () => {
      // Cancelled on the provider's page: a later connection starts afresh
      takeDescriptionIntent();
      const source = consumeOauthConnectSource();
      posthog.capture(AnalyticsEvent.provider_connect_failed, {
        provider: finalProvider || 'unknown',
        source,
        error_code: 'invalid_oauth_callback',
      });
      return source;
    };

    if (!(code && provider && validProviders.includes(finalProvider))) {
      const source = failInvalid();
      nav(pathAfterConnect(source));
      toast.error(m.invalid_provider());
      return;
    }

    // For Garmin (PKCE), retrieve codeVerifier from localStorage
    // Using localStorage instead of sessionStorage to persist across OAuth redirects
    const storageKey = `oauth_code_verifier_${finalProvider}`;
    const codeVerifier = localStorage.getItem(storageKey);

    // Garmin requires codeVerifier for PKCE flow
    if (finalProvider === 'GARMIN' && !codeVerifier) {
      console.error('Garmin OAuth: codeVerifier not found in localStorage');
      const source = consumeOauthConnectSource();
      posthog.capture(AnalyticsEvent.provider_connect_failed, {
        provider: finalProvider,
        source,
        error_code: 'missing_code_verifier',
      });
      toast.error(m.oauth_garmin_code_verifier_missing());
      nav(pathAfterConnect(source));
      return;
    }

    // Clean up localStorage after retrieving
    if (codeVerifier) {
      localStorage.removeItem(storageKey);
    }

    setOAuthTokenMutation.mutate({
      provider: finalProvider as ConnectorProvider,
      code,
      ...(codeVerifier && { codeVerifier }),
      // Strava lists the scopes the user accepted on the redirect only
      ...(searchParams.get('scope') && {
        scope: searchParams.get('scope') ?? undefined,
      }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, searchParams]);

  return (
    <LoadingScreen
      message={m.importing_data_from_provider({ provider: provider || '' })}
    />
  );
}
