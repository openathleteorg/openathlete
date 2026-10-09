import { ActivityStream } from '@openathlete/shared';

import {
  EWMA_ALPHA_ATL,
  EWMA_ALPHA_CTL,
  PLANNED_LOAD_DEFAULT_RPE,
  PLANNED_LOAD_HRR_BASE,
  PLANNED_LOAD_HRR_SLOPE,
  TRIMP_COEFFICIENT_K_FEMALE,
  TRIMP_COEFFICIENT_K_MALE,
  TRIMP_COEFFICIENT_Y_FEMALE,
  TRIMP_COEFFICIENT_Y_MALE,
} from 'src/common/constants/training-formulas.constants';

/**
 * Training load is bucketed by UTC calendar day: entries are stored at UTC
 * midnight and keyed by `YYYY-MM-DD`. Every helper below works on UTC date
 * parts so results do not depend on the server timezone.
 */

export type TrimpGender = 'male' | 'female';

export interface TrimpResult {
  value: number;
  avgHr: number;
  duration: number; // seconds
}

export function toUtcDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function startOfUtcDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Monday (UTC midnight) of the UTC week containing `date`.
 */
export function getUtcWeekStart(date: Date): Date {
  const result = startOfUtcDay(date);
  const daysSinceMonday = (result.getUTCDay() + 6) % 7;
  return addUtcDays(result, -daysSinceMonday);
}

function getTrimpCoefficients(gender: TrimpGender) {
  return gender === 'female'
    ? { k: TRIMP_COEFFICIENT_K_FEMALE, y: TRIMP_COEFFICIENT_Y_FEMALE }
    : { k: TRIMP_COEFFICIENT_K_MALE, y: TRIMP_COEFFICIENT_Y_MALE };
}

/**
 * Banister TRIMP for `minutes` spent at `hr`:
 * minutes × HRr × y × e^(k × HRr), with HRr = (HR - HRrest) / (HRmax - HRrest)
 */
function trimpAt(
  hr: number,
  minutes: number,
  hrMax: number,
  hrRest: number,
  gender: TrimpGender,
): number {
  const hrFraction = (hr - hrRest) / (hrMax - hrRest);
  if (hrFraction <= 0) {
    return 0;
  }
  const { k, y } = getTrimpCoefficients(gender);
  return minutes * hrFraction * y * Math.exp(k * hrFraction);
}

/**
 * TRIMP integrated over a second-by-second heart rate stream.
 */
export function calculateTrimpFromStream(
  stream: Pick<ActivityStream, 'heartrate' | 'time'>,
  hrMax: number,
  hrRest: number,
  gender: TrimpGender = 'male',
): TrimpResult {
  const { heartrate, time } = stream;
  if (!heartrate || !time) {
    throw new Error('Heart rate or time data not available');
  }

  let value = 0;
  let totalHr = 0;
  let validPoints = 0;

  for (let i = 1; i < time.length; i++) {
    const hr = heartrate[i];
    const minutes = (time[i] - time[i - 1]) / 60;

    if (hr && minutes > 0 && hr > hrRest) {
      value += trimpAt(hr, minutes, hrMax, hrRest, gender);
      totalHr += hr;
      validPoints++;
    }
  }

  return {
    value,
    avgHr: validPoints > 0 ? totalHr / validPoints : 0,
    duration: time[time.length - 1] ?? 0,
  };
}

/**
 * TRIMP estimated from average heart rate, for activities without a heart
 * rate stream (manual entries, imports without streams).
 */
export function calculateTrimpFromAverage(
  averageHr: number,
  durationSeconds: number,
  hrMax: number,
  hrRest: number,
  gender: TrimpGender = 'male',
): TrimpResult {
  return {
    value: trimpAt(averageHr, durationSeconds / 60, hrMax, hrRest, gender),
    avgHr: averageHr,
    duration: durationSeconds,
  };
}

export interface HeartRateProfile {
  hrMax: number;
  hrRest: number;
  gender: TrimpGender;
}

/**
 * TRIMP of a planned session, in the same unit as the load of activities, so
 * planned and actual loads add up. Used when the AI estimate is missing: the
 * session is assumed to be done at the heart rate its target RPE (0-1)
 * usually brings. Returns null without a duration.
 */
export function estimatePlannedTrimp(
  durationSeconds: number | null | undefined,
  rpe: number | null | undefined,
  { hrMax, hrRest, gender }: HeartRateProfile,
): number | null {
  if (!durationSeconds || durationSeconds <= 0 || hrMax <= hrRest) {
    return null;
  }
  const effort = Math.min(Math.max(rpe ?? PLANNED_LOAD_DEFAULT_RPE, 0), 1);
  const hrFraction = PLANNED_LOAD_HRR_BASE + PLANNED_LOAD_HRR_SLOPE * effort;
  const hr = hrRest + hrFraction * (hrMax - hrRest);
  return trimpAt(hr, durationSeconds / 60, hrMax, hrRest, gender);
}

export interface FitnessState {
  ctl: number;
  atl: number;
}

/**
 * One day of the Banister impulse-response model: fitness (CTL, 42 days) and
 * fatigue (ATL, 7 days) as exponentially weighted averages of daily load.
 * Rest days must be fed too, with a load of 0, as they make both decay.
 */
export function advanceFitness(
  { ctl, atl }: FitnessState,
  load: number,
): FitnessState {
  return {
    ctl: EWMA_ALPHA_CTL * load + (1 - EWMA_ALPHA_CTL) * ctl,
    atl: EWMA_ALPHA_ATL * load + (1 - EWMA_ALPHA_ATL) * atl,
  };
}
