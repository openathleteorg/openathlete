
import type {
  IntensityAnalysis,
  IntensityModel,
  ZoneDistribution,
} from './intensity-analysis.types';

/**
 * Validates a three-zone intensity distribution.
 *
 * Percentages must:
 * - Be finite numbers.
 * - Be between 0 and 100.
 * - Add up to approximately 100%.
 */
export function isValidDistribution(
  { z1, z2, z3 }: ZoneDistribution,
): boolean {
  const values = [z1, z2, z3];

  return (
    values.every(Number.isFinite) &&
    values.every((value) => value >= 0 && value <= 100) &&
    Math.abs(z1 + z2 + z3 - 100) <= 0.5
  );
}

/**
 * Polarization Index (PI).
 *
 * Based on Treff et al. (2019).
 *
 * Validity conditions:
 * Z1 > Z3 > Z2
 *
 * Returns null when the index is undefined.
 */
export function calculatePolarizationIndex(
  { z1, z2, z3 }: ZoneDistribution,
): number | null {
  if (!isValidDistribution({ z1, z2, z3 })) {
    return null;
  }

  if (z3 === 0) {
    return 0;
  }

  if (z1 <= z3 || z3 <= z2) {
    return null;
  }

  const zone1 = z1 / 100;
  const zone2 = z2 / 100;
  const zone3 = z3 / 100;

  let rawIndex: number;

  if (zone2 === 0) {
    const epsilon = 0.01;

    if (zone3 <= epsilon) {
      return null;
    }

    rawIndex =
      100 * (zone1 / epsilon) * (zone3 - epsilon);
  } else {
    rawIndex =
      100 * (zone1 / zone2) * zone3;
  }

  if (
    rawIndex <= 0 ||
    !Number.isFinite(rawIndex)
  ) {
    return null;
  }

  return Math.log10(rawIndex);
}

/**
 * Classifies a distribution using its Polarization Index.
 *
 * PI > 2: Polarized
 * PI <= 2: Non-polarized
 * null: Undefined
 */
export function classifyByPolarizationIndex(
  pi: number | null,
): 'POLARIZED' | 'NON_POLARIZED' | 'UNDEFINED' {
  if (pi === null || !Number.isFinite(pi)) {
    return 'UNDEFINED';
  }

  return pi > 2
    ? 'POLARIZED'
    : 'NON_POLARIZED';
}

/**
 * Classifies the structural shape of a three-zone
 * training intensity distribution.
 *
 * POLARIZED:
 * Z1 > Z3 > Z2
 *
 * PYRAMIDAL:
 * Z1 > Z2 > Z3
 *
 * THRESHOLD:
 * Z2 is the largest zone.
 *
 * INVERTED_PYRAMIDAL:
 * Z3 > Z2 > Z1
 *
 * MIXED:
 * No clear structural pattern.
 */
export function classifyDistribution(
  { z1, z2, z3 }: ZoneDistribution,
): IntensityModel {
  if (!isValidDistribution({ z1, z2, z3 })) {
    return 'MIXED';
  }

  if (z1 > z3 && z3 > z2) {
    return 'POLARIZED';
  }

  if (z1 > z2 && z2 > z3) {
    return 'PYRAMIDAL';
  }

  if (z2 > z1 && z2 > z3) {
    return 'THRESHOLD';
  }

  if (z3 > z2 && z2 > z1) {
    return 'INVERTED_PYRAMIDAL';
  }

  return 'MIXED';
}

/**
 * Calculates the difference between actual
 * and reference distributions.
 *
 * Positive: more time than reference.
 * Negative: less time than reference.
 */
export function getDistributionDifference(
  actual: ZoneDistribution,
  reference: ZoneDistribution,
): ZoneDistribution {
  return {
    z1: actual.z1 - reference.z1,
    z2: actual.z2 - reference.z2,
    z3: actual.z3 - reference.z3,
  };
}

/**
 * Available recommendation types.
 */
export type RecommendationKey =
  | 'BUILD_VOLUME'
  | 'EASY_RUNNING'
  | 'REDUCE_MODERATE'
  | 'ADD_INTENSITY'
  | 'MAINTAIN_BALANCE';

/**
 * Generates a descriptive training recommendation.
 *
 * Recommendations depend exclusively on the
 * three-zone intensity distribution.
 *
 * No Training Load, CTL, ATL, TSB or recovery data.
 *
 * These rules are application-specific and are
 * not prescribed directly by Treff et al. (2019).
 */
export function getRecommendation(
  analysis: IntensityAnalysis,
): RecommendationKey {
  const { z1, z2, z3 } = analysis.distribution;

  // Invalid distribution: avoid making a misleading recommendation.
  if (!isValidDistribution(analysis.distribution)) {
    return 'MAINTAIN_BALANCE';
  }

  // 1. Excessive moderate-intensity training.
  if (z2 >= 30) {
    return 'REDUCE_MODERATE';
  }

  // 2. Insufficient easy running.
  if (z1 < 65) {
    return 'EASY_RUNNING';
  }

  // 3. Very little high-intensity training.
  //
  // This is a descriptive suggestion, not a prescription.
  if (z3 < 5 && z1 >= 75) {
    return 'ADD_INTENSITY';
  }

  // 4. Relatively low aerobic volume.
  if (z1 < 70) {
    return 'BUILD_VOLUME';
  }

  // 5. No significant imbalance detected.
  return 'MAINTAIN_BALANCE';
}

