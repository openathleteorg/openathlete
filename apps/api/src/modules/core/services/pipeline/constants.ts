/**
 * Activity Pipeline Constants
 *
 * Configuration values for activity processing pipeline processors
 */

/**
 * Training Match Threshold
 *
 * Minimum match score (0-100) required for an imported activity to be automatically
 * linked to a planned training session.
 *
 * Matching score is calculated based on:
 * - Sport match: 40% weight (a sport of the same family, e.g. trail running
 *   for running, earns 75% of it)
 * - Duration match: 30% weight (if goal_duration specified)
 * - Distance match: 30% weight (if goal_distance specified)
 *
 * When a workout has lap-button or other open-ended steps, a planned duration
 * or distance that only counts its measured steps is a minimum: doing more
 * does not lower the score. See training-match.score.ts.
 *
 * Default: 75% - A good balance between precision and flexibility
 * - Higher values (85-95): More strict, only very close matches
 * - Lower values (60-70): More lenient, may match less similar activities
 */
export const TRAINING_MATCH_THRESHOLD = 75;
