import {
  CompetitionEvent,
  EVENT_TYPE,
  Event,
  TrainingEvent,
  endOfDay,
} from '@openathlete/shared';

export type PlannedEvent = TrainingEvent | CompetitionEvent;

/**
 * How a planned session went, TrainingPeaks style:
 * - `complete`: done within ±20% of the plan (or done, with nothing to compare);
 * - `partial`: done at 50-79% or 121-150% of the plan;
 * - `off`: done, but more than 50% away from the plan;
 * - `missed`: its day is over and no activity is linked;
 * - `pending`: still to do, today or later.
 */
export type ComplianceStatus =
  'complete' | 'partial' | 'off' | 'missed' | 'pending';

export interface Compliance {
  status: ComplianceStatus;
  /** Done over planned, on the metric below; absent without a goal */
  ratio?: number;
  metric?: 'duration' | 'distance';
}

/** Every status but `pending` is shown on the card */
export type ShownComplianceStatus = Exclude<ComplianceStatus, 'pending'>;

export const isShownCompliance = (
  compliance: Compliance | undefined,
): compliance is Compliance & { status: ShownComplianceStatus } =>
  !!compliance && compliance.status !== 'pending';

export const isPlannedEvent = (event: Event): event is PlannedEvent =>
  event.type === EVENT_TYPE.TRAINING || event.type === EVENT_TYPE.COMPETITION;

function statusForRatio(ratio: number): ComplianceStatus {
  const gap = Math.abs(ratio - 1);
  if (gap <= 0.2) return 'complete';
  if (gap <= 0.5) return 'partial';
  return 'off';
}

/**
 * Duration comes first, as most plans are written in time; distance is the
 * fallback for sessions planned only in kilometres.
 */
export function getCompliance(
  event: PlannedEvent,
  now: Date = new Date(),
): Compliance {
  const activity = event.relatedActivity;

  if (!activity) {
    // Missed only once the whole local day is over: an evening run still counts
    return endOfDay(new Date(event.startDate)) < now
      ? { status: 'missed' }
      : { status: 'pending' };
  }

  if (event.goalDuration && activity.movingTime) {
    const ratio = activity.movingTime / event.goalDuration;
    return { status: statusForRatio(ratio), ratio, metric: 'duration' };
  }

  if (event.goalDistance && activity.distance) {
    const ratio = activity.distance / event.goalDistance;
    return { status: statusForRatio(ratio), ratio, metric: 'distance' };
  }

  return { status: 'complete' };
}

/**
 * The colour strip of a card, as Tailwind classes, by status. Cards set their
 * border colour for dark mode too, so the strip repeats it under `dark:`.
 */
export const complianceStripClass: Record<ComplianceStatus, string> = {
  complete: 'border-l-green-500 dark:border-l-green-500',
  partial: 'border-l-yellow-400 dark:border-l-yellow-400',
  off: 'border-l-orange-500 dark:border-l-orange-500',
  missed: 'border-l-red-500 dark:border-l-red-500',
  pending: '',
};

/** The legend and summary dots, by status */
export const complianceDotClass: Record<ComplianceStatus, string> = {
  complete: 'bg-green-500',
  partial: 'bg-yellow-400',
  off: 'bg-orange-500',
  missed: 'bg-red-500',
  pending: 'bg-muted-foreground/40',
};
