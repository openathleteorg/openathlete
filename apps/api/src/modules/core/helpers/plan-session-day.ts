/**
 * Days from the start of a plan week to a session planned on `dayOfWeek`
 * (0 = Sunday … 6 = Saturday). Weeks start on whatever day the athlete
 * starts the plan, so a session on an earlier weekday belongs to the end of
 * that week, never to the days before it.
 */
export function planSessionDayOffset(
  dayOfWeek: number,
  weekStartDay: number,
): number {
  return (((dayOfWeek - weekStartDay) % 7) + 7) % 7;
}
