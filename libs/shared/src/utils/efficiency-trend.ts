/** A run as the efficiency trend reads it */
export interface EfficiencyTrendRun {
  date: Date;
  /** Steady and aerobic: the runs efficiency compares on (Coggan) */
  steady: boolean;
  factor: number | null;
}

/**
 * How much the least-squares line of the efficiency factor moved over the
 * steady runs, from the first to the last, as a fraction (0.04: +4 %).
 * Null with fewer than two steady runs.
 */
export function efficiencyTrendChange(
  runs: readonly EfficiencyTrendRun[],
): number | null {
  const points = runs
    .filter((run) => run.steady && Number.isFinite(run.factor))
    .map((run) => ({ x: run.date.getTime(), y: run.factor as number }));
  if (points.length < 2) return null;
  const n = points.length;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  const sxx = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
  if (sxx === 0) return null;
  const slope =
    points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0) / sxx;
  const first = meanY + slope * (points[0].x - meanX);
  const last = meanY + slope * (points[n - 1].x - meanX);
  return first > 0 ? last / first - 1 : null;
}
