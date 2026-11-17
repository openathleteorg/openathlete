/**
 * Activity Pipeline Constants
 *
 * Configuration values for activity processing pipeline processors
 */

/**
 * Training Match Minimum
 *
 * An imported activity is linked to an unlinked session of the same sport on
 * the athlete's same day. When the session plans a duration or distance, the
 * activity must reach at least this share of either: a 5-minute aborted
 * recording, or the warm-up jog before a race, does not take the session.
 *
 * With several candidates, the closest in duration and distance wins, then
 * the closest in start time. See training-match.score.ts.
 */
export const TRAINING_MATCH_MIN_DONE_RATIO = 0.4;
