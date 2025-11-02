import { useGetMyIcalCalendarSecretQuery } from '@/api/event';
import {
  useDisconnectProviderMutation,
  useGetConnectedProvidersQuery,
  useGetOAuthUriMutation,
} from '@/api/provider';
import { StravaIcon } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { API_BASE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { connectorProviderLabelMap } from '@/utils/label-map/core/connector-provider.label-map';
import { CheckCircle2, Link2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';

import { ConnectorProvider } from '@openathlete/shared';

interface P {}

const SUPPORTED_PROVIDERS: ConnectorProvider[] = [
  'STRAVA',
  'GARMIN',
  'SUUNTO',
  'COROS',
];

export function ConnectorsTab({}: P) {
  const { data: connectedProviders = [], isLoading: isLoadingConnected } =
    useGetConnectedProvidersQuery();

  const getOAuthUriMutation = useGetOAuthUriMutation({
    onSuccess: (uri) => {
      window.open(uri, '_self')?.focus();
    },
    onError: (error) => {
      toast.error(error.message || m.failed_to_initiate_connection());
    },
  });

  const disconnectMutation = useDisconnectProviderMutation({
    onSuccess: (_, provider) => {
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

  const { data: icalSecret } = useGetMyIcalCalendarSecretQuery();

  const isConnected = (provider: ConnectorProvider) => {
    return connectedProviders.some((p) => p.provider === provider);
  };

  const handleConnect = (provider: ConnectorProvider) => {
    getOAuthUriMutation.mutate(provider);
  };

  const handleDisconnect = (provider: ConnectorProvider) => {
    if (
      confirm(
        m.confirm_disconnect_provider({
          provider: connectorProviderLabelMap[provider],
        }),
      )
    ) {
      disconnectMutation.mutate(provider);
    }
  };

  const getProviderIcon = (provider: ConnectorProvider) => {
    switch (provider) {
      case 'STRAVA':
        return <StravaIcon />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {m.connect_activity_tracking_services()}
        </p>
      </div>

      <div className="grid gap-4">
        {SUPPORTED_PROVIDERS.map((provider) => {
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
        })}
      </div>

      {icalSecret && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{m.icalendar_feed()}</CardTitle>
            <CardDescription>{m.subscribe_calendar_feed()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground font-mono p-3 border rounded-sm break-all bg-muted">
              {`${API_BASE_URL}/event/ical?calendar=${icalSecret}`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
