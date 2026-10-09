/**
 * The local day a date field holds: either a YYYY-MM-DD input, which
 * `new Date()` would read as UTC midnight (the evening before in the
 * Americas), or the ISO instant of the date picker, set at local noon.
 */
function localDay(value: string): [number, number, number] {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return [year, month - 1, day];
  }
  const date = new Date(value);
  return [date.getFullYear(), date.getMonth(), date.getDate()];
}

/** The first millisecond of a date field's day, local time */
export function startOfLocalDateInput(value: string): Date {
  const [year, month, day] = localDay(value);
  return new Date(year, month, day);
}

/** The last millisecond of a date field's day, local time */
export function endOfLocalDateInput(value: string): Date {
  const [year, month, day] = localDay(value);
  return new Date(year, month, day, 23, 59, 59, 999);
}
