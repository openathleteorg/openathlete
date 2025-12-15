'use client';

import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import {
  Activity,
  CheckCircle2,
  Download,
  TrendingUp,
  Upload,
} from 'lucide-react';
import * as React from 'react';

import {
  ConnectorProvider,
  getProviderSyncCapabilities,
} from '@openathlete/shared';

type Provider = 'GARMIN' | 'STRAVA' | 'SUUNTO' | 'POLAR';

interface ProviderCapabilitiesProps {
  provider: Provider;
}

const capabilityIcons = {
  importActivities: Activity,
  exportWorkouts: Upload,
  importMetrics: TrendingUp,
  supportsFullImport: Download,
};

const getCapabilityMessages = (
  provider: Provider,
  capability: keyof typeof capabilityIcons,
) => {
  const key = provider.toLowerCase() as
    | 'garmin'
    | 'strava'
    | 'suunto'
    | 'polar';
  const capabilityKey = capability
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
  const messageKey = `connect_${key}_capability_${capabilityKey}` as keyof typeof m;
  return (m[messageKey] as () => string)();
};

export function ProviderCapabilities({ provider }: ProviderCapabilitiesProps) {
  const capabilities = getProviderSyncCapabilities(provider as ConnectorProvider);

  const capabilityList = [
    {
      key: 'importActivities' as const,
      enabled: capabilities.importActivities,
    },
    {
      key: 'exportWorkouts' as const,
      enabled: capabilities.exportWorkouts,
    },
    {
      key: 'importMetrics' as const,
      enabled: capabilities.importMetrics,
    },
    {
      key: 'supportsFullImport' as const,
      enabled: capabilities.supportsFullImport,
    },
  ].filter((item) => item.enabled);

  return (
    <Section id="capabilities" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {(m[
              `connect_${provider.toLowerCase()}_capabilities_title` as keyof typeof m
            ] as () => string)()}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {(m[
              `connect_${provider.toLowerCase()}_capabilities_subtitle` as keyof typeof m
            ] as () => string)()}
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilityList.map(({ key, enabled }) => {
              const Icon = capabilityIcons[key];
              const title = getCapabilityMessages(provider, key);

              return (
                <div
                  key={key}
                  className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        {enabled && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
