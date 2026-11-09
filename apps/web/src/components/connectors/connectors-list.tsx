import { useInstanceInfoQuery } from '@/api/instance';
import {
  useDisconnectProviderMutation,
  useGetConnectedProvidersQuery,
  useGetOAuthUriMutation,
} from '@/api/provider';
import { GarminLogo, StravaIcon } from '@/assets/icons';
import { CorosLogo, PolarLogo, SuuntoLogo } from '@/assets/icons/providers';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import {
  AnalyticsEvent,
  type OauthConnectSource,
  setOauthConnectSourceForRedirect,
} from '@/utils/analytics-events';
import { connectorProviderLabelMap } from '@/utils/label-map/core/connector-provider.label-map';
import { openOAuthUrl } from '@/utils/oauth';
import { CheckCircle2, Link2, Link2Off } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConnectorProvider } from '@openathlete/shared';

import { ConnectorsUnavailable } from './connectors-unavailable';
import { CorosRegionDialog } from './coros-region-dialog';
import { offeredProviders } from './offered-providers';

interface ConnectorsListProps {
  supportedProviders?: ConnectorProvider[];
  showSkip?: boolean;
  onSkip?: () => void;
  /** Where OAuth was started (for PostHog funnel). */
  oauthConnectSource?: OauthConnectSource;
}

const DEFAULT_SUPPORTED_PROVIDERS: ConnectorProvider[] = [
  'STRAVA',
  'GARMIN',
  'SUUNTO',
  'POLAR',
  'COROS',
];

export function ConnectorsList({
  supportedProviders = DEFAULT_SUPPORTED_PROVIDERS,
  showSkip = false,
  onSkip,
  oauthConnectSource = 'settings',
}: ConnectorsListProps) {
  const posthog = usePostHog();
  const [corosRegionOpen, setCorosRegionOpen] = useState(false);
  const {
    data: connectedProviders = [],
    isLoading: isLoadingConnectedAccounts,
  } = useGetConnectedProvidersQuery();
  const { data: instance, isPending: isLoadingInstance } =
    useInstanceInfoQuery();
  const isLoadingConnected = isLoadingConnectedAccounts || isLoadingInstance;
  const providers = offeredProviders(
    supportedProviders,
    instance?.providers ?? [],
    connectedProviders.map((account) => account.provider),
  );

  const getOAuthUriMutation = useGetOAuthUriMutation({
    onSuccess: async (response, { provider }) => {
      setOauthConnectSourceForRedirect(oauthConnectSource);
      posthog?.capture(AnalyticsEvent.provider_connect_initiated, {
        provider,
        source: oauthConnectSource,
      });
      // For PKCE providers (like Garmin), store codeVerifier in localStorage
      // Using localStorage instead of sessionStorage to persist across OAuth redirects
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

  const disconnectMutation = useDisconnectProviderMutation({
    onSuccess: (_, provider) => {
      posthog?.capture('provider_disconnected', {
        provider,
        source: oauthConnectSource,
      });
      toast.success(
        m.disconnected_from_provider({
          provider: connectorProviderLabelMap[provider],
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message || m.failed_to_disconnect());
    },
  });

  const isConnected = (provider: ConnectorProvider) => {
    return connectedProviders.some((p) => p.provider === provider);
  };

  const handleConnect = (provider: ConnectorProvider) => {
    if (provider === 'COROS') {
      setCorosRegionOpen(true);
      return;
    }
    getOAuthUriMutation.mutate({ provider });
  };

  const handleDisconnect = (provider: ConnectorProvider) => {
    disconnectMutation.mutate(provider);
  };

  const getProviderIcon = (provider: ConnectorProvider) => {
    switch (provider) {
      case 'STRAVA':
        return <StravaIcon />;
      case 'GARMIN':
        return <GarminLogo className="h-6 w-auto" />;
      case 'POLAR':
        return <PolarLogo className="h-6 w-auto" />;
      case 'SUUNTO':
        return <SuuntoLogo className="h-6 w-auto" />;
      case 'COROS':
        return <CorosLogo className="h-6 w-auto" />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4">
        {isLoadingConnected ? (
          Array.from({ length: supportedProviders.length }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : providers.length === 0 ? (
          <ConnectorsUnavailable />
        ) : (
          providers.map((provider) => {
            const connected = isConnected(provider);
            const isLoading =
              getOAuthUriMutation.isPending ||
              disconnectMutation.isPending ||
              isLoadingConnected;

            return (
              <Card key={provider}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center">
                        {getProviderIcon(provider)}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {connectorProviderLabelMap[provider]}
                        </CardTitle>
                        <CardDescription>
                          {connected
                            ? m.connected_and_syncing()
                            : m.not_connected()}
                        </CardDescription>
                      </div>
                    </div>
                    {connected && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          {m.connected()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {connected ? (
                        <p className="text-sm text-muted-foreground">
                          {m.provider_account_connected({
                            provider: connectorProviderLabelMap[provider],
                          })}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {m.connect_provider_account({
                            provider: connectorProviderLabelMap[provider],
                          })}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {connected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisconnect(provider)}
                          disabled={isLoading}
                        >
                          <Link2Off className="h-4 w-4 mr-2" />
                          {m.disconnect()}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConnect(provider)}
                          disabled={isLoading}
                        >
                          <Link2 className="h-4 w-4 mr-2" />
                          {m.connect()}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <CorosRegionDialog
        open={corosRegionOpen}
        onOpenChange={setCorosRegionOpen}
        onSelect={(region) => {
          setCorosRegionOpen(false);
          getOAuthUriMutation.mutate({ provider: 'COROS', region });
        }}
      />
      {showSkip && onSkip && (
        <Button variant="ghost" onClick={onSkip} className="w-full">
          {m.onboarding_connectors_skip()}
        </Button>
      )}
    </div>
  );
}
