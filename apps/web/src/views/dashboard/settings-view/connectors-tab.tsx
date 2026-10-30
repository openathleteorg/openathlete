import { useInstanceInfoQuery } from '@/api/instance';
import {
  useDisconnectProviderMutation,
  useGetConnectedProvidersQuery,
  useGetOAuthUriMutation,
  useImportAllActivitiesMutation,
  useUpdateProviderPreferencesMutation,
} from '@/api/provider';
import { GarminLogo, StravaIcon } from '@/assets/icons';
import { PolarLogo, SuuntoLogo } from '@/assets/icons/providers';
import { ConfirmAction } from '@/components/confirm-action';
import {
  ConnectorsUnavailable,
  offeredProviders,
} from '@/components/connectors';
import { ImportFitDialog } from '@/components/import-fit-dialog/import-fit-dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserRoles } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import {
  AnalyticsEvent,
  setOauthConnectSourceForRedirect,
} from '@/utils/analytics-events';
import { connectorProviderLabelMap } from '@/utils/label-map/core/connector-provider.label-map';
import { openOAuthUrl } from '@/utils/oauth';
import { cn } from '@/utils/shadcn';
import { CheckCircle2, ChevronDown, Link2, Link2Off } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  ConnectorProvider,
  ProviderPreferencesDto,
  getProviderSyncCapabilities,
  isFullImportInProgress,
} from '@openathlete/shared';

