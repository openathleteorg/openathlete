import { ConnectorProvider } from '../../../entities';

export type ProviderSyncCapabilities = {
  importActivities: boolean;
  exportWorkouts: boolean;
  importMetrics: boolean;
  supportsFullImport: boolean;
};

const defaultCapabilities: ProviderSyncCapabilities = {
  importActivities: true,
  exportWorkouts: true,
  importMetrics: true,
  supportsFullImport: false,
};

const providerSpecificCapabilities: Partial<
  Record<ConnectorProvider, ProviderSyncCapabilities>
> = {
  STRAVA: {
    importActivities: true,
    exportWorkouts: false,
    importMetrics: false,
    supportsFullImport: true,
  },
  GARMIN: {
    importActivities: true,
    exportWorkouts: true,
    importMetrics: true,
    supportsFullImport: true,
  },
  FITBIT: {
    importActivities: false,
    exportWorkouts: false,
    importMetrics: true,
    supportsFullImport: false,
  },
  APPLE_HEALTH: {
    importActivities: false,
    exportWorkouts: false,
    importMetrics: true,
    supportsFullImport: false,
  },
  SUUNTO: {
    importActivities: true,
    exportWorkouts: true,
    importMetrics: true,
    supportsFullImport: true,
  },
  COROS: {
    importActivities: true,
    exportWorkouts: true,
    importMetrics: true,
    supportsFullImport: true,
  },
  // Polar's API is read-only, and only serves what reached Flow after the
  // user connected, for 30 days: no export and no history to request
  POLAR: {
    importActivities: true,
    exportWorkouts: false,
    importMetrics: true,
    supportsFullImport: false,
  },
};

/** COROS keeps each account in one region, each with its own server */
export const COROS_REGIONS = ['eu', 'us', 'cn'] as const;

export type CorosRegion = (typeof COROS_REGIONS)[number];

export function getProviderSyncCapabilities(
  provider: ConnectorProvider,
): ProviderSyncCapabilities {
  return providerSpecificCapabilities[provider] ?? defaultCapabilities;
}
