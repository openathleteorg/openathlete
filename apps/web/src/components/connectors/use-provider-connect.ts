import { useGetOAuthUriMutation } from '@/api/provider';
import { m } from '@/paraglide/messages';
import {
  AnalyticsEvent,
  type OauthConnectSource,
  setOauthConnectSourceForRedirect,
} from '@/utils/analytics-events';
import {
  type AuthSessionSnapshot,
  captureAuthSession,
  isAuthSessionCurrent,
  storedAccessToken,
} from '@/utils/auth-attempt';
import { openOAuthUrl } from '@/utils/oauth';
import {
  type PkceProvider,
  beginProviderOAuth,
  forgetProviderOAuth,
  isProviderOAuthPending,
  rememberProviderOAuth,
  usesProviderPkce,
} from '@/utils/provider-oauth-storage';
import { usePostHog } from 'posthog-js/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { ConnectorProvider, CorosRegion } from '@openathlete/shared';

/**
 * Starts a provider's OAuth consent: COROS first asks for the region of the
 * account, PKCE providers keep their code verifier for the callback.
 */
export function useProviderConnect(source: OauthConnectSource) {
  const posthog = usePostHog();
  const [corosRegionOpen, setCorosRegionOpen] = useState(false);
  const corosSession = useRef<AuthSessionSnapshot | null>(null);

  const getOAuthUriMutation = useGetOAuthUriMutation({
    onSuccess: async (response, { provider, authSession, nonce }) => {
      if (usesProviderPkce(provider)) {
        if (!authSession || !nonce) return;
        const canOpen = () =>
          isAuthSessionCurrent(authSession) &&
          storedAccessToken() !== null &&
          isProviderOAuthPending(authSession.owner, provider, nonce);
        if (!canOpen()) return;
        if (!response.codeVerifier)
          throw new Error(m.failed_to_initiate_connection());
        rememberProviderOAuth(
          authSession,
          provider,
          nonce,
          response.codeVerifier,
          source,
        );
        try {
          // Logout may have retired this owner while the storage write landed.
          if (!canOpen()) {
            forgetProviderOAuth(authSession.owner, provider, nonce);
            return;
          }
          posthog?.capture(AnalyticsEvent.provider_connect_initiated, {
            provider,
            source,
          });
          await openOAuthUrl(response.uri, nonce);
        } catch (error) {
          forgetProviderOAuth(authSession.owner, provider, nonce);
          throw error;
        }
        return;
      }

      setOauthConnectSourceForRedirect(source);
      posthog?.capture(AnalyticsEvent.provider_connect_initiated, {
        provider,
        source,
      });
      await openOAuthUrl(response.uri);
    },
    onError: (error, { authSession, provider, nonce }) => {
      if (authSession && !isAuthSessionCurrent(authSession)) return;
      if (
        authSession &&
        nonce &&
        usesProviderPkce(provider) &&
        !isProviderOAuthPending(authSession.owner, provider, nonce)
      )
        return;
      toast.error(error.message || m.failed_to_initiate_connection());
    },
  });

  const connectPkce = (
    provider: PkceProvider,
    authSession: AuthSessionSnapshot,
    region?: CorosRegion,
  ) => {
    if (
      !authSession.accessToken ||
      !isAuthSessionCurrent(authSession) ||
      !storedAccessToken()
    )
      return;
    try {
      const nonce = beginProviderOAuth(authSession.owner, provider);
      getOAuthUriMutation.mutate({ provider, region, authSession, nonce });
    } catch {
      toast.error(m.failed_to_initiate_connection());
    }
  };

  const connect = (provider: ConnectorProvider) => {
    if (provider === 'COROS') {
      corosSession.current = captureAuthSession();
      setCorosRegionOpen(true);
      return;
    }
    if (!usesProviderPkce(provider)) {
      getOAuthUriMutation.mutate({ provider });
      return;
    }
    connectPkce(provider, captureAuthSession());
  };

  const connectCoros = (region: CorosRegion) => {
    const authSession = corosSession.current;
    corosSession.current = null;
    setCorosRegionOpen(false);
    if (authSession) connectPkce('COROS', authSession, region);
  };

  return {
    connect,
    connectCoros,
    corosRegionOpen,
    setCorosRegionOpen: (open: boolean) => {
      if (!open) corosSession.current = null;
      setCorosRegionOpen(open);
    },
    isPending: getOAuthUriMutation.isPending,
    pendingProvider: getOAuthUriMutation.isPending
      ? getOAuthUriMutation.variables?.provider
      : undefined,
  };
}
