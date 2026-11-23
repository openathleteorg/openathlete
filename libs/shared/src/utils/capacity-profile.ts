/**
 * The capacity profile of the Lab: the last twelve months against the
 * twelve before. Shared by the app (Lab) and the API (its teaser).
 */
import type {
  StatisticsCardiacCostDto,
  StatisticsDurabilityDto,
  StatisticsTerrainDto,
} from '../types/dtos/core/statistics.dto';

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
export function profileProgress(figure: ProfileFigure): number | null {
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
    .map((figure) => ({ figure, change: profileProgress(figure) }))
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
