/**
 * Round float values from imported activities to avoid floating point precision errors
 * Examples: 2347.2000000000003 -> 2347.2
 */

/**
 * Round a value to a specified number of decimal places
 * Returns null/undefined if value is null/undefined
 */
function round(
  value: number | null | undefined,
  decimals: number,
): number | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Round a value to a specified number of decimal places
 * Returns 0 if value is null/undefined (for required fields)
 */
function roundRequired(
  value: number | null | undefined,
  decimals: number,
): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Round distance values (meters)
 * 1 decimal place is sufficient for distance precision
 */
export function roundDistance(value: number | null | undefined): number {
  return roundRequired(value, 1);
}

/**
 * Round elevation values (meters)
 * 1 decimal place is sufficient for elevation precision
 */
export function roundElevation(value: number | null | undefined): number {
  return roundRequired(value, 1);
}

/**
 * Round speed values (m/s)
 * 3 decimal places for speed precision (useful for calculations)
 */
export function roundSpeed(
  value: number | null | undefined,
): number | null | undefined {
  return round(value, 3);
}

/**
 * Round cadence values (rpm)
 * 1 decimal place is sufficient
 */
export function roundCadence(
  value: number | null | undefined,
): number | null | undefined {
  return round(value, 1);
}

/**
 * Round power values (watts)
 * 1 decimal place is sufficient
 */
export function roundPower(
  value: number | null | undefined,
): number | null | undefined {
  return round(value, 1);
}

/**
 * Round heartrate values (bpm)
 * 1 decimal place is sufficient
 */
export function roundHeartrate(
  value: number | null | undefined,
): number | null | undefined {
  return round(value, 1);
}

/**
 * Round energy values (kilojoules)
 * 1 decimal place is sufficient
 */
export function roundEnergy(
  value: number | null | undefined,
): number | null | undefined {
  return round(value, 1);
}

/**
 * Round metric values to 2 decimal places
 * Used for all imported metrics from providers (Garmin, Polar, Suunto, etc.)
 */
export function roundMetricValue(value: number): number {
  return roundRequired(value, 2);
}
