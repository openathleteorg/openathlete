/**
 * Port of apps/api/src/modules/core/helpers/grade-adjusted-speed.ts, so the
 * calculator gives the numbers the app shows on each activity. Keep the
 * coefficients and the clamp in sync with the API.
 */

/** Grades beyond this are GPS or altitude noise, not terrain */
export const MAX_GRADE = 0.3;

/**
 * Energy cost of running at a grade (fraction, 0.1 for 10%), in J/kg/m.
 * Minetti et al. 2002, doi:10.1152/japplphysiol.01177.2001.
 */
export function runningEnergyCost(grade: number): number {
  const i = grade;
  return (
    155.4 * i ** 5 -
    30.4 * i ** 4 -
    43.3 * i ** 3 +
    46.3 * i ** 2 +
    19.5 * i +
    3.6
  );
}

/** How much more (or less) a metre costs at `grade` than on the flat. */
export function costRatio(grade: number): number {
  const clamped = Math.max(-MAX_GRADE, Math.min(MAX_GRADE, grade));
  return runningEnergyCost(clamped) / runningEnergyCost(0);
}

/** Flat pace (s/km) that costs the same as `paceSeconds` at `grade`. */
export function flatEquivalentPace(paceSeconds: number, grade: number) {
  return paceSeconds / costRatio(grade);
}

/** Pace (s/km) to hold at `grade` for the effort of `flatPaceSeconds`. */
export function paceOnGrade(flatPaceSeconds: number, grade: number) {
  return flatPaceSeconds * costRatio(grade);
}

/** Km-effort, French definition: 100 m of climbing count as 1 km. */
export function kmEffort(km: number, climbM: number) {
  return km + climbM / 100;
}

/** Riegel exponents bounding the trail estimate. */
export const TRAIL_EXPONENTS = [1.06, 1.1] as const;

/** Time window over `toEffort` km-effort from a reference over `fromEffort`. */
export function trailTimeWindow(
  seconds: number,
  fromEffort: number,
  toEffort: number,
): [number, number] {
  const times = TRAIL_EXPONENTS.map(
    (k) => seconds * Math.pow(toEffort / fromEffort, k),
  );
  return [Math.min(...times), Math.max(...times)];
}
