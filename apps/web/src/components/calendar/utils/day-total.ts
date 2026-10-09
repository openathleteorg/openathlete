import {
  PlannedDone,
  WeekTotals,
  formatCompactDuration,
  formatCompactKilometers,
} from './week-summary';

/** "45min / 1h05" done over planned, or the one of them there is */
function pair(values: PlannedDone, format: (value: number) => string) {
  if (!values.planned && !values.done) return null;
  if (!values.planned) return format(values.done);
  if (!values.done) return format(values.planned);
  return `${format(values.done)} / ${format(values.planned)}`;
}

/**
 * A day's volume in a few characters, for the week view's day headers:
 * "45min / 1h05 · 9 / 12 km". Done comes first, as in the week summary.
 */
export function formatDayTotal(totals: WeekTotals, locale?: string): string {
  const duration = pair(totals.duration, formatCompactDuration);
  const distance = pair(totals.distance, (meters) =>
    formatCompactKilometers(meters, locale),
  );
  return [duration, distance && `${distance} km`]
    .filter((part): part is string => !!part)
    .join(' · ');
}
