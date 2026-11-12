import { SPORT_TYPE } from '@openathlete/shared';

/** Sports planned as exercises and sets rather than as an effort profile */
const STRENGTH_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.STRENGTH,
  SPORT_TYPE.WEIGHT_TRAINING,
  SPORT_TYPE.CROSSFIT,
  SPORT_TYPE.HIGH_INTENSITY_INTERVAL_TRAINING,
]);

export function isStrengthSport(sport: SPORT_TYPE | null | undefined): boolean {
  return !!sport && STRENGTH_SPORTS.has(sport);
}
