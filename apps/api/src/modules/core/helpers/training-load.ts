import { MetricType } from '@openathlete/database';
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
 * Resolves the athlete's heart rate profile from their latest recorded
 * metrics and gender. Both HR_MAX and HR_REST are required.
 */
export function getHeartRateProfile(
  metrics: Array<{ type: MetricType | string; value: number }>,
  gender: string | null | undefined,
): HeartRateProfile | null {
  const latest = new Map<MetricType | string, number>();
  for (const metric of metrics) {
    if (!latest.has(metric.type)) latest.set(metric.type, metric.value);
  }
  const hrMax = latest.get(MetricType.HR_MAX);
  const hrRest = latest.get(MetricType.HR_REST);
  if (hrMax == null || hrRest == null) return null;
  return {
    hrMax,
    hrRest,
    gender: gender === 'FEMALE' ? 'female' : 'male',
  };
}

export type PlannedTrimpEstimationMethod =
  'WORKOUT_HR_TARGETS' | 'DURATION_RPE';

export interface PlannedTrimpEstimate {
  value: number;
  method: PlannedTrimpEstimationMethod;
}

/**
 * Minimal persisted workout shape used by the deterministic estimator. Only
 * timed steps with an explicit HEARTRATE target or a HEARTRATE ZONE target are
 * supported. Every top-level step (and every child of a repeat) must be
 * supported; otherwise the workout is considered partial and duration/RPE is
 * used only when that complete fallback is available.
 */
export interface PlannedWorkoutStep {
  durationType: string;
  durationValue?: number | null;
  targets?: PlannedWorkoutTarget[];
  repeatBlock?: {
    repetitions: number;
    childSteps?: PlannedWorkoutStep[];
  } | null;
}

export interface PlannedWorkoutTarget {
  targetType: string;
  targetMin?: number | null;
  targetMax?: number | null;
  targetValue?: number | null;
  metricType?: string | null;
}

export interface PlannedHeartRateZone {
  trainingZoneId: number;
  type: string;
  values: Array<{
    min: number;
    max: number;
    sports?: readonly string[] | null;
  }>;
}

export interface PlannedTrimpEstimationInput {
  goalDuration?: number | null;
  // Stored on its native 0–1 scale. Presentation is responsible for 0–10.
  goalRpe?: number | null;
  sport?: string | null;
  workout?: { steps?: PlannedWorkoutStep[] } | null;
  zones?: PlannedHeartRateZone[];
  profile: HeartRateProfile | null | undefined;
}

function hasUsableHeartRateProfile(
  profile: HeartRateProfile | null | undefined,
): profile is HeartRateProfile {
  return Boolean(
    profile &&
    Number.isFinite(profile.hrMax) &&
    Number.isFinite(profile.hrRest) &&
    profile.hrMax > profile.hrRest &&
    profile.hrRest >= 0,
  );
}

function midpointOrValue(target: PlannedWorkoutTarget): number | null {
  if (target.targetMin != null || target.targetMax != null) {
    if (
      !Number.isFinite(target.targetMin) ||
      !Number.isFinite(target.targetMax) ||
      target.targetMin! > target.targetMax!
    ) {
      return null;
    }
    return (target.targetMin! + target.targetMax!) / 2;
  }
  return Number.isFinite(target.targetValue) ? target.targetValue! : null;
}

function resolveExplicitHeartRateTarget(
  target: PlannedWorkoutTarget,
  profile: HeartRateProfile,
): number | null {
  if (target.targetType !== 'HEARTRATE') return null;
  const value = midpointOrValue(target);
  if (value == null) return null;

  switch (target.metricType) {
    case null:
    case undefined:
      return value;
    case 'HR_MAX':
      return value >= 0 && value <= 1 ? value * profile.hrMax : null;
    case 'HR_RESERVE':
      return value >= 0 && value <= 1
        ? profile.hrRest + value * (profile.hrMax - profile.hrRest)
        : null;
    case 'HR_REST':
      return null;
    default:
      return null;
  }
}

