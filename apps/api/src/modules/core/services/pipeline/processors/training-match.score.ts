import { TRAINING_MATCH_MIN_DONE_RATIO } from '../constants';

export type MatchActivity = {
  sport: string;
  distance: number;
  movingTime: number;
  startDate: Date;
};

export type MatchTraining = {
  sport: string;
  goalDistance: number | null;
  goalDuration: number | null;
  startDate: Date;
};

/** The session's planned lengths, each with what the activity did of it */
function plannedLengths(activity: MatchActivity, training: MatchTraining) {
  return [
    { done: activity.movingTime, planned: training.goalDuration },
    { done: activity.distance, planned: training.goalDistance },
  ].filter(
    (length): length is { done: number; planned: number } =>
      length.planned !== null && length.planned > 0,
  );
}

/**
 * Whether an activity can be the session: the same sport and, when the
 * session plans a duration or distance, at least 40% of either. A
 * 5-minute aborted recording or the jog before a race does not take it.
 * Either, not both: planned figures are estimates that can be far off.
 */
export function isCandidate(
  activity: MatchActivity,
  training: MatchTraining,
): boolean {
  if (activity.sport !== training.sport) return false;
  const lengths = plannedLengths(activity, training);
  return (
    lengths.length === 0 ||
    lengths.some(
      ({ done, planned }) => done >= planned * TRAINING_MATCH_MIN_DONE_RATIO,
    )
  );
}

/**
 * Score of a session that plans neither a duration nor a distance
 * (lap-button steps only, some MCP or AI sessions). Nothing says it fits,
 * so it must not outrank a planned session the activity matches, nor take
 * the activity from one: a planned session wins while the activity stays
 * between half and double of it.
 */
const UNPLANNED_SCORE = 50;

/**
 * How close (0-100) the activity's duration and distance are to the
 * session's, to choose between several candidates.
 */
export function closenessScore(
  activity: MatchActivity,
  training: MatchTraining,
): number {
  const lengths = plannedLengths(activity, training);
  if (lengths.length === 0) return UNPLANNED_SCORE;
  const ratios = lengths.map(({ done, planned }) =>
    done > 0 ? Math.min(done / planned, planned / done) : 0,
  );
  const mean = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  return Math.round(mean * 100);
}

/**
 * The session an activity completes, among the unlinked sessions of its
 * day: the candidate closest in duration and distance, then in start time.
 */
export function pickTraining<T extends MatchTraining>(
  activity: MatchActivity,
  trainings: readonly T[],
): { training: T; score: number } | null {
  const startGap = (training: T) =>
    Math.abs(training.startDate.getTime() - activity.startDate.getTime());

  const ranked = trainings
    .filter((training) => isCandidate(activity, training))
    .map((training) => ({
      training,
      score: closenessScore(activity, training),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || startGap(a.training) - startGap(b.training),
    );

  return ranked[0] ?? null;
}
