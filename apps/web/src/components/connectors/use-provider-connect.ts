import { useGetOAuthUriMutation } from '@/api/provider';
import { m } from '@/paraglide/messages';
import {
  AnalyticsEvent,
  type OauthConnectSource,
  setOauthConnectSourceForRedirect,
} from '@/utils/analytics-events';
import { openOAuthUrl } from '@/utils/oauth';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConnectorProvider, CorosRegion } from '@openathlete/shared';

/**
 * Starts a provider's OAuth consent: COROS first asks for the region of the
 * account, PKCE providers keep their code verifier for the callback.
 */
export function useProviderConnect(source: OauthConnectSource) {
  const posthog = usePostHog();
  const [corosRegionOpen, setCorosRegionOpen] = useState(false);

  const getOAuthUriMutation = useGetOAuthUriMutation({
    onSuccess: async (response, { provider }) => {
      setOauthConnectSourceForRedirect(source);
      posthog?.capture(AnalyticsEvent.provider_connect_initiated, {
        provider,
        source,
      });
      // localStorage, not sessionStorage: the native apps come back from
      // the system browser
      if (response.codeVerifier) {
        const storageKey = `oauth_code_verifier_${provider.toUpperCase()}`;
        localStorage.setItem(storageKey, response.codeVerifier);
      } else if (provider.toUpperCase() === 'GARMIN') {
        console.error('Garmin OAuth: codeVerifier not found in response');
      }
      await openOAuthUrl(response.uri);
    },
    onError: (error) => {
      toast.error(error.message || m.failed_to_initiate_connection());
    },
  });

  const connect = (provider: ConnectorProvider) => {
    if (provider === 'COROS') {
      setCorosRegionOpen(true);
      return;
    }
    getOAuthUriMutation.mutate({ provider });
  };

  const connectCoros = (region: CorosRegion) => {
    setCorosRegionOpen(false);
    getOAuthUriMutation.mutate({ provider: 'COROS', region });
  };

  return {
    connect,
    connectCoros,
    corosRegionOpen,
    setCorosRegionOpen,
    isPending: getOAuthUriMutation.isPending,
    pendingProvider: getOAuthUriMutation.isPending
      ? getOAuthUriMutation.variables?.provider
      : undefined,
  };
}
