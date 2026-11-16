import { StatisticsEfficiencyDto } from '@openathlete/shared';

export type EfficiencyKind = 'total' | 'metabolic' | 'biomechanical' | 'factor';

/** Runs in the average line, as the WKO chart counts them */
export const EFFICIENCY_WINDOW = 28;

export interface EfficiencyPoint {
  eventId: number;
  name: string;
  /** Milliseconds, for a time axis */
  x: number;
  value: number;
  /** Average of the runs up to this one, at most EFFICIENCY_WINDOW */
  average: number;
  /** Least-squares line over time */
  trend: number;
}

/**
 * The runs that have this figure, with the moving average of the last runs
 * and a straight trend over time. The biomechanical figure reads in metres
 * per kilojoule: metres per joule are too small to scan.
 */
export function efficiencyPoints(
  data: StatisticsEfficiencyDto,
  kind: EfficiencyKind,
): EfficiencyPoint[] {
  const scale = kind === 'biomechanical' ? 1000 : 1;
  const runs = data.runs
    .map((run) => ({
      eventId: run.eventId,
      name: run.name,
      x: new Date(run.date).getTime(),
      value: run[kind] === null ? null : (run[kind] as number) * scale,
    }))
    .filter((run): run is Omit<EfficiencyPoint, 'average' | 'trend'> =>
      Number.isFinite(run.value),
    );
  if (runs.length === 0) return [];

  const n = runs.length;
  const meanX = runs.reduce((sum, run) => sum + run.x, 0) / n;
  const meanY = runs.reduce((sum, run) => sum + run.value, 0) / n;
  const sxx = runs.reduce((sum, run) => sum + (run.x - meanX) ** 2, 0);
  const sxy = runs.reduce(
    (sum, run) => sum + (run.x - meanX) * (run.value - meanY),
    0,
  );
  const slope = sxx > 0 ? sxy / sxx : 0;

  return runs.map((run, index) => {
    const window = runs.slice(
      Math.max(0, index - EFFICIENCY_WINDOW + 1),
      index + 1,
    );
    return {
      ...run,
      average:
        window.reduce((sum, item) => sum + item.value, 0) / window.length,
      trend: meanY + slope * (run.x - meanX),
    };
  });
}

/** How much the trend line moved from the first run to the last, as a share */
export function trendChange(points: EfficiencyPoint[]) {
  if (points.length < 2) return null;
  const first = points[0].trend;
  const last = points[points.length - 1].trend;
  return first > 0 ? { from: first, to: last, change: last / first - 1 } : null;
}
