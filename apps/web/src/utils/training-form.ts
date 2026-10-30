import { m } from '@/paraglide/messages';

// Same thresholds as the API's training status (training-formulas.constants)
export const TSB_OVERREACHING = -20;
export const TSB_DETRAINING = 25;

export type FormStatus = 'overtraining' | 'optimal' | 'detraining';

/** Form (TSB = CTL - ATL) status, as the API and the load chart classify it */
export function getFormStatus(tsb: number): FormStatus {
  if (tsb < TSB_OVERREACHING) return 'overtraining';
  if (tsb > TSB_DETRAINING) return 'detraining';
  return 'optimal';
}

export const formStatusLabel: Record<FormStatus, () => string> = {
  overtraining: m.form_high_fatigue,
  optimal: m.form_balanced,
  detraining: m.form_very_fresh,
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

/** Signed, rounded form value: "+12", "-4", "0" */
export const formatForm = (tsb: number) => {
  const rounded = Math.round(tsb);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
};
