/** Length of one backfill request, the window Garmin has always accepted */
export const GARMIN_BACKFILL_WINDOW_SECONDS = 30 * 24 * 60 * 60;

/**
 * Where the history backfill stops: Garmin Connect opened in 2008, and
 * activities of older devices were uploaded with their own dates.
 */
export const GARMIN_HISTORY_FLOOR_SECONDS = Date.UTC(2006, 0, 1) / 1000;
