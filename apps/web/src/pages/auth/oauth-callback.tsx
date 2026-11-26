import { ProviderAPI, useSetOAuthTokenMutation } from '@/api/provider';
import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import {
  AnalyticsEvent,
  type OauthConnectSource,
  analyticsErrorCodeFromUnknown,
  consumeOauthConnectSource,
} from '@/utils/analytics-events';
import { captureAuthSession, isAuthSessionCurrent } from '@/utils/auth-attempt';
import { isCapacitor } from '@/utils/capacitor';
import { nativeReturnUrl, providerOAuthNonce } from '@/utils/native-oauth';
import { ENABLE_DESCRIPTION_AFTER_OAUTH_KEY } from '@/utils/oauth';
import {
  retireLegacyProviderOAuth,
  takeProviderOAuth,
  usesProviderPkce,
} from '@/utils/provider-oauth-storage';
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

/**
 * The in-app browser of the native apps lands here after the consent page:
 * the app, where the user is signed in, finishes the connection.
 */
function ReturnToApp({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground">{m.oauth_return_to_app_message()}</p>
      {/* Browsers may block the automatic redirect without a tap */}
      <Button asChild size="lg">
        <a href={url}>{m.oauth_return_to_app_button()}</a>
      </Button>
    </div>
  );
}

export function OAuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const returnUrl = isCapacitor()
    ? null
    : nativeReturnUrl(provider, searchParams.toString());
  if (returnUrl) return <ReturnToApp url={returnUrl} />;
  return <OAuthCallback provider={provider} searchParams={searchParams} />;
}

function OAuthCallback({
  provider,
  searchParams,
}: {
  provider: string | undefined;
  searchParams: URLSearchParams;
}) {
  const nav = useNavigate();
  const hasInitialized = useRef(false);
  const pendingSource = useRef<OauthConnectSource | null>(null);
  const queryClient = useQueryClient();
  const finalProvider = (provider || '').toUpperCase();
  const pkceProvider = usesProviderPkce(finalProvider) ? finalProvider : null;
  const connectionSource = () =>
    pkceProvider
      ? (pendingSource.current ?? 'settings')
      : consumeOauthConnectSource();
  const setOAuthTokenMutation = useSetOAuthTokenMutation({
    onSuccess: async (_, { provider: connected, scope, authSession }) => {
      if (authSession && !isAuthSessionCurrent(authSession)) return;
      const source = connectionSource();
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
    onError: (error, { authSession }) => {
      if (authSession && !isAuthSessionCurrent(authSession)) return;
      if (!pkceProvider) takeDescriptionIntent();
      const source = connectionSource();
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
    const validProviders = ['STRAVA', 'GARMIN', 'SUUNTO', 'COROS', 'POLAR'];
    const authSession = pkceProvider ? captureAuthSession() : undefined;
    const nonce = pkceProvider
      ? providerOAuthNonce(searchParams.get('state'), isCapacitor())
      : null;
    const pending =
      pkceProvider && authSession?.accessToken && nonce
        ? takeProviderOAuth(authSession, pkceProvider, nonce)
        : null;
    if (pkceProvider) retireLegacyProviderOAuth();
    if (pending) pendingSource.current = pending.source;

    const failInvalid = () => {
      // Cancelled on the provider's page: a later connection starts afresh
      if (!pkceProvider) takeDescriptionIntent();
      const source = connectionSource();
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

    if (
      pkceProvider &&
      (!pending || !authSession || !isAuthSessionCurrent(authSession))
    ) {
      const source = failInvalid();
      toast.error(
        pkceProvider === 'GARMIN'
          ? m.oauth_garmin_code_verifier_missing()
          : m.invalid_provider(),
      );
      nav(pathAfterConnect(source));
      return;
    }

    setOAuthTokenMutation.mutate({
      provider: finalProvider as ConnectorProvider,
      code,
      ...(pending && { codeVerifier: pending.codeVerifier, authSession }),
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
