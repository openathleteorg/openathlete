/**
 * A YYYY-MM-DD date input as a local day. `new Date('2026-10-05')` reads it as
 * UTC midnight, which is the evening before in the Americas.
 */
export function startOfLocalDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The last millisecond of a YYYY-MM-DD date input, as a local day */
export function endOfLocalDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
