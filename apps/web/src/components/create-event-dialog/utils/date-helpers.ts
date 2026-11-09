/**
 * Where a new event starts on its day: planned sessions at midday, as the
 * MCP tools place them, and a logged activity at 08:00.
 */
export function getStartDate(date?: Date, planned = false): Date | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  d.setHours(planned ? 12 : 8, 0, 0, 0);
  return d;
}

export function getEndDate(date?: Date, startDate?: Date): Date | undefined {
  if (!date && !startDate) return undefined;
  // If we have a startDate, calculate endDate from it + 1 hour
  if (startDate) {
    const end = new Date(startDate);
    end.setSeconds(end.getSeconds() + 3600); // Add 1 hour (3600 seconds)
    return end;
  }
  // Fallback: use the date parameter and add 1 hour
  if (date) {
    const d = new Date(date);
    d.setHours(d.getHours() + 1); // Add 1 hour
    return d;
  }
  return undefined;
}
