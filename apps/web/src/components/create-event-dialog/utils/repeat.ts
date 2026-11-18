import { addDays } from 'date-fns';

import { REPEAT_MAX_DAYS } from '@openathlete/shared';

/** The "Does not repeat" option of the repeat select */
export const NO_REPEAT = '0';

/**
 * How many more occurrences a session repeated every `everyWeeks` weeks gets
 * until `until` (its day included), within the 90 days the API allows.
 */
export function countRepeats(
  start: Date,
  everyWeeks: number,
  until: Date,
): number {
  return countRepeatsEveryDays(start, 7 * everyWeeks, until);
}

/** The same, for a repetition every `everyDays` days */
export function countRepeatsEveryDays(
  start: Date,
  everyDays: number,
  until: Date,
): number {
  if (everyDays < 1) return 0;
  const last = Math.min(
    until.getTime(),
    addDays(start, REPEAT_MAX_DAYS).getTime(),
  );
  let count = 0;
  for (
    let next = addDays(start, everyDays);
    next.getTime() <= last;
    next = addDays(next, everyDays)
  ) {
    count++;
  }
  return count;
}

/** The default end of a repetition: eight weeks after the session */
export const defaultRepeatUntil = (start: Date) => addDays(start, 56);
