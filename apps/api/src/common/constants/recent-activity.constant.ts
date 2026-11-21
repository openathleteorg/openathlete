/**
 * Activities that started within this window are new: their import runs the
 * weather lookup, coach notice, push notification and AI summary. Older ones
 * come from a backfill or an archive and are imported as history, so years of
 * past workouts neither notify coaches nor spend AI quota.
 */
export const RECENT_ACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

export function isRecentActivity(startDate: Date, now = Date.now()): boolean {
  return startDate.getTime() >= now - RECENT_ACTIVITY_MS;
}
