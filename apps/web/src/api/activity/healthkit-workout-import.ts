import { healthImportSession } from '@/api/metric/health-import-session';
import {
  type HealthKitBinding,
  type HealthWorkoutRecord,
  localHealthKit,
} from '@/utils/healthkit';
import axios from 'axios';

import {
  type ActivityImportStatus,
  type ImportHealthkitWorkoutDto,
  type ImportHealthkitWorkoutResponseDto,
  importHealthkitWorkoutDtoSchema,
} from '@openathlete/shared';

import { HealthWorkoutUploadError } from './healthkit-workout-error';

const transport = axios.create({ timeout: 60_000 });
const statuses: ActivityImportStatus[] = [
  'created',
  'matched',
  'enriched',
  'unchanged',
  'needs_review',
];

/** Deterministic conversion: preserve real instants/gaps; never invent a dense stream. */
export function healthWorkoutBody(
  record: HealthWorkoutRecord,
): ImportHealthkitWorkoutDto {
  const start = Date.parse(record.start),
    end = Date.parse(record.end);
  const inside = (date: string) =>
    Number.isFinite(Date.parse(date)) &&
    Date.parse(date) >= start &&
    Date.parse(date) <= end;
  const ordered = <T>(rows: T[], date: (row: T) => string): T[] => {
    const unique = new Map<number, T>();
    for (const row of rows)
      if (inside(date(row)) && !unique.has(Date.parse(date(row))))
        unique.set(Date.parse(date(row)), row);
    return [...unique.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, row]) => row);
  };
  const streams: NonNullable<ImportHealthkitWorkoutDto['streams']> = {};
  for (const [key, unit] of [
    ['heartrate', 'bpm'],
    ['watts', 'W'],
    ['cadence', 'rpm'],
  ] as const) {
    const rows = record.channels[key] ?? [];
    // Prefer the recording source at coincident instants, with stable UUID ordering.
    const ranked = [...rows].sort(
      (a, b) =>
        Number(b.source.bundleIdentifier === record.source.bundleIdentifier) -
          Number(
            a.source.bundleIdentifier === record.source.bundleIdentifier,
          ) || a.uuid.localeCompare(b.uuid),
    );
    const samples = ordered(ranked, (row) => row.start).map((row) => ({
      timestamp: row.start,
      value: row.value,
    }));
    if (samples.length) Object.assign(streams, { [key]: { unit, samples } });
  }
  const route = ordered(record.route, (row) => row.date);
  if (route.length)
    streams.route = {
      unit: 'degrees',
      samples: route.map((row) => ({
        timestamp: row.date,
        latitude: row.latitude,
        longitude: row.longitude,
      })),
    };
  const altitude = route
    .filter((row) => row.altitude !== undefined)
    .map((row) => ({ timestamp: row.date, value: row.altitude! }));
  if (altitude.length) streams.altitude = { unit: 'm', samples: altitude };
  const events: NonNullable<ImportHealthkitWorkoutDto['events']> = [];
  let paused = false;
  for (const event of ordered(
    record.events.filter((event) => [1, 2, 5, 6].includes(event.type)),
    (event) => event.start,
  )) {
    const next = event.type === 1 || event.type === 5;
    if (next !== paused)
      events.push({ type: next ? 'PAUSE' : 'RESUME', timestamp: event.start });
    paused = next;
  }
  const laps: NonNullable<ImportHealthkitWorkoutDto['laps']> = [];
  let lapEnd = start;
  for (const lap of ordered(
    record.events.filter((event) => event.type === 3),
    (event) => event.start,
  )) {
    if (
      Date.parse(lap.start) >= lapEnd &&
      Date.parse(lap.end) > Date.parse(lap.start) &&
      Date.parse(lap.end) <= end
    ) {
      laps.push({ startDate: lap.start, endDate: lap.end });
      lapEnd = Date.parse(lap.end);
    }
  }
  return importHealthkitWorkoutDtoSchema.parse({
    protocolVersion: 1,
    workoutUuid: record.uuid,
    revision: record.revision,
    name: `Apple Watch ${record.sport}`,
    sport: record.sport,
    startDate: record.start,
    endDate: record.end,
    elapsedDuration: { value: (end - start) / 1000, unit: 's' },
    activeDuration: {
      value: Math.min(record.activeDuration, (end - start) / 1000),
      unit: 's',
    },
    ...(record.distanceMeters !== undefined && {
      distance: { value: record.distanceMeters, unit: 'm' },
    }),
    ...(record.energyKilojoules !== undefined && {
      energy: { value: record.energyKilojoules, unit: 'kJ' },
    }),
    ...(record.elevationGainMeters !== undefined && {
      elevationGain: { value: record.elevationGainMeters, unit: 'm' },
    }),
    source: {
      bundleIdentifier: record.source.bundleIdentifier,
      name: record.source.name,
      version: record.source.version,
      deviceType: record.source.productType ?? record.source.deviceModel,
      recordingKind: 'single',
      original: true,
      indoor: record.indoor,
    },
    streams,
    events,
    laps,
  });
}

