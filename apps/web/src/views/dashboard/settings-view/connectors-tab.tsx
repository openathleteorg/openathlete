import { useGetMyIcalCalendarSecretQuery } from '@/api/event';
import {
  useDisconnectProviderMutation,
  useGetConnectedProvidersQuery,
  useGetOAuthUriMutation,
  useImportAllActivitiesMutation,
  useUpdateProviderPreferencesMutation,
} from '@/api/provider';
import { GarminLogo, StravaIcon } from '@/assets/icons';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { API_BASE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { connectorProviderLabelMap } from '@/utils/label-map/core/connector-provider.label-map';
import { openOAuthUrl } from '@/utils/oauth';
import { cn } from '@/utils/shadcn';
import { CheckCircle2, ChevronDown, Link2, Link2Off } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ConnectorProvider,
  ProviderPreferencesDto,
  getProviderSyncCapabilities,
} from '@openathlete/shared';

const SUPPORTED_PROVIDERS: ConnectorProvider[] = [
  'STRAVA',
  'GARMIN',
  // 'SUUNTO',
  // 'COROS',
];

export function ConnectorsTab() {
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] =
    useState<ConnectorProvider | null>(null);
  const [openProvider, setOpenProvider] = useState<ConnectorProvider | null>(
    null,
  );
  const [updatingProvider, setUpdatingProvider] =
    useState<ConnectorProvider | null>(null);
  const [importingProvider, setImportingProvider] =
    useState<ConnectorProvider | null>(null);

  const { data: connectedProviders = [], isLoading: isLoadingConnected } =
    useGetConnectedProvidersQuery();

  const getOAuthUriMutation = useGetOAuthUriMutation({
    onSuccess: async (response, provider) => {
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
      toast.success(
        m.disconnected_from_provider({
          provider: connectorProviderLabelMap[provider],
        }),
      );
      setDisconnectDialogOpen(false);
      setProviderToDisconnect(null);
    },
    onError: (error) => {
      toast.error(error.message || m.failed_to_disconnect());
    },
  });

  const { data: icalSecret } = useGetMyIcalCalendarSecretQuery();

  const updatePreferencesMutation = useUpdateProviderPreferencesMutation({
    onMutate: ({ provider }) => {
      setUpdatingProvider(provider);
    },
    onSuccess: (_, variables) => {
      toast.success(
        m.provider_preferences_updated({
          provider: connectorProviderLabelMap[variables.provider],
        }),
      );
    },
    onError: (error, variables) => {
      toast.error(
        error.message ||
          m.provider_preferences_failed({
            provider: variables.provider
              ? connectorProviderLabelMap[variables.provider]
              : '',
          }),
      );
    },
    onSettled: () => {
      setUpdatingProvider(null);
    },
  });

  const importAllActivitiesMutation = useImportAllActivitiesMutation({
    onMutate: (provider) => {
      setImportingProvider(provider);
    },
    onSuccess: (response, provider) => {
      toast.success(
        m.full_import_started({
          provider: connectorProviderLabelMap[provider],
          details: response.message ? ` ${response.message}` : '',
        }),
      );
    },
    onError: (error, provider) => {
      toast.error(
        error.message ||
          m.full_import_failed({
            provider: connectorProviderLabelMap[provider],
          }),
      );
    },
    onSettled: () => {
      setImportingProvider(null);
    },
  });

  const isConnected = (provider: ConnectorProvider) => {
    return connectedProviders.some((p) => p.provider === provider);
  };

  const handleConnect = (provider: ConnectorProvider) => {
    getOAuthUriMutation.mutate(provider);
  };

  const handleDisconnect = (provider: ConnectorProvider) => {
    setProviderToDisconnect(provider);
    setDisconnectDialogOpen(true);
  };

  const handleConfirmDisconnect = () => {
    if (providerToDisconnect) {
      disconnectMutation.mutate(providerToDisconnect);
    }
  };

  const getProviderIcon = (provider: ConnectorProvider) => {
    switch (provider) {
      case 'STRAVA':
        return <StravaIcon />;
      case 'GARMIN':
        return <GarminLogo className="h-6 w-auto" />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  const handlePreferenceChange = (
    provider: ConnectorProvider,
    preference: keyof ProviderPreferencesDto,
    value: boolean,
  ) => {
    updatePreferencesMutation.mutate({
      provider,
      payload: { [preference]: value } as ProviderPreferencesDto,
    });
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
          const providerDetails = connectedProviders.find(
            (p) => p.provider === provider,
          );
          const capabilities = getProviderSyncCapabilities(provider);
          const preferenceToggles =
            providerDetails && connected
              ? ([
                  capabilities.importActivities && {
                    key: 'importActivitiesEnabled',
                    label: m.import_sessions_toggle_label(),
                    description: m.import_sessions_toggle_description({
                      provider: connectorProviderLabelMap[provider],
                    }),
                    value: providerDetails.importActivitiesEnabled,
                  },
                  capabilities.exportWorkouts && {
                    key: 'exportWorkoutsEnabled',
                    label: m.export_workouts_toggle_label(),
                    description: m.export_workouts_toggle_description({
                      provider: connectorProviderLabelMap[provider],
                    }),
                    value: providerDetails.exportWorkoutsEnabled,
                  },
                  capabilities.importMetrics && {
                    key: 'importMetricsEnabled',
                    label: m.import_metrics_toggle_label(),
                    description: m.import_metrics_toggle_description({
                      provider: connectorProviderLabelMap[provider],
                    }),
                    value: providerDetails.importMetricsEnabled,
                  },
                ].filter(Boolean) as Array<{
                  key: keyof ProviderPreferencesDto;
                  label: string;
                  description: string;
                  value: boolean;
                }>)
              : [];
          const hasSyncOptions =
            preferenceToggles.length > 0 ||
            (capabilities.supportsFullImport && !!providerDetails && connected);
          const isUpdatingThisProvider =
            updatingProvider === provider &&
            updatePreferencesMutation.isPending;
          const isImportingThisProvider =
            importingProvider === provider &&
            importAllActivitiesMutation.isPending;
          const fullImportCompleted =
            providerDetails?.fullImportCompletedAt != null;
          const fullImportInProgress =
            providerDetails?.fullImportRequestedAt != null &&
            !providerDetails.fullImportCompletedAt;

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
                {connected && providerDetails && hasSyncOptions && (
                  <div className="mt-6">
                    <Collapsible
                      open={openProvider === provider}
                      onOpenChange={(openState) =>
                        setOpenProvider(openState ? provider : null)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {m.provider_sync_options_title()}
                        </p>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform',
                                openProvider === provider && 'rotate-180',
                              )}
                            />
                            {openProvider === provider
                              ? m.hide_sync_options()
                              : m.show_sync_options()}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-4 pt-4">
                        {preferenceToggles.map((toggle) => (
                          <div
                            key={toggle.key}
                            className="flex items-start justify-between gap-4 rounded-md border p-4"
                          >
                            <div>
                              <Label className="text-sm font-medium">
                                {toggle.label}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {toggle.description}
                              </p>
                            </div>
                            <Switch
                              checked={toggle.value}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(
                                  provider,
                                  toggle.key,
                                  checked,
                                )
                              }
                              disabled={isUpdatingThisProvider}
                            />
                          </div>
                        ))}
                        {capabilities.supportsFullImport && (
                          <div className="rounded-md border p-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                {m.full_import_title()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {m.full_import_description({
                                  provider: connectorProviderLabelMap[provider],
                                })}
                              </p>
                              {fullImportCompleted ? (
                                <p className="text-sm text-muted-foreground">
                                  {m.full_import_completed()}
                                </p>
                              ) : (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      fullImportInProgress ||
                                      isImportingThisProvider ||
                                      !providerDetails.importActivitiesEnabled
                                    }
                                    onClick={() =>
                                      importAllActivitiesMutation.mutate(
                                        provider,
                                      )
                                    }
                                  >
                                    {fullImportInProgress ||
                                    isImportingThisProvider
                                      ? m.full_import_in_progress()
                                      : m.full_import_cta()}
                                  </Button>
                                  {!providerDetails.importActivitiesEnabled && (
                                    <p className="text-xs text-muted-foreground">
                                      {m.full_import_disabled()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
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

      <ConfirmAction
        open={disconnectDialogOpen}
        onClose={() => {
          setDisconnectDialogOpen(false);
          setProviderToDisconnect(null);
        }}
        onConfirm={handleConfirmDisconnect}
        title={m.disconnect()}
        message={
          providerToDisconnect
            ? m.confirm_disconnect_provider({
                provider: connectorProviderLabelMap[providerToDisconnect],
              })
            : ''
        }
        isLoading={disconnectMutation.isPending}
      />
    </div>
  );
}
