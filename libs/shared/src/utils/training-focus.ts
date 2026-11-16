import type {
  TrainingFocus,
  TrainingFocusDto,
  TrainingWeakness,
} from '../types/dtos/core/records.dto';
import type { PowerEffort } from './ftp-model';

/** Seconds the three values of the test are read at */
export const TRAINING_FOCUS_DURATIONS = {
  aerobicThreshold: 70 * 60,
  vo2max: 3 * 60,
} as const;

/** Average ratios of runners, and where a ratio shows a clear weakness */
export const TRAINING_FOCUS_RATIOS = {
  aerobicToVo2max: { average: 0.7552, low: 0.7, high: 0.8 },
  aerobicToThreshold: { average: 0.865, low: 0.83, high: 0.88 },
  thresholdToVo2max: { average: 0.8754, low: 0.84, high: 0.9 },
} as const;

/**
 * Power at a duration, read on a straight line between the two nearest
 * records around it, as on a power-duration curve. Null outside the records.
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
  return (
    a.value +
    ((b.value - a.value) * (seconds - a.duration)) / (b.duration - a.duration)
  );
}

const round = (share: number) => Math.round(share * 10000) / 10000;

/**
 * Where to train, from three ratios of the power profile. The rules are those
 * of the test the athlete brought (a WKO5 chart); its four rules leave some
 * profiles without an answer, which then get the system the ratios point to
 * the most, each ratio weighed by how far it is from the average.
 */
export function modelTrainingFocus(values: {
  aerobicThreshold: number;
  lactateThreshold: number;
  vo2max: number;
}): TrainingFocusDto | null {
  const { aerobicThreshold, lactateThreshold, vo2max } = values;
  if (!(aerobicThreshold > 0 && lactateThreshold > 0 && vo2max > 0))
    return null;

  const r1 = aerobicThreshold / vo2max;
  const r2 = aerobicThreshold / lactateThreshold;
  const r3 = lactateThreshold / vo2max;
  const {
    aerobicToVo2max: a1,
    aerobicToThreshold: a2,
    thresholdToVo2max: a3,
  } = TRAINING_FOCUS_RATIOS;

  const weaknesses = new Set<TrainingWeakness>();
  if (r1 > a1.high || r3 > a3.high) weaknesses.add('VO2MAX');
  if (r1 < a1.low || r2 < a2.low) weaknesses.add('AEROBIC');
  if (r2 > a2.high || r3 < a3.low) weaknesses.add('THRESHOLD');

  let focus: TrainingFocus | null = null;
  if (r1 < a1.average && r2 < a2.average) focus = 'AEROBIC_BASE';
  else if (r1 > a1.average && r2 > a2.average && r3 > a3.average)
    focus = 'VO2MAX_THEN_THRESHOLD';
  else if (r1 > a1.average && r3 < a3.average) focus = 'VO2MAX';
  else if (r2 > a2.average && r3 < a3.average) focus = 'THRESHOLD';
  const byRule = focus !== null;

  if (!focus) {
    const off = (ratio: number, average: number) => (ratio - average) / average;
    const scores: [TrainingFocus, number][] = [
      ['AEROBIC_BASE', -off(r1, a1.average) - off(r2, a2.average)],
      ['VO2MAX', off(r1, a1.average) + off(r3, a3.average)],
      ['THRESHOLD', off(r2, a2.average) - off(r3, a3.average)],
    ];
    focus = scores.reduce((best, score) =>
      score[1] > best[1] ? score : best,
    )[0];
  }

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
    focus,
    byRule,
  };
}
