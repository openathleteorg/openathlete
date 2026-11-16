import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import type { ZoneDraft } from './zone-profiles';

/**
 * Classic five zones as shares of the threshold, as WKO lays them out for
 * running: the lower limit of each zone, the last open upwards.
 */
export const THRESHOLD_ZONE_SHARES = [0, 0.8, 0.88, 0.96, 1.02] as const;

/**
 * The same zones in pace, as factors of the threshold pace: a zone is slower
 * than the next factor. Zone 1 is slower than 128% of the threshold pace.
 */
export const THRESHOLD_PACE_FACTORS = [1.28, 1.14, 1.07, 1] as const;

const ZONE_COLORS = ['#9CA3AF', '#22C55E', '#EAB308', '#F97316', '#EF4444'];

/** Where the top zone stops: no ceiling for heart rate, sprints for power */
const HEART_RATE_CEILING = 250;
const POWER_CEILING_SHARE = 1.5;
/** Pace zones are bounded on the slow and fast side alike */
const SLOWEST_PACE_FACTOR = 2;
const FASTEST_PACE_FACTOR = 0.75;

const toSecond = (minutes: number) =>
  Math.round((Math.round(minutes * 60) / 60) * 10000) / 10000;
const SECOND = 1 / 60;

export interface ZoneLabels {
  names: string[];
  descriptions: string[];
}

/**
 * Five zones from a threshold: bpm or watts, or a pace in minutes per km.
 * Limits do not overlap: a zone ends a beat, a watt or a second before the
 * next one starts. Null for a threshold that is not a number above zero.
 */
export function thresholdZones(
  type: TRAINING_ZONE_TYPE,
  threshold: number,
  labels: ZoneLabels,
): Omit<ZoneDraft, 'key'>[] | null {
  if (!(threshold > 0) || !Number.isFinite(threshold)) return null;
  const zone = (index: number, min: number, max: number) => ({
    name: labels.names[index],
    description: labels.descriptions[index],
    color: ZONE_COLORS[index],
    min,
    max,
  });

  if (type === TRAINING_ZONE_TYPE.PACE) {
    // Slowest first, as the editor lists pace zones
    const limits = THRESHOLD_PACE_FACTORS.map((factor) =>
      toSecond(threshold * factor),
    );
    const slowest = toSecond(threshold * SLOWEST_PACE_FACTOR);
    const fastest = toSecond(threshold * FASTEST_PACE_FACTOR);
    return [
      zone(0, limits[0], slowest),
      zone(1, limits[1], toSecond(limits[0] - SECOND)),
      zone(2, limits[2], toSecond(limits[1] - SECOND)),
      zone(3, limits[3], toSecond(limits[2] - SECOND)),
      zone(4, fastest, toSecond(limits[3] - SECOND)),
    ];
  }

  const ceiling =
    type === TRAINING_ZONE_TYPE.HEARTRATE
      ? HEART_RATE_CEILING
      : Math.round(threshold * POWER_CEILING_SHARE);
  const starts = THRESHOLD_ZONE_SHARES.map((share) =>
    Math.round(share * threshold),
  );
  return starts.map((start, index) =>
    zone(
      index,
      start,
      index + 1 < starts.length ? starts[index + 1] - 1 : ceiling,
    ),
  );
}
