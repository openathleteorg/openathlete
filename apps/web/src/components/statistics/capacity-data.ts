import {
  BestRecordDto,
  RECORD_TYPE,
  profileProgress,
} from '@openathlete/shared';

export {
  climbAt,
  descentAt,
  longDrift,
  referenceOutput,
  strongestChanges,
  type ProfileAxis,
  type ProfileFigure,
} from '@openathlete/shared';

/** Change in percent, signed so that positive is progress */
export const progress = profileProgress;

/** Distance records and the time a Riegel exponent draws from one of them */
const DISTANCES = [1000, 1500, 3000, 5000, 10000, 15000, 21097.5, 42195];
const HALF_MARATHON = 21097.5;

const riegel = (
  time: number,
  from: number,
  to: number,
  exponent: number,
): number => time * (to / from) ** exponent;

export interface CoherencePoint {
  distance: number;
  /** Seconds per kilometre: expected, between two exponents */
  fast: number;
  expected: number;
  slow: number;
  actual: number | null;
}

export function speedRecords(records: BestRecordDto[]) {
  return records.filter(
    (record) =>
      record.type === RECORD_TYPE.SPEED &&
      record.distance !== null &&
      DISTANCES.includes(record.distance),
  );
}

/**
 * Each record against what `anchor` implies. Runners fade more than the usual
 * exponents say beyond the half, so the slow edge opens up to the marathon.
 */
export function recordCoherence(
  records: BestRecordDto[],
  anchor: number,
): CoherencePoint[] {
  const speeds = speedRecords(records);
  const from = speeds.find(({ distance }) => distance === anchor);
  if (!from) return [];
  const perKm = (seconds: number, metres: number) => (seconds / metres) * 1000;
  return DISTANCES.filter((distance) => distance >= anchor).map((distance) => {
    const slowExponent = distance > HALF_MARATHON ? 1.15 : 1.08;
    const time = (exponent: number) =>
      perKm(riegel(from.value, anchor, distance, exponent), distance);
    const actual = speeds.find((record) => record.distance === distance);
    return {
      distance,
      fast: time(1.04),
      expected: time(1.06),
      slow: time(slowExponent),
      actual: actual ? perKm(actual.value, distance) : null,
    };
  });
}

/** Distances in the sequence the athlete has no record for */
export function missingDistances(records: BestRecordDto[]): number[] {
  const speeds = speedRecords(records);
  return DISTANCES.filter(
    (distance) => !speeds.some((record) => record.distance === distance),
  );
}

const RACES = [5000, 10000, HALF_MARATHON, 42195];
const ANCHORS = [5000, 10000, 3000];

export interface RacePrediction {
  distance: number;
  /** Seconds, the two ends of the range */
  fast: number;
  slow: number;
}

/**
 * A range for each longer race, from a best of the last year. Riegel holds up
 * to the half; on the marathon, runners fade far more than its exponent says.
 */
export function racePredictions(records: BestRecordDto[]): {
  anchor: number;
  races: RacePrediction[];
} | null {
  const speeds = speedRecords(records);
  const anchor = ANCHORS.map((distance) =>
    speeds.find((record) => record.distance === distance),
  ).find(Boolean);
  if (!anchor?.distance) return null;
  const { distance: from, value: time } = anchor;
  return {
    anchor: from,
    races: RACES.filter((distance) => distance > from).map((distance) => {
      const marathon = distance > HALF_MARATHON;
      return {
        distance,
        fast: riegel(time, from, distance, marathon ? 1.07 : 1.04),
        slow: riegel(time, from, distance, marathon ? 1.15 : 1.08),
      };
    }),
  };
}
