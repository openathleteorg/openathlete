/** Above this share of the time, one sport defines the period */
const DOMINANT_SPORT_SHARE = 0.4;

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
