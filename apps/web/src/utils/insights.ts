/** Above this share of the time, one sport defines the period */
const DOMINANT_SPORT_SHARE = 0.4;
const STALE_METRIC_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getDominantSport<T extends { movingTime: number }>(
  sports: T[],
): { sport: T; share: number } | null {
  const total = sports.reduce((sum, sport) => sum + sport.movingTime, 0);
  if (sports.length < 2 || total <= 0) return null;
  const sport = sports.reduce((best, current) =>
    current.movingTime > best.movingTime ? current : best,
  );
  const share = sport.movingTime / total;
  return share >= DOMINANT_SPORT_SHARE ? { sport, share } : null;
}

export function countStaleMetrics(
  metrics: ({ date: Date | string } | null | undefined)[],
  now: Date = new Date(),
): number {
  return metrics.filter(
    (metric) =>
      metric &&
      now.getTime() - new Date(metric.date).getTime() >
        STALE_METRIC_DAYS * DAY_MS,
  ).length;
}
