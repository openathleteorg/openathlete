import { Capacitor, registerPlugin } from '@capacitor/core';

import { ACCESS_TOKEN, REFRESH_TOKEN, getItem } from './local-storage';

export const healthKitTypes = [
  'heartRateVariabilitySDNN',
  'restingHeartRate',
  'sleepAnalysis',
  'respiratoryRate',
  'oxygenSaturation',
  'appleSleepingWristTemperature',
  'bodyMass',
  'bodyFatPercentage',
] as const;
export type HealthKitType = (typeof healthKitTypes)[number];
export type HealthKitBinding = { apiBaseURL: string; accountID: string };
export type HealthKitSelection = {
  types: HealthKitType[];
  historyDays: number;
  timeZone: string;
};
export type HealthKitStatus = {
  available: boolean;
  supportedTypes: HealthKitType[];
  sampleCount: number;
  hasMore: boolean;
  reading: boolean;
  summaryExportAvailable: boolean;
  summaryCount: number;
  lastRead?: string;
  selection?: HealthKitSelection;
  metrics: {
    type: string;
    date: string;
    value: number;
    unit: string;
    sampleCount: number;
    sourceID: string;
  }[];
  sleep: {
    date: string;
    core: number;
    deep: number;
    rem: number;
    unspecified: number;
    awake: number;
  }[];
  sources: {
    type: HealthKitType;
    id: string;
    name: string;
    count: number;
    selected: boolean;
  }[];
};

export type HealthWorkoutSelection = {
  historyDays: number;
  includeSensors: boolean;
  includeRoute: boolean;
};
export type HealthWorkoutStatus = {
  available: boolean;
  hasMore: boolean;
  reading: boolean;
  lastRead?: string;
  selection?: HealthWorkoutSelection;
  workouts: {
    uuid: string;
    revision: number;
    sport: string;
    start: string;
    duration: number;
  }[];
};
export type HealthWorkoutSource = {
  bundleIdentifier: string;
  name: string;
  version?: string;
  productType?: string;
  deviceModel?: string;
};
export type HealthWorkoutRecord = {
  uuid: string;
  revision: number;
  sport: string;
  start: string;
  end: string;
  activeDuration: number;
  distanceMeters?: number;
  energyKilojoules?: number;
  elevationGainMeters?: number;
  source: HealthWorkoutSource;
  indoor?: boolean;
  channels: Record<
    string,
    {
      uuid: string;
      start: string;
      value: number;
      source: HealthWorkoutSource;
    }[]
  >;
  route: {
    date: string;
    latitude: number;
    longitude: number;
    altitude?: number;
  }[];
  events: { type: number; start: string; end: string }[];
};

export type HealthSyncConsent = {
  read: boolean;
  upload: boolean;
  automatic: boolean;
  lastSuccess?: string;
  failure?: string;
};
export type HealthSyncKind = 'measurements' | 'workouts';

export type HealthSyncOverview = {
  busy: boolean;
  measurements?: HealthSyncConsent & { selection: HealthKitSelection };
  workouts?: HealthSyncConsent & { selection: HealthWorkoutSelection };
};

interface NativeHealthKit {
  beginManualSync(binding: HealthKitBinding): Promise<{ lease: string }>;
  endManualSync(
    options: HealthKitBinding & { lease: string },
  ): Promise<unknown>;
  syncOverview(binding: HealthKitBinding): Promise<HealthSyncOverview>;
  syncSettings(
    options: HealthKitBinding & {
      kind: HealthSyncKind;
      selection: HealthKitSelection | HealthWorkoutSelection;
      read?: boolean;
      upload?: boolean;
      automatic?: boolean;
    },
  ): Promise<HealthSyncConsent>;
  updateCredentials(
    options: HealthKitBinding & { accessToken?: string; refreshToken?: string },
  ): Promise<{ updated: boolean }>;

  workoutStatus(binding: HealthKitBinding): Promise<HealthWorkoutStatus>;
  readWorkouts(
    options: HealthKitBinding & HealthWorkoutSelection & { localConsent: true },
  ): Promise<HealthWorkoutStatus>;
  clearWorkouts(binding: HealthKitBinding): Promise<HealthWorkoutStatus>;
  workoutPayload(
    options: HealthKitBinding & { uuid: string },
  ): Promise<
    HealthKitBinding & { workout: HealthWorkoutRecord; body?: unknown }
  >;

  status(binding: HealthKitBinding): Promise<HealthKitStatus>;
  bindSession(binding: HealthKitBinding): Promise<{ bound: boolean }>;
  read(
    options: HealthKitBinding & HealthKitSelection & { localConsent: true },
  ): Promise<HealthKitStatus>;
  selectSource(
    options: HealthKitBinding & { type: HealthKitType; sourceID: string },
  ): Promise<HealthKitStatus>;
  clear(binding: HealthKitBinding): Promise<HealthKitStatus>;
  summaries(binding: HealthKitBinding): Promise<{
    apiBaseURL: string;
    accountID: string;
    timeZone: string;
    metrics: unknown[];
  }>;
  resetSession(): Promise<{ cleared: boolean }>;
}

export const localHealthKit = registerPlugin<NativeHealthKit>(
  'OpenAthleteHealthKit',
);

export function hasLocalHealthKit(): boolean {
  return (
    Capacitor.getPlatform() === 'ios' &&
    Capacitor.isPluginAvailable('OpenAthleteHealthKit')
  );
}

export async function bindLocalHealthSession(
  binding: HealthKitBinding,
): Promise<void> {
  if (hasLocalHealthKit()) {
    await localHealthKit.bindSession(binding);
    await localHealthKit.updateCredentials({
      ...binding,
      accessToken: getItem(ACCESS_TOKEN) ?? undefined,
      refreshToken: getItem(REFRESH_TOKEN) ?? undefined,
    });
  }
}

export async function clearLocalHealthSession(): Promise<void> {
  if (hasLocalHealthKit()) await localHealthKit.resetSession();
}
