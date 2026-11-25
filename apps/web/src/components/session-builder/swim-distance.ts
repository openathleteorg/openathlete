/**
 * Pool lengths are entered in metres or yards, but always stored in metres:
 * the API, the watch and the event text share one canonical value.
 */
export type SwimDistanceUnit = 'm' | 'yd';

/** One yard is exactly 0.9144 m, by definition */
const METRES_PER_YARD = 0.9144;

/** Keeps a yard entry from landing on 91.43999999999999 */
function canonicalMetres(metres: number): number {
  return Number(metres.toFixed(6));
}

export function toMetres(value: number, unit: SwimDistanceUnit): number {
  return unit === 'yd' ? canonicalMetres(value * METRES_PER_YARD) : value;
}

export function fromMetres(metres: number, unit: SwimDistanceUnit): number {
  return unit === 'yd' ? metres / METRES_PER_YARD : metres;
}

/**
 * What the editor shows. Metres are shown as stored, so an untouched
 * distance is never rounded; yards get the two decimals a pool uses.
 */
export function displayDistance(
  metres: number,
  unit: SwimDistanceUnit,
): number {
  if (unit === 'm') return metres;
  return Number(fromMetres(metres, unit).toFixed(2));
}
