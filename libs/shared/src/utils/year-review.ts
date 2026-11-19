/**
 * The year review comes out every year on 10 December and stays until
 * 2 January. In those first days of January it still shows the year that
 * just ended: a review of 2026 opened on 1 January 2027 is about 2026.
 */
const OPENS_ON_DECEMBER_DAY = 10;
const CLOSES_AFTER_JANUARY_DAY = 2;

/**
 * The year whose review is out on this date, or null outside the window.
 * Read on the athlete's own calendar: pass a date whose local fields are
 * theirs (the browser's clock in the app).
 */
export function yearReviewYear(now: Date): number | null {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  if (month === 11 && day >= OPENS_ON_DECEMBER_DAY) return year;
  if (month === 0 && day <= CLOSES_AFTER_JANUARY_DAY) return year - 1;
  return null;
}

/**
 * Whether the athlete already opened, or put off, the review of `year`. Any
 * time since July counts: last year's review closed on 2 January.
 */
export function isYearReviewSeen(
  seenAt: Date | string | null | undefined,
  year: number,
): boolean {
  return Boolean(seenAt) && new Date(seenAt!) >= new Date(year, 6, 1);
}
