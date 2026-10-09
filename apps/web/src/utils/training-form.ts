import { m } from '@/paraglide/messages';

// Same thresholds as the API's training status (training-formulas.constants)
export const TSB_OVERREACHING = -10;
export const TSB_DETRAINING = 25;

export type FormStatus = 'overtraining' | 'optimal' | 'detraining';

/** Form (TSB = CTL - ATL) status, as the API and the load chart classify it */
export function getFormStatus(tsb: number): FormStatus {
  if (tsb < TSB_OVERREACHING) return 'overtraining';
  if (tsb > TSB_DETRAINING) return 'detraining';
  return 'optimal';
}

export const formStatusLabel: Record<FormStatus, () => string> = {
  overtraining: m.overtraining,
  optimal: m.optimal_zone,
  detraining: m.detraining,
};

export const formStatusTextClass: Record<FormStatus, string> = {
  overtraining: 'text-red-600 dark:text-red-400',
  optimal: 'text-green-600 dark:text-green-400',
  detraining: 'text-blue-600 dark:text-blue-400',
};

/** Solid colours for a small status dot */
export const formStatusDotClass: Record<FormStatus, string> = {
  overtraining: 'bg-red-500',
  optimal: 'bg-green-500',
  detraining: 'bg-blue-500',
};

export const formStatusBackgroundClass: Record<FormStatus, string> = {
  overtraining:
    'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
  optimal:
    'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  detraining:
    'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
};

/** Signed, rounded form value: "+12", "-4", "0" */
export const formatForm = (tsb: number) => {
  const rounded = Math.round(tsb);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};