function resolveHeartRateZoneTarget(
  target: PlannedWorkoutTarget,
  zones: PlannedHeartRateZone[],
  sport: string | null | undefined,
): number | null {
  if (target.targetType !== 'ZONE' || !Number.isFinite(target.targetValue)) {
    return null;
  }
  const zone = zones.find(
    (candidate) =>
      candidate.trainingZoneId === target.targetValue &&
      candidate.type === 'HEARTRATE',
  );
  if (!zone) return null;

  const specific = zone.values.filter(
    (value) => sport && value.sports?.includes(sport),
  );
  const generic = zone.values.filter(
    (value) => !value.sports || value.sports.length === 0,
  );
  const values = specific.length ? specific : generic;
  if (values.length !== 1) return null;

  const [value] = values;
  if (
    !Number.isFinite(value.min) ||
    !Number.isFinite(value.max) ||
    value.min > value.max
  ) {
    return null;
  }
  return (value.min + value.max) / 2;
}

function resolveHeartRateTarget(
  targets: PlannedWorkoutTarget[] | undefined,
  zones: PlannedHeartRateZone[],
  sport: string | null | undefined,
  profile: HeartRateProfile,
): number | null {
  const candidates = (targets ?? [])
    .map(
      (target) =>
        resolveExplicitHeartRateTarget(target, profile) ??
        resolveHeartRateZoneTarget(target, zones, sport),
    )
    .filter((value): value is number => value != null)
    .filter((value) => value >= profile.hrRest && value <= profile.hrMax);

  // Multiple HR targets can conflict; do not guess which one the athlete will use.
  return candidates.length === 1 ? candidates[0] : null;
}

function estimateTimedSteps(
  steps: PlannedWorkoutStep[],
  zones: PlannedHeartRateZone[],
  sport: string | null | undefined,
  profile: HeartRateProfile,
): number | null {
  let total = 0;

  for (const step of steps) {
    if (step.repeatBlock) {
      const repetitions = step.repeatBlock.repetitions;
      const children = step.repeatBlock.childSteps;
      if (
        !Number.isInteger(repetitions) ||
        repetitions <= 0 ||
        !children?.length
      ) {
        return null;
      }
      const repeated = estimateTimedSteps(children, zones, sport, profile);
      if (repeated == null) return null;
      total += repeated * repetitions;
      continue;
    }

    if (
      step.durationType !== 'TIME' ||
      !Number.isFinite(step.durationValue) ||
      step.durationValue! <= 0
    ) {
      return null;
    }
    const hr = resolveHeartRateTarget(step.targets, zones, sport, profile);
    if (hr == null) return null;
    total += calculateTrimpFromAverage(
      hr,
      step.durationValue!,
      profile.hrMax,
      profile.hrRest,
      profile.gender,
    ).value;
  }

  return total;
}

/**
 * Deterministic planned-session TRIMP. HR-targeted steps are summed per
 * segment because the Banister intensity term is nonlinear. A structured
 * workout must be completely understood before it wins over duration/RPE.
 */
export function estimatePlannedSessionTrimp(
  input: PlannedTrimpEstimationInput,
): PlannedTrimpEstimate | null {
  const { profile } = input;
  if (!hasUsableHeartRateProfile(profile)) return null;

  const steps = input.workout?.steps;
  if (steps?.length) {
    const value = estimateTimedSteps(
      steps,
      input.zones ?? [],
      input.sport,
      profile,
    );
    if (value != null) return { value, method: 'WORKOUT_HR_TARGETS' };
    return null;
  }

  if (
    !Number.isFinite(input.goalRpe) ||
    input.goalRpe! < 0 ||
    input.goalRpe! > 1
  ) {
    return null;
  }
  const value = estimatePlannedTrimp(
    input.goalDuration,
    input.goalRpe,
    profile,
  );
  return value == null ? null : { value, method: 'DURATION_RPE' };
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
