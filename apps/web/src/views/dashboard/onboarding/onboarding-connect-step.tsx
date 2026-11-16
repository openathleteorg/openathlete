import { useInstanceInfoQuery } from '@/api/instance';
import { type ConnectedProvider } from '@/api/provider';
import { GarminLogo, StravaIcon } from '@/assets/icons';
import { CorosLogo, PolarLogo, SuuntoLogo } from '@/assets/icons/providers';
import {
  ConnectorsUnavailable,
  CorosRegionDialog,
  offeredProviders,
  useProviderConnect,
} from '@/components/connectors';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { connectorProviderLabelMap } from '@/utils/label-map/core/connector-provider.label-map';
import { cn } from '@/utils/shadcn';
import { CheckCircle2, Loader } from 'lucide-react';
import type { ReactNode } from 'react';

import { ConnectorProvider } from '@openathlete/shared';

import { StepHeader } from './onboarding-steps';

// The most used first: they get the full width
const PROVIDERS: ConnectorProvider[] = [
  'GARMIN',
  'STRAVA',
  'SUUNTO',
  'POLAR',
  'COROS',
];

const LOGOS: Record<string, ReactNode> = {
  // The icon draws at 64px: its box sets the size
  STRAVA: (
    <span className="flex size-6 [&>svg]:size-full">
      <StravaIcon />
    </span>
  ),
  GARMIN: <GarminLogo className="h-6 w-auto" />,
  POLAR: <PolarLogo className="h-6 w-auto" />,
  SUUNTO: <SuuntoLogo className="h-6 w-auto" />,
  COROS: <CorosLogo className="h-6 w-auto" />,
};

export function ConnectStep({
  connected,
  isLoadingConnected,
}: {
  connected: ConnectedProvider[];
  isLoadingConnected: boolean;
}) {
  const { data: instance, isPending: isLoadingInstance } =
    useInstanceInfoQuery();
  const {
    connect,
    connectCoros,
    corosRegionOpen,
    setCorosRegionOpen,
    isPending,
    pendingProvider,
  } = useProviderConnect('onboarding');

  const connectedIds = connected.map((account) => account.provider);
  const providers = offeredProviders(
    PROVIDERS,
    instance?.providers ?? [],
    connectedIds,
  );
  const remaining = providers.filter((p) => !connectedIds.includes(p));
  const isLoading = isLoadingConnected || isLoadingInstance;

  return (
    <>
      <StepHeader
        title={m.onboarding_connect_title()}
        subtitle={m.onboarding_connect_subtitle()}
      />

      {connected.map((account) => (
        <div
          key={account.provider}
          className="bg-secondary flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
        >
          <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
          <span>
            {m.onboarding_connect_connected({
              provider: connectorProviderLabelMap[account.provider],
            })}
          </span>
        </div>
      ))}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="col-span-2 h-16 rounded-xl" />
          <Skeleton className="col-span-2 h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : providers.length === 0 ? (
        <ConnectorsUnavailable />
      ) : (
        remaining.length > 0 && (
          <div className="flex flex-col gap-2">
            {connected.length > 0 && (
              <p className="text-muted-foreground text-sm">
                {m.onboarding_connect_another()}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {remaining.map((provider, index) => (
                <button
                  key={provider}
                  type="button"
                  disabled={isPending}
                  onClick={() => connect(provider)}
                  className={cn(
                    'bg-background flex min-h-16 items-center justify-center gap-3 rounded-xl border-[1.5px] px-4 font-semibold transition-colors',
                    'hover:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] disabled:opacity-60',
                    // The first two are what most people use
                    index < 2 && connected.length === 0 && 'col-span-2',
                  )}
                >
                  {pendingProvider === provider ? (
                    <Loader className="size-5 animate-spin" />
                  ) : (
                    <span className="flex h-7 items-center">
                      {LOGOS[provider]}
                    </span>
                  )}
                  <span>{connectorProviderLabelMap[provider]}</span>
                </button>
              ))}
            </div>
          </div>
        )
      )}

      <CorosRegionDialog
        open={corosRegionOpen}
        onOpenChange={setCorosRegionOpen}
        onSelect={connectCoros}
      />
    </>
  );
}
