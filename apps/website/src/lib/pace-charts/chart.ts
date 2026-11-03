import { formatDuration } from '@/components/tools/format';
import { type ParaglideLocale } from '@/utils/locales';

import {
  type DistanceSpec,
  type FitTier,
  RACE_METRES,
  type RaceId,
  goalSeconds,
} from './data';
import { type TrainingPaces, trainingPaces, vdotFromPerformance } from './vdot';

const MILE = 1609.344;

/**
 * The negative-split option runs the first half this much slower and the
 * second half this much faster: the same finish time, with the effort kept
 * for the end. Small on purpose, as in fast marathons.
 */
const SPLIT_SHIFT = 0.01;

/** Peter Riegel, 1977: T2 = T1 × (D2 / D1)^1.06 */
export function riegel(seconds: number, from: number, to: number): number {
  return seconds * Math.pow(to / from, 1.06);
}

export { formatDuration };

/** A pace in seconds per km (or mile) as "5:20". */
export const formatPace = (seconds: number) => formatDuration(seconds);

/** A speed in m/s as a pace per km. */
export const paceOfSpeed = (metresPerSecond: number) =>
  formatPace(1000 / metresPerSecond);

export function formatNumber(
  value: number,
  locale: ParaglideLocale,
  digits = 1,
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** The goal as runners write it: "3:45" in English, "3h45" elsewhere. */
export function goalLabel(slug: string, locale: ParaglideLocale): string {
  const [hours, minutes] = slug.split('-');
  return locale === 'en' ? `${hours}:${minutes}` : `${hours}h${minutes}`;
}

/** A duration rounded to the minute, written like a goal: "2:23", "2h23". */
export function hoursLabel(seconds: number, locale: ParaglideLocale): string {
  const minutes = Math.round(seconds / 60);
  const slug = `${Math.floor(minutes / 60)}-${String(minutes % 60).padStart(2, '0')}`;
  return goalLabel(slug, locale);
}

export interface Split {
  metres: number;
  even: number;
  negative: number;
}

export interface WorkoutStep {
  kind: 'warmUp' | 'goal' | 'float' | 'coolDown';
  km: number;
  /** Seconds per km. */
  pace: number;
  seconds: number;
}

export interface PaceChart {
  spec: DistanceSpec;
  slug: string;
  metres: number;
  seconds: number;
  /** Seconds per km and per mile, km/h. */
  pace: number;
  paceMile: number;
  speedKmh: number;
  /** Paces of the negative-split option, seconds per km. */
  firstHalfPace: number;
  secondHalfPace: number;
  halfway: { even: number; first: number; second: number };
  everyKm: Split[];
  checkpoints: Split[];
  equivalents: { race: RaceId; seconds: number; pace: number }[];
  benchmarks: { race: RaceId; seconds: number }[];
  vdot: number;
  paces: TrainingPaces;
  workout: { steps: WorkoutStep[]; km: number; seconds: number };
  fit: FitTier;
}

export function buildPaceChart(spec: DistanceSpec, slug: string): PaceChart {
  const metres = RACE_METRES[spec.race];
  const seconds = goalSeconds(slug);
  const pace = seconds / (metres / 1000);
  const firstHalfPace = pace * (1 + SPLIT_SHIFT);
  const secondHalfPace = pace * (1 - SPLIT_SHIFT);
  const half = metres / 2;

  const split = (at: number): Split => ({
    metres: at,
    even: (pace * at) / 1000,
    negative:
      at <= half
        ? (firstHalfPace * at) / 1000
        : (firstHalfPace * half + secondHalfPace * (at - half)) / 1000,
  });

  const kms = Math.floor(metres / 1000);
  const everyKm = [
    ...Array.from({ length: kms }, (_, i) => split((i + 1) * 1000)),
    split(metres),
  ];
  const checkpointMetres = [
    ...Array.from(
      { length: Math.floor(metres / 5000) },
      (_, i) => (i + 1) * 5000,
    ),
    half,
    metres,
  ].sort((a, b) => a - b);
  const checkpoints = [...new Set(checkpointMetres)].map(split);

  const vdot = vdotFromPerformance(metres, seconds);
  const paces = trainingPaces(vdot);
  // Warm-up, floats and cool-down at the middle of Daniels' easy range
  const easyPace = (1000 / paces.easy.slowest + 1000 / paces.easy.fastest) / 2;
  const { warmUpKm, reps, repKm, floatKm, coolDownKm } = spec.workout;
  const step = (kind: WorkoutStep['kind'], km: number, p: number) => ({
    kind,
    km,
    pace: p,
    seconds: km * p,
  });
  const steps: WorkoutStep[] = [
    step('warmUp', warmUpKm, easyPace),
    ...Array.from({ length: reps }).flatMap((_, i) =>
      i < reps - 1
        ? [step('goal', repKm, pace), step('float', floatKm, easyPace)]
        : [step('goal', repKm, pace)],
    ),
    step('coolDown', coolDownKm, easyPace),
  ];

  return {
    spec,
    slug,
    metres,
    seconds,
    pace,
    paceMile: (pace * MILE) / 1000,
    speedKmh: metres / 1000 / (seconds / 3600),
    firstHalfPace,
    secondHalfPace,
    halfway: {
      even: seconds / 2,
      first: (firstHalfPace * half) / 1000,
      second: seconds - (firstHalfPace * half) / 1000,
    },
    everyKm,
    checkpoints,
    equivalents: spec.equivalents.map((race) => {
      const time = riegel(seconds, metres, RACE_METRES[race]);
      return { race, seconds: time, pace: time / (RACE_METRES[race] / 1000) };
    }),
    benchmarks: spec.benchmarks.map((race) => ({
      race,
      seconds: riegel(seconds, metres, RACE_METRES[race]),
    })),
    vdot,
    paces,
    workout: {
      steps,
      km: steps.reduce((sum, s) => sum + s.km, 0),
      seconds: steps.reduce((sum, s) => sum + s.seconds, 0),
    },
    fit: spec.fit.find((tier) => seconds < tier.under) ?? spec.fit.at(-1)!,
  };
}

/** The goals either side of this one, for the "nearby goals" links. */
export function neighbours(spec: DistanceSpec, slug: string) {
  const index = spec.goals.indexOf(slug);
  return {
    faster: index > 0 ? spec.goals[index - 1] : undefined,
    slower: index < spec.goals.length - 1 ? spec.goals[index + 1] : undefined,
  };
}
