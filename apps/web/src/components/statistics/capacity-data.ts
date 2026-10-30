import {
  BestRecordDto,
  RECORD_TYPE,
  StatisticsCardiacCostDto,
  StatisticsDurabilityDto,
  StatisticsTerrainDto,
} from '@openathlete/shared';

export type ProfileAxis =
  'climb' | 'descent' | 'critical' | 'durability' | 'cost';

export interface ProfileFigure {
  axis: ProfileAxis;
  current: number | null;
  previous: number | null;
  /** Whether a higher figure means the athlete got better */
  higherIsBetter: boolean;
}

/** Median of the bins within a slope around a target, nearest first */
function nearSlope(
  bins: StatisticsTerrainDto['bins'],
  percent: number,
): number | null {
  const near = bins
    .filter(({ bin }) => Math.abs(bin - percent) <= 2)
    .sort((a, b) => Math.abs(a.bin - percent) - Math.abs(b.bin - percent));
  return near[0]?.median ?? null;
}

export const climbAt = (terrain?: StatisticsTerrainDto) =>
  terrain ? nearSlope(terrain.bins, 10) : null;

export const descentAt = (terrain?: StatisticsTerrainDto) =>
  terrain ? nearSlope(terrain.bins, -10) : null;

/** Median drift of the outputs on the longest outings it can read */
export function longDrift(durability?: StatisticsDurabilityDto): number | null {
  const output = durability?.series.find(
    ({ kind }) => kind === 'DRIFT_PACE' || kind === 'DRIFT_POWER',
  );
  return output?.classes.at(-1)?.median ?? null;
}

/** The output both periods share with the most activities behind it */
export function referenceOutput(
  current?: StatisticsCardiacCostDto,
  previous?: StatisticsCardiacCostDto,
): { bin: number; current: number | null; previous: number | null } | null {
  if (!current || current.bins.length === 0) return null;
  const shared = current.bins
    .map((bin) => ({
      bin,
      before: previous?.bins.find((other) => other.bin === bin.bin),
    }))
    .sort(
      (a, b) =>
        Number(!!b.before) - Number(!!a.before) || b.bin.count - a.bin.count,
    );
  const [{ bin, before }] = shared;
  return {
    bin: bin.bin,
    current: bin.median,
    previous: before?.median ?? null,
  };
}

/** Change in percent, signed so that positive is progress */
export function progress(figure: ProfileFigure): number | null {
  const { current, previous, higherIsBetter } = figure;
  if (current === null || previous === null || previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return higherIsBetter ? change : -change;
}

/** The axis that moved up the most, and the one that moved down the most */
export function strongestChanges(figures: ProfileFigure[]): {
  best: ProfileFigure | null;
  worst: ProfileFigure | null;
} {
  // Drift is a few percent to begin with: its relative change means little
  const ranked = figures
    .filter((figure) => figure.axis !== 'durability')
    .map((figure) => ({ figure, change: progress(figure) }))
    .filter(
      (entry): entry is { figure: ProfileFigure; change: number } =>
        entry.change !== null,
    )
    .sort((a, b) => b.change - a.change);
  const best = ranked[0];
  const worst = ranked.at(-1);
  return {
    best: best && best.change > 0 ? best.figure : null,
    worst: worst && worst.change < 0 ? worst.figure : null,
  };
}

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
