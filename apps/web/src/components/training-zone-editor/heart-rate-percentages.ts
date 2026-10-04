/** Percentage upper bounds are exclusive, except 100% (inclusive). */
export const DEFAULT_HEART_RATE_PERCENTAGES = [
  { min: 0, max: 50 },
  { min: 50, max: 60 },
  { min: 60, max: 70 },
  { min: 70, max: 80 },
  { min: 80, max: 90 },
  { min: 90, max: 100 },
];

export interface ZoneRange {
  min: number;
  max: number;
}

export function isValidMaxHeartRate(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 300;
}

export function isValidRestingHeartRate(value: number, hrMax: number): boolean {
  return (
    isValidMaxHeartRate(hrMax) &&
    Number.isInteger(value) &&
    value > 0 &&
    value < hrMax
  );
}

export function percentageToHeartRate(
  range: ZoneRange,
  hrMax: number,
  hrRest = 0,
): ZoneRange {
  if (
    !isValidMaxHeartRate(hrMax) ||
    (hrRest !== 0 && !isValidRestingHeartRate(hrRest, hrMax)) ||
    !Number.isFinite(range.min) ||
    !Number.isFinite(range.max) ||
    range.min < 0 ||
    range.max > 100 ||
    (range.min >= range.max && !(range.min === 100 && range.max === 100))
  ) {
    throw new Error('Invalid heart-rate percentages');
  }
  // Integer BPM limits are inclusive in OpenAthlete. Shared boundaries belong
  // to the higher zone; rounding once avoids both overlaps and missing beats.
  const reserve = hrMax - hrRest;
  const min = Math.round(hrRest + (range.min * reserve) / 100);
  const max =
    Math.round(hrRest + (range.max * reserve) / 100) -
    (range.max === 100 ? 0 : 1);
  if (min > max) throw new Error('Percentage interval is too narrow');
  return { min, max };
}

export function heartRateToPercentage(
  range: ZoneRange,
  hrMax: number,
  hrRest = 0,
): ZoneRange {
  if (
    !isValidMaxHeartRate(hrMax) ||
    (hrRest !== 0 && !isValidRestingHeartRate(hrRest, hrMax)) ||
    !Number.isInteger(range.min) ||
    !Number.isInteger(range.max) ||
    range.min < hrRest ||
    range.max > hrMax ||
    range.min > range.max
  ) {
    throw new Error('Heart-rate range cannot be expressed as percentages');
  }
  const percent = (value: number) =>
    Math.round(((value - hrRest) / (hrMax - hrRest)) * 10000) / 100;
  return {
    min: percent(range.min),
    max: range.max === hrMax ? 100 : Math.min(99.99, percent(range.max + 1)),
  };
}
