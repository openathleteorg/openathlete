import type { CreateWorkoutStepDto } from '@openathlete/shared';
import { WORKOUT_DURATION_TYPE, WORKOUT_STEP_TYPE } from '@openathlete/shared';

/** 0:45, 12:30, 1:05:00 — a running clock */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const min = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

/** A total as people say it: 45 min, 1 h 20, 1 h */
export function formatTotal(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${h} h ${String(rest).padStart(2, '0')}` : `${h} h`;
}

export function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${Number(km.toFixed(km >= 10 ? 1 : 2))} km`;
}

/** The step length as written on its row: 10', 1'30, 400 m, 12 reps */
export function formatStepLength(
  step: Pick<CreateWorkoutStepDto, 'durationType' | 'durationValue'>,
): string | null {
  const value = step.durationValue ?? 0;
  switch (step.durationType) {
    case WORKOUT_DURATION_TYPE.TIME: {
      const total = Math.round(value);
      const h = Math.floor(total / 3600);
      const min = Math.floor((total % 3600) / 60);
      const s = total % 60;
      if (h > 0) return min ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
      if (min === 0) return `${s}"`;
      return s ? `${min}'${String(s).padStart(2, '0')}` : `${min}'`;
    }
    case WORKOUT_DURATION_TYPE.DISTANCE:
      return value >= 1000 ? formatKm(value) : `${Math.round(value)} m`;
    case WORKOUT_DURATION_TYPE.REPS:
      return `×${Math.round(value)}`;
    case WORKOUT_DURATION_TYPE.CALORIES:
      return `${Math.round(value)} kcal`;
    case WORKOUT_DURATION_TYPE.HR_BELOW:
      return `< ${Math.round(value)} bpm`;
    case WORKOUT_DURATION_TYPE.HR_ABOVE:
      return `> ${Math.round(value)} bpm`;
    default:
      return null;
  }
}

/** Colour role of each step type, from the theme's chart palette */
export const STEP_TONE: Record<WORKOUT_STEP_TYPE, string> = {
  [WORKOUT_STEP_TYPE.WARMUP]: 'var(--chart-3)',
  [WORKOUT_STEP_TYPE.COOLDOWN]: 'var(--chart-5)',
  [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'var(--chart-1)',
  [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'var(--chart-2)',
  [WORKOUT_STEP_TYPE.STEADY]: 'var(--chart-4)',
  [WORKOUT_STEP_TYPE.REPEAT]: 'var(--chart-6)',
  [WORKOUT_STEP_TYPE.FREE]: 'var(--muted-foreground)',
};
