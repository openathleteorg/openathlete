import { ConnectorProvider } from '../../../entities';

export type ProviderSyncCapabilities = {
  importActivities: boolean;
  exportWorkouts: boolean;
  importMetrics: boolean;
  supportsFullImport: boolean;
  /** Writes OpenAthlete's analysis into new activities' descriptions */
  writeActivityDescription: boolean;
};

const defaultCapabilities: ProviderSyncCapabilities = {
  importActivities: true,
  exportWorkouts: true,
  importMetrics: true,
  supportsFullImport: false,
  writeActivityDescription: false,
};

const providerSpecificCapabilities: Partial<
  Record<ConnectorProvider, ProviderSyncCapabilities>
> = {
  STRAVA: {
    importActivities: true,
    exportWorkouts: false,
    importMetrics: false,
    supportsFullImport: true,
    writeActivityDescription: true,
  },
  GARMIN: {
    importActivities: true,
    exportWorkouts: true,
    importMetrics: true,
    supportsFullImport: true,
    writeActivityDescription: false,
  },
  FITBIT: {
    importActivities: false,
    exportWorkouts: false,
    importMetrics: true,
    supportsFullImport: false,
    writeActivityDescription: false,
  },
  APPLE_HEALTH: {
    importActivities: false,
    exportWorkouts: false,
    importMetrics: true,
    supportsFullImport: false,
    writeActivityDescription: false,
  },
  SUUNTO: {
    importActivities: true,
    exportWorkouts: true,
    importMetrics: true,
    supportsFullImport: true,
    writeActivityDescription: false,
  },
  COROS: {
    importActivities: true,
    exportWorkouts: true,
    importMetrics: true,
    supportsFullImport: true,
    writeActivityDescription: false,
  },
  // Polar's API is read-only, and only serves what reached Flow after the
  // user connected, for 30 days: no export and no history to request
  POLAR: {
    importActivities: true,
    exportWorkouts: false,
    importMetrics: true,
    supportsFullImport: false,
    writeActivityDescription: false,
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