import { CalendarFeedSection } from './calendar-feed-section';
import {
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from './settings-section';

const SUPPORTED_PROVIDERS: ConnectorProvider[] = [
  'STRAVA',
  'GARMIN',
  'SUUNTO',
  'POLAR',
  // 'COROS',
];

export function ConnectorsTab() {
  const posthog = usePostHog();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] =
    useState<ConnectorProvider | null>(null);
  const [openProvider, setOpenProvider] = useState<ConnectorProvider | null>(
    null,
  );
  const [updatingProvider, setUpdatingProvider] =
    useState<ConnectorProvider | null>(null);
  const roles = useUserRoles();
  const [importingProvider, setImportingProvider] =
    useState<ConnectorProvider | null>(null);

  const { data: connectedProviders = [], isLoading: isLoadingAccounts } =
    useGetConnectedProvidersQuery();
  const { data: instance, isPending: isLoadingInstance } =
    useInstanceInfoQuery();
  const isLoadingConnected = isLoadingAccounts || isLoadingInstance;
  const providers = offeredProviders(
    SUPPORTED_PROVIDERS,
    instance?.providers ?? [],
    connectedProviders.map((account) => account.provider),
  );

  const getOAuthUriMutation = useGetOAuthUriMutation({
    onSuccess: async (response, provider) => {
      setOauthConnectSourceForRedirect('settings');
      posthog?.capture(AnalyticsEvent.provider_connect_initiated, {
        provider,
        source: 'settings',
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
      posthog?.capture('provider_disconnected', { provider });
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
    onSuccess: (_, provider) => {
      posthog?.capture('provider_full_import_requested', { provider });
      toast.success(
        m.full_import_started({
          provider: connectorProviderLabelMap[provider],
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
      case 'POLAR':
        return <PolarLogo className="h-6 w-auto" />;
      case 'SUUNTO':
        return <SuuntoLogo className="h-6 w-auto" />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  const handlePreferenceChange = (
    provider: ConnectorProvider,
    preference: keyof ProviderPreferencesDto,
    value: boolean,
  ) => {
    posthog?.capture(AnalyticsEvent.provider_sync_preference_changed, {
      provider,
      preference,
      enabled: value,
    });
    updatePreferencesMutation.mutate({
      provider,
      payload: { [preference]: value } as ProviderPreferencesDto,
    });
  };

  return (
    <div className="space-y-8">
      {isLoadingConnected ? (
        <SettingsRowsSkeleton count={SUPPORTED_PROVIDERS.length} />
      ) : providers.length === 0 ? (
        <ConnectorsUnavailable />
      ) : (
        <SettingsPanel>
          {providers.map((provider) => {
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
            const isUpdatingThisProvider =
              updatingProvider === provider &&
              updatePreferencesMutation.isPending;
            const isImportingThisProvider =
              importingProvider === provider &&
              importAllActivitiesMutation.isPending;
            const fullImportCompleted =
              providerDetails?.fullImportCompletedAt != null;
            const fullImportInProgress =
              providerDetails != null &&
              isFullImportInProgress(providerDetails);
            const isOpen = openProvider === provider;
            const logo = (
              <div className="flex size-10 items-center justify-center text-foreground">
                {getProviderIcon(provider)}
              </div>
            );

            if (!connected || !providerDetails) {
              return (
                <SettingsRow
                  key={provider}
                  leading={logo}
                  title={connectorProviderLabelMap[provider]}
                  description={m.not_connected()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(provider)}
                    disabled={isLoading}
                  >
                    <Link2 className="size-4" />
                    {m.connect()}
                  </Button>
                </SettingsRow>
              );
            }

            return (
              <Collapsible
                key={provider}
                open={isOpen}
                onOpenChange={(openState) =>
                  setOpenProvider(openState ? provider : null)
                }
              >
                <SettingsRow
                  leading={logo}
                  title={connectorProviderLabelMap[provider]}
                  description={
                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      {m.connected_and_syncing()}
                    </span>
                  }
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-w-11"
                      aria-label={`${connectorProviderLabelMap[provider]} ${m.provider_sync_options_title()}`}
                    >
                      <span className="hidden sm:inline">
                        {isOpen ? m.hide_sync_options() : m.show_sync_options()}
                      </span>
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </SettingsRow>
                <CollapsibleContent className="divide-y border-t bg-muted/30">
                  {preferenceToggles.map((toggle) => {
                    const id = `${provider}-${toggle.key}`;
                    return (
                      <SettingsRow
                        key={toggle.key}
                        title={<Label htmlFor={id}>{toggle.label}</Label>}
                        description={toggle.description}
                      >
                        <Switch
                          id={id}
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
                      </SettingsRow>
                    );
                  })}
                  {capabilities.supportsFullImport && (
                    <SettingsRow
                      stacked
                      title={m.full_import_title()}
                      description={
                        <>
                          {m.full_import_description({
                            provider: connectorProviderLabelMap[provider],
                          })}
                          {provider === 'GARMIN' &&
                            ` ${m.full_import_garmin_hint()}`}
                          {fullImportCompleted
                            ? ` ${m.full_import_completed()}`
                            : !providerDetails.importActivitiesEnabled &&
                              ` ${m.full_import_disabled()}`}
                        </>
                      }
                    >
                      {!fullImportCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            fullImportInProgress ||
                            isImportingThisProvider ||
                            !providerDetails.importActivitiesEnabled
                          }
                          onClick={() =>
                            importAllActivitiesMutation.mutate(provider)
                          }
                        >
                          {fullImportInProgress || isImportingThisProvider
                            ? m.full_import_in_progress()
                            : m.full_import_cta()}
                        </Button>
                      )}
                    </SettingsRow>
                  )}
                  <SettingsRow
                    stacked
                    description={m.provider_account_connected({
                      provider: connectorProviderLabelMap[provider],
                    })}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive-foreground"
                      onClick={() => handleDisconnect(provider)}
                      disabled={isLoading}
                    >
                      <Link2Off className="size-4" />
                      {m.disconnect()}
                    </Button>
                  </SettingsRow>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </SettingsPanel>
      )}

      {roles?.includes('ATHLETE') && (
        <SettingsSection
          title={m.fit_import_title()}
          description={m.fit_import_help()}
        >
          <ImportFitDialog />
        </SettingsSection>
      )}

      {roles?.includes('ATHLETE') && <CalendarFeedSection />}

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
