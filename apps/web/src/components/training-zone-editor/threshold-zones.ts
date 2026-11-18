import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import type { ZoneModelTable } from './zone-models';
import type { ZoneDraft } from './zone-profiles';

/** Grey to red, sub-zones in between: as many as a model has */
const ZONE_COLORS = [
  '#9CA3AF',
  '#60A5FA',
  '#22C55E',
  '#84CC16',
  '#EAB308',
  '#F59E0B',
  '#F97316',
  '#EF4444',
  '#DC2626',
  '#991B1B',
];

/** Where the top zone stops: no ceiling for heart rate, sprints for power */
const HEART_RATE_CEILING = 250;
const POWER_CEILING_SHARE = 1.5;
/** Pace zones are bounded on the slow and fast side alike */
const SLOWEST_PACE_FACTOR = 2;
const FASTEST_PACE_FACTOR = 0.75;

const toSecond = (minutes: number) =>
  Math.round((Math.round(minutes * 60) / 60) * 10000) / 10000;
const SECOND = 1 / 60;

/** A colour per zone, spread over the scale when there are fewer */
function zoneColor(index: number, count: number) {
  if (count <= 1) return ZONE_COLORS[0];
  const position = Math.round((index * (ZONE_COLORS.length - 1)) / (count - 1));
  return ZONE_COLORS[position];
}

/**
 * The zones of a model from a threshold: bpm or watts, or a pace in minutes
 * per km. Limits do not overlap: a zone ends a beat, a watt or a second
 * before the next one starts. Null for a threshold that is not a number
 * above zero, or a table of another zone type.
 */
export function thresholdZones(
  type: TRAINING_ZONE_TYPE,
  threshold: number,
  table: ZoneModelTable,
  label: (zone: ZoneModelTable['zones'][number]) => {
    name: string;
    description: string;
  },
): Omit<ZoneDraft, 'key'>[] | null {
  if (!(threshold > 0) || !Number.isFinite(threshold)) return null;
  if (table.type !== type) return null;
  const count = table.zones.length;
  const zone = (index: number, min: number, max: number) => ({
    ...label(table.zones[index]),
    color: zoneColor(index, count),
    min,
    max,
  });

  if (type === TRAINING_ZONE_TYPE.PACE) {
    if (!table.paceLimits || table.paceLimits.length !== count - 1) return null;
    // Slowest first, as the editor lists pace zones
    const limits = table.paceLimits.map((factor) =>
      toSecond(threshold * factor),
    );
    const slowest = toSecond(threshold * SLOWEST_PACE_FACTOR);
    const fastest = toSecond(threshold * FASTEST_PACE_FACTOR);
    return table.zones.map((_, index) =>
      zone(
        index,
        index < count - 1 ? limits[index] : fastest,
        index === 0 ? slowest : toSecond(limits[index - 1] - SECOND),
      ),
    );
  }

  if (!table.starts || table.starts.length !== count) return null;
  const starts = table.starts.map((share) => Math.round(share * threshold));
  // Above the last limit, room for sprints
  const ceiling =
    type === TRAINING_ZONE_TYPE.HEARTRATE
      ? HEART_RATE_CEILING
      : Math.round(
          threshold *
            (table.starts[count - 1] < POWER_CEILING_SHARE
              ? POWER_CEILING_SHARE
              : table.starts[count - 1] + 0.5),
        );
  return starts.map((start, index) =>
    zone(
      index,
      start,
      index + 1 < starts.length ? starts[index + 1] - 1 : ceiling,
    ),
  );
}