export async function sendHealthWorkouts({
  binding,
  consent,
  uuids,
  isCurrent,
  signal,
}: {
  binding: HealthKitBinding;
  consent: boolean;
  uuids: string[];
  isCurrent: () => boolean;
  signal: AbortSignal;
}): Promise<Record<ActivityImportStatus, number>> {
  let stage = 'session';
  let confirmed = 0;
  try {
    const { token, assertCurrent, url } = await healthImportSession({
      binding,
      consent,
      isCurrent,
      signal,
    });
    // Capability gating prevents uploads to older instances or an incompatible protocol.
    const base = binding.apiBaseURL.replace(/\/+$/, '');
    stage = 'capability';
    const info = await transport.get<{
      healthkitWorkoutImport?: {
        protocolVersion: number;
        maxSamples: number;
        maxBodyBytes: number;
      };
    }>(`${base}/instance`, { signal });
    assertCurrent();
    const capability = info.data.healthkitWorkoutImport;
    if (
      capability?.protocolVersion !== 1 ||
      !(capability.maxSamples > 0) ||
      !(capability.maxBodyBytes > 0)
    )
      throw new Error('HEALTH_WORKOUT_API_UNAVAILABLE');
    const result = {
      created: 0,
      matched: 0,
      enriched: 0,
      unchanged: 0,
      needs_review: 0,
    };
    for (const uuid of new Set(uuids)) {
      assertCurrent();
      stage = 'preview';
      const snapshot = await localHealthKit.workoutPayload({
        ...binding,
        uuid,
      });
      assertCurrent();
      if (
        snapshot.accountID !== binding.accountID ||
        new URL(snapshot.apiBaseURL).href.replace(/\/+$/, '') !==
          url.href.replace(/\/+$/, '') ||
        snapshot.workout.uuid !== uuid
      )
        throw new Error('HEALTH_IMPORT_WRONG_ACCOUNT');
      stage = 'validation';
      const body = snapshot.body
        ? importHealthkitWorkoutDtoSchema.parse(snapshot.body)
        : healthWorkoutBody(snapshot.workout);
      const count = Object.values(body.streams ?? {}).reduce(
        (sum, channel) => sum + (channel?.samples.length ?? 0),
        0,
      );
      if (
        count > capability.maxSamples ||
        new TextEncoder().encode(JSON.stringify(body)).length >
          capability.maxBodyBytes
      )
        throw new Error('HEALTH_WORKOUT_TOO_LARGE');
      assertCurrent();
      stage = 'upload';
      const response = await transport.post<ImportHealthkitWorkoutResponseDto>(
        `${base}/activity-import/healthkit`,
        body,
        { headers: { Authorization: `Bearer ${token}` }, signal },
      );
      stage = 'receipt';
      assertCurrent();
      const receipt = response.data;
      if (
        !receipt ||
        !statuses.includes(receipt.status) ||
        !Number.isInteger(receipt.receiptId) ||
        receipt.receiptId <= 0 ||
        !Number.isInteger(receipt.revision) ||
        receipt.revision < body.revision ||
        !['queued', 'not_required'].includes(receipt.processing)
      )
        throw new Error('HEALTH_IMPORT_INVALID_RESPONSE');
      result[receipt.status]++;
      confirmed++;
    }
    return result;
  } catch (error) {
    throw new HealthWorkoutUploadError(error, stage, confirmed);
  }
}
