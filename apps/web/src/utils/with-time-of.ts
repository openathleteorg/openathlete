/**
 * The day picked, at the time of the value it replaces. A day picker gives
 * midnight, which would erase a session's start time when it is moved.
 */
export function withTimeOf(day: Date, previous: Date | undefined): Date {
  const next = new Date(day);
  if (previous) {
    next.setHours(
      previous.getHours(),
      previous.getMinutes(),
      previous.getSeconds(),
      previous.getMilliseconds(),
    );
  }
  return next;
}
