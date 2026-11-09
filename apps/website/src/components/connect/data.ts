import { PROVIDERS, type ProviderSlug } from '@/components/site/providers';
import { m } from '@/paraglide/messages';

export type Support = 'yes' | 'partial' | 'no';
export type Capability = 'activities' | 'history' | 'metrics' | 'workouts';
export type HistoryReach = 'full' | '30' | 'slow' | 'none';

export interface Connector {
  slug: ProviderSlug;
  name: string;
  logo: string;
  width: number;
  support: Record<Capability, Support>;
  history: HistoryReach;
  /** Shows the "New" badge. */
  isNew?: boolean;
  /** Needs no developer account on a self-hosted instance. */
  selfHostReady?: boolean;
}

/**
 * What each connection does, as implemented in apps/api providers-sync:
 * Garmin and Suunto backfill 30 days, COROS walks back through the whole
 * history at 50 files a day, Polar's API is read-only and has no history,
 * Strava only shares activities.
 */
const SUPPORT: Record<
  ProviderSlug,
  Omit<Connector, 'slug' | 'name' | 'logo' | 'width'>
> = {
  garmin: {
    support: {
      activities: 'yes',
      history: 'partial',
      metrics: 'yes',
      workouts: 'yes',
    },
    history: '30',
  },
  coros: {
    support: {
      activities: 'yes',
      history: 'yes',
      metrics: 'yes',
      workouts: 'yes',
    },
    history: 'slow',
    isNew: true,
    selfHostReady: true,
  },
  suunto: {
    support: {
      activities: 'yes',
      history: 'partial',
      metrics: 'yes',
      workouts: 'yes',
    },
    history: '30',
  },
  polar: {
    support: {
      activities: 'yes',
      history: 'no',
      metrics: 'yes',
      workouts: 'no',
    },
    history: 'none',
  },
  strava: {
    support: {
      activities: 'yes',
      history: 'yes',
      metrics: 'no',
      workouts: 'no',
    },
    history: 'full',
  },
};

export const CONNECTORS: Connector[] = PROVIDERS.map((provider) => ({
  ...provider,
  ...SUPPORT[provider.slug],
}));

export const CONNECTOR_SLUGS = CONNECTORS.map((c) => c.slug);

export function getConnector(slug: string): Connector | undefined {
  return CONNECTORS.find((c) => c.slug === slug);
}

export const CAPABILITIES: Capability[] = [
  'activities',
  'history',
  'metrics',
  'workouts',
];

type Msg = (inputs?: Record<string, string>) => string;

/** Per-provider copy lives under `connect_<slug>_<name>`. */
export function providerMessage(slug: ProviderSlug, name: string): string {
  const message = (m as unknown as Record<string, Msg | undefined>)[
    `connect_${slug}_${name}`
  ];
  if (!message) throw new Error(`Missing message connect_${slug}_${name}`);
  return message();
}

export function capabilityLabel(capability: Capability): string {
  return {
    activities: m.connect_cap_activities(),
    history: m.connect_cap_history(),
    metrics: m.connect_cap_metrics(),
    workouts: m.connect_cap_workouts(),
  }[capability];
}

export function supportLabel(support: Support): string {
  return {
    yes: m.connect_support_yes(),
    partial: m.connect_support_partial(),
    no: m.connect_support_no(),
  }[support];
}
