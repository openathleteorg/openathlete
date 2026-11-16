import type {
  TrainingFocus,
  TrainingFocusDto,
  TrainingFocusValue,
  TrainingWeakness,
} from '../types/dtos/core/records.dto';
import type { PowerEffort } from './ftp-model';

/*
 * The method is the field test of the coach Matthias Arend (Two Peaks
 * Endurance Training), "So findest du deine Stärken und Schwächen heraus":
 * three runs give the speed at the aerobic threshold (25 minutes at 88 % of
 * the threshold heart rate), at the lactate threshold (minutes 10 to 30 of a
 * 45-minute effort) and at VO2max (6 minutes all out), and three ratios of
 * these speeds, compared with the averages of the runners he coached, name
 * the system to train. Running power stands in for speed here, read from the
 * power-duration records as in a WKO5 chart an athlete built on the same
 * test: power over 70 minutes for the aerobic threshold, FTP for the lactate
 * threshold and power over 3 minutes for VO2max.
 */

/** Seconds the aerobic threshold and VO2max are read at */
export const TRAINING_FOCUS_DURATIONS = {
  aerobicThreshold: 70 * 60,
  vo2max: 3 * 60,
} as const;

/** Average ratios of the test, and where a ratio shows a clear weakness */
export const TRAINING_FOCUS_RATIOS = {
  aerobicToVo2max: { average: 0.7552, low: 0.7, high: 0.8 },
  aerobicToThreshold: { average: 0.865, low: 0.83, high: 0.88 },
  thresholdToVo2max: { average: 0.8754, low: 0.84, high: 0.9 },
} as const;

/**
 * Between two maximal efforts, power falls with duration no faster than
 * duration^-0.25 (from 2 to 5 minutes, at least 79 % is kept; from 1 to 2
 * hours, 84 %). A steeper fall means the longer record was not ridden all
 * out, an easy long run for instance, and the value read between them would
 * be too low.
 */
export const MAXIMAL_EFFORT_DECAY = 0.25;

/** Records further apart than this factor leave a gap too wide to read */
export const MAXIMAL_EFFORT_SPAN = 3;

/**
 * Power at a duration, read between the two nearest records on a
 * logarithmic time axis, as power-duration curves are drawn. Null when no
 * records surround it closely, or when they do not look like maximal
 * efforts.
 */
export function powerAt(
  efforts: Pick<PowerEffort, 'duration' | 'value'>[],
  seconds: number,
): number | null {
  const sorted = [...efforts]
    .filter((effort) => effort.value > 0)
    .sort((a, b) => a.duration - b.duration);
  const exact = sorted.find((effort) => effort.duration === seconds);
  if (exact) return exact.value;
  const after = sorted.findIndex((effort) => effort.duration > seconds);
  if (after <= 0) return null;
  const a = sorted[after - 1];
  const b = sorted[after];
  const span = b.duration / a.duration;
  if (span > MAXIMAL_EFFORT_SPAN) return null;
  if (b.value / a.value < span ** -MAXIMAL_EFFORT_DECAY) return null;
  const position = Math.log(seconds / a.duration) / Math.log(span);
  return a.value + (b.value - a.value) * position;
}

const round = (share: number) => Math.round(share * 10000) / 10000;

/**
 * The plan the test recommends. Its four rules overlap (r1 = r2 × r3, so
 * "VO2max" with r1 high and r3 low always meets "lactate threshold") and
 * leave a profile out (r2 low, r3 high). Read as a tree on r2, which says
 * whether the lactate threshold lags, they name one plan for every profile
 * and agree with the test wherever it is unambiguous: the VO2max rule is
 * then the case its title describes, VO2max weak and the threshold not.
 * A ratio equal to its average counts as not above it.
 */
export function trainingFocusOf(ratios: {
  aerobicToVo2max: number;
  aerobicToThreshold: number;
  thresholdToVo2max: number;
}): TrainingFocus {
  const { aerobicToVo2max: r1, aerobicToThreshold: r2 } = ratios;
  const r3 = ratios.thresholdToVo2max;
  const a = TRAINING_FOCUS_RATIOS;
  if (r2 > a.aerobicToThreshold.average) {
    return r3 > a.thresholdToVo2max.average
      ? 'VO2MAX_THEN_THRESHOLD'
      : 'THRESHOLD';
  }
  return r1 > a.aerobicToVo2max.average ? 'VO2MAX' : 'AEROBIC_BASE';
}

/** Where to train, from the three values of the test (any one unit) */
export function modelTrainingFocus(values: {
  aerobicThreshold: number;
  lactateThreshold: number;
  vo2max: number;
}): TrainingFocusDto | null {
  const { aerobicThreshold, lactateThreshold, vo2max } = values;
  if (!(aerobicThreshold > 0 && lactateThreshold > 0 && vo2max > 0))
    return null;

  const ratios = {
    aerobicToVo2max: aerobicThreshold / vo2max,
    aerobicToThreshold: aerobicThreshold / lactateThreshold,
    thresholdToVo2max: lactateThreshold / vo2max,
  };
  const { aerobicToVo2max: r1, aerobicToThreshold: r2 } = ratios;
  const r3 = ratios.thresholdToVo2max;
  const { aerobicToVo2max: a1, aerobicToThreshold: a2 } = TRAINING_FOCUS_RATIOS;
  const a3 = TRAINING_FOCUS_RATIOS.thresholdToVo2max;

  // The "clear weakness" limits qualify the result, they choose no plan
  const weaknesses = new Set<TrainingWeakness>();
  if (r1 > a1.high || r3 > a3.high) weaknesses.add('VO2MAX');
  if (r1 < a1.low || r2 < a2.low) weaknesses.add('AEROBIC');
  if (r2 > a2.high || r3 < a3.low) weaknesses.add('THRESHOLD');

  return {
    aerobicThreshold: Math.round(aerobicThreshold),
    lactateThreshold: Math.round(lactateThreshold),
    vo2max: Math.round(vo2max),
    ratios: {
      aerobicToVo2max: round(r1),
      aerobicToThreshold: round(r2),
      thresholdToVo2max: round(r3),
    },
    weaknesses: (['AEROBIC', 'THRESHOLD', 'VO2MAX'] as const).filter((w) =>
      weaknesses.has(w),
    ),
    focus: trainingFocusOf(ratios),
  };
}

/** The values of the test the records cannot give, in the order of the test */
export function missingTrainingFocusValues(values: {
  aerobicThreshold: number | null;
  lactateThreshold: number | null;
  vo2max: number | null;
}): TrainingFocusValue[] {
  const read: [TrainingFocusValue, number | null][] = [
    ['AEROBIC_THRESHOLD', values.aerobicThreshold],
    ['LACTATE_THRESHOLD', values.lactateThreshold],
    ['VO2MAX', values.vo2max],
  ];
  return read.filter(([, value]) => !(value && value > 0)).map(([key]) => key);
}
