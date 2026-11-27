import {
  SPORT_TYPE,
  SportGroup,
  StatisticsEfficiencyDto,
  runEfficiencySports,
} from '@openathlete/shared';

/**
 * Whether the athlete has runs under this filter: the efficiency figures are
 * a runner's, and the card stays out of a view on rides or on skiing.
 */
export function hasEfficiencyRuns(
  sports: readonly SPORT_TYPE[],
  sport?: SPORT_TYPE | null,
  group?: SportGroup | null,
) {
  const runs = runEfficiencySports(sport ?? undefined, group ?? undefined);
  return sports.some((value) => runs.includes(value));
}

export type EfficiencyKind =
  'factor' | 'powerFactor' | 'effectiveness' | 'decoupling';

/** Steady runs in the average line */
export const EFFICIENCY_WINDOW = 28;

export interface EfficiencyPoint {
  eventId: number;
  name: string;
  /** Milliseconds, for a time axis */
  x: number;
  /** The run's figure, when it was steady: those make the average and trend */
  value: number | null;
  /** The figure of a run that was not steady, drawn apart */
  other: number | null;
  /** Average of the steady runs up to this one, at most EFFICIENCY_WINDOW */
  average: number | null;
  /** Least-squares line over the steady runs */
  trend: number | null;
}

/**
 * The runs that have this figure. Efficiency rises with intensity on its own
 * (Coggan), so only steady, aerobic runs make the moving average and the
 * trend; the others are shown, apart.
 */
export function efficiencyPoints(
  data: StatisticsEfficiencyDto,
  kind: EfficiencyKind,
): EfficiencyPoint[] {
  const runs = data.runs
    .filter((run) => Number.isFinite(run[kind]))
    .map((run) => ({
      eventId: run.eventId,
      name: run.name,
      x: new Date(run.date).getTime(),
      figure: run[kind] as number,
      steady: run.steady,
    }));
  const steady = runs.filter((run) => run.steady);

  const n = steady.length;
  const meanX = n ? steady.reduce((sum, run) => sum + run.x, 0) / n : 0;
  const meanY = n ? steady.reduce((sum, run) => sum + run.figure, 0) / n : 0;
  const sxx = steady.reduce((sum, run) => sum + (run.x - meanX) ** 2, 0);
  const sxy = steady.reduce(
    (sum, run) => sum + (run.x - meanX) * (run.figure - meanY),
    0,
  );
  const slope = sxx > 0 ? sxy / sxx : 0;

  const before: number[] = [];
  return runs.map((run) => {
    if (run.steady) before.push(run.figure);
    const window = before.slice(-EFFICIENCY_WINDOW);
    return {
      eventId: run.eventId,
      name: run.name,
      x: run.x,
      value: run.steady ? run.figure : null,
      other: run.steady ? null : run.figure,
      average: window.length
        ? window.reduce((sum, value) => sum + value, 0) / window.length
        : null,
      trend: n >= 2 ? meanY + slope * (run.x - meanX) : null,
    };
  });
}

/** How much the trend line moved from the first steady run to the last */
export function trendChange(points: EfficiencyPoint[]) {
  const steady = points.filter((point) => point.value !== null);
  if (steady.length < 2) return null;
  const first = steady[0].trend;
  const last = steady[steady.length - 1].trend;
  return first !== null && last !== null && first > 0
    ? { from: first, to: last, change: last / first - 1 }
    : null;
}
