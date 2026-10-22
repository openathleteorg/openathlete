import { SportType } from '@openathlete/database';
import { ActivityStream, ImportHealthkitWorkoutDto } from '@openathlete/shared';

export type RecordingValues = {
  sport: SportType;
  distance: number;
  elevationGain: number;
  movingTime: number;
  averageSpeed: number;
  maxSpeed: number;
  averageCadence?: number | null;
  averageWatts?: number | null;
  maxWatts?: number | null;
  weightedAverageWatts?: number | null;
  averageHeartrate?: number | null;
  maxHeartrate?: number | null;
  kilojoules?: number | null;
  description?: string;
};

export type ActivityRecording = {
  name: string;
  startDate: string;
  endDate: string;
  values: RecordingValues;
  stream: ActivityStream;
  original: boolean;
  recordingKind: 'single' | 'multisport_leg' | 'multisport_parent';
  /** Mandatory database defaults are not evidence of an observed zero. */
  missing?: string[];
  laps?: { startDate: string; endDate: string; name?: string }[];
  raw?: object;
};

/** Match complete recordings conservatively. Overlap alone is not identity. */
export function recordingMatch(
  a: ActivityRecording,
  b: ActivityRecording,
): 'strong' | 'possible' | 'none' {
  const family = (sport: string) =>
    ({
      TRAIL_RUNNING: 'RUNNING',
      VIRTUAL_RUN: 'RUNNING',
      MOUNTAIN_BIKE_RIDE: 'CYCLING',
      GRAVEL_RIDE: 'CYCLING',
      VIRTUAL_RIDE: 'CYCLING',
    })[sport] ?? sport;
  if (family(a.values.sport) !== family(b.values.sport)) return 'none';
  const aStart = Date.parse(a.startDate),
    bStart = Date.parse(b.startDate);
  const aEnd = Date.parse(a.endDate),
    bEnd = Date.parse(b.endDate);
  const aDuration = aEnd - aStart,
    bDuration = bEnd - bStart;
  if (aDuration <= 0 || bDuration <= 0) return 'none';
  const overlap = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
  if (overlap / Math.min(aDuration, bDuration) < 0.8) return 'none';
  if (a.recordingKind !== 'single' || b.recordingKind !== 'single')
    return 'possible';
  const tolerance = Math.min(
    60000,
    Math.max(5000, Math.max(aDuration, bDuration) * 0.02),
  );
  const distanceA = a.values.distance,
    distanceB = b.values.distance;
  const distanceOK =
    !distanceA ||
    !distanceB ||
    Math.abs(distanceA - distanceB) <=
      Math.max(100, Math.max(distanceA, distanceB) * 0.05);
  return Math.abs(aStart - bStart) <= tolerance &&
    Math.abs(aEnd - bEnd) <= tolerance &&
    distanceOK
    ? 'strong'
    : 'possible';
}

/** Add only complete channels at exact UTC instants; never interpolate gaps. */
export function enrichRecordingStream(
  current: ActivityStream,
  incoming: ActivityStream,
  currentStart: string,
  incomingStart: string,
): ActivityStream {
  if (!current.time?.length) return incoming.time?.length ? incoming : current;
  if (!incoming.time?.length) return current;
  const result = { ...current };
  const shift = (Date.parse(currentStart) - Date.parse(incomingStart)) / 1000;
  const indices = new Map(incoming.time.map((time, index) => [time, index]));
  for (const [key, values] of Object.entries(incoming)) {
    if (
      key === 'time' ||
      key === 'gap' ||
      key === 'norm' ||
      !values?.length ||
      current[key as keyof ActivityStream]?.length
    )
      continue;
    if (values.length !== incoming.time.length) continue;
    const aligned = current.time.map((time) => {
      const index = indices.get(time + shift);
      return index === undefined ? undefined : values[index];
    });
    if (key === 'latlng') {
      const route = aligned.map((point) => point ?? []);
      if (route.some((point) => Array.isArray(point) && point.length === 2))
        result.latlng = route as number[][];
    } else if (
      aligned.every(
        (value) => typeof value === 'number' && Number.isFinite(value),
      )
    ) {
      (result as Record<string, unknown>)[key] = aligned;
    }
  }
  return result;
}

export function healthkitRecording(
  workout: ImportHealthkitWorkoutDto,
): ActivityRecording {
  const start = Date.parse(workout.startDate);
  const channels = workout.streams ?? {};
  const entries = Object.entries(channels).filter(
    ([, value]) => value?.samples.length,
  );
  // The channel with most observations establishes the time axis. Every
  // original channel remains in the source payload even if it cannot align.
  entries.sort(
    (a, b) =>
      b[1]!.samples.length - a[1]!.samples.length || a[0].localeCompare(b[0]),
  );
  const time = entries[0]?.[1]?.samples.map(
    (entry) => (Date.parse(entry.timestamp) - start) / 1000,
  );
  let stream: ActivityStream = time ? { time } : {};
  for (const [key, channel] of entries) {
    const samples = channel!.samples;
    const values = samples.map((entry) =>
      'value' in entry ? entry.value : [entry.latitude, entry.longitude],
    );
    const partial = {
      time: samples.map(
        (entry) => (Date.parse(entry.timestamp) - start) / 1000,
      ),
      [key === 'route' ? 'latlng' : key]: values,
    } as ActivityStream;
    stream = enrichRecordingStream(
      stream,
      partial,
      workout.startDate,
      workout.startDate,
    );
  }
  const stats = (key: 'heartrate' | 'watts' | 'cadence') => {
    const samples = channels[key]?.samples;
    if (!samples?.length) return {};
    const values = samples.map((sample) => sample.value);
    return {
      average: values.reduce(
        (mean, value, index) => mean + (value - mean) / (index + 1),
        0,
      ),
      max: values.reduce((a, b) => Math.max(a, b), 0),
    };
  };
  const hr = stats('heartrate'),
    power = stats('watts'),
    cadence = stats('cadence');
  let duration = workout.activeDuration?.value ?? workout.elapsedDuration.value;
  if (!workout.activeDuration && workout.events?.length) {
    let pausedAt: number | undefined;
    for (const event of workout.events) {
      if (event.type === 'PAUSE') pausedAt = Date.parse(event.timestamp);
      else if (pausedAt !== undefined) {
        duration -= (Date.parse(event.timestamp) - pausedAt) / 1000;
        pausedAt = undefined;
      }
    }
    if (pausedAt !== undefined)
      duration -= (Date.parse(workout.endDate) - pausedAt) / 1000;
  }
  const speed =
    workout.distance && duration > 0 ? workout.distance.value / duration : 0;
  return {
    name: workout.name,
    startDate: workout.startDate,
    endDate: workout.endDate,
    original: workout.source.original,
    recordingKind: workout.source.recordingKind,
    values: {
      sport: workout.sport,
      distance: workout.distance?.value ?? 0,
      elevationGain: workout.elevationGain?.value ?? 0,
      movingTime: Math.round(duration),
      averageSpeed: Number.isFinite(speed) ? speed : 0,
      maxSpeed: 0,
      averageHeartrate: hr.average,
      maxHeartrate: hr.max,
      averageWatts: power.average,
      maxWatts: power.max,
      averageCadence: cadence.average,
      kilojoules: workout.energy?.value,
      description: workout.description,
    },
    missing: [
      ...(!workout.distance ? ['distance', 'averageSpeed'] : []),
      ...(!workout.elevationGain ? ['elevationGain'] : []),
      'maxSpeed',
    ],
    stream,
    laps: workout.laps,
    raw: workout,
  };
}
