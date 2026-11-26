import type { SetWork, StrengthSet, UnitSystem } from '@openathlete/shared';
import { KG_TO_LB, M_TO_YD, WORKOUT_DURATION_TYPE } from '@openathlete/shared';

/**
 * What coaches type in a set table: rests as "90", "1'30" or "2'", work as
 * "12" (reps) or "45s", and a whole exercise as "squat 4x8 @60kg r2'".
 */

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’′`]/g, "'")
    .replace(/[″”]/g, '"')
    .trim();

/** Seconds: "90", "90s", "1'30", "1:30", "2'", "2min"; null if unreadable */
export function parseSeconds(text: string): number | null {
  const value = fold(text).replace(/\s+/g, '');
  if (!value) return null;
  let match: RegExpMatchArray | null;
  if ((match = value.match(/^(\d+)(?:s|sec|")?$/))) return Number(match[1]);
  if ((match = value.match(/^(\d+)(?:'|min|m)(?:(\d{1,2})(?:s|")?)?$/))) {
    return Number(match[1]) * 60 + Number(match[2] ?? 0);
  }
  if ((match = value.match(/^(\d+):(\d{2})$/))) {
    return Number(match[1]) * 60 + Number(match[2]);
  }
  return null;
}

/** 45", 1'30, 2' */
export function formatSeconds(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}"`;
  return rest ? `${minutes}'${String(rest).padStart(2, '0')}` : `${minutes}'`;
}

/** "12" is reps; "45s", "1'" a hold; "20m" metres ("20yd" yards); null if unreadable */
export function parseWork(
  text: string,
  current: SetWork['type'],
  unitSystem: UnitSystem = 'METRIC',
): SetWork | null {
  const value = fold(text).replace(/\s+/g, '');
  if (!value) return null;
  if (/^\d+$/.test(value)) {
    const number = Number(value);
    if (number <= 0) return null;
    // A bare number keeps the unit the column shows
    if (current === WORKOUT_DURATION_TYPE.TIME)
      return { type: current, value: number };
    if (current === WORKOUT_DURATION_TYPE.DISTANCE) {
      return {
        type: current,
        value:
          unitSystem === 'IMPERIAL'
            ? Math.max(1, Math.round(number / M_TO_YD))
            : number,
      };
    }
    return { type: WORKOUT_DURATION_TYPE.REPS, value: number };
  }
  const reps = value.match(/^(\d+)(?:reps?|x)$/);
  if (reps) return { type: WORKOUT_DURATION_TYPE.REPS, value: Number(reps[1]) };
  const yards = value.match(/^(\d+)(?:yds?|yards?)$/);
  if (yards && Number(yards[1]) >= 5) {
    return {
      type: WORKOUT_DURATION_TYPE.DISTANCE,
      value: Math.max(1, Math.round(Number(yards[1]) / M_TO_YD)),
    };
  }
  const meters = value.match(/^(\d+)(?:m|mtr)$/);
  if (meters && Number(meters[1]) >= 5 && !value.endsWith('min')) {
    return { type: WORKOUT_DURATION_TYPE.DISTANCE, value: Number(meters[1]) };
  }
  const seconds = parseSeconds(value);
  return seconds ? { type: WORKOUT_DURATION_TYPE.TIME, value: seconds } : null;
}

export function formatWork(
  work: SetWork,
  unitSystem: UnitSystem = 'METRIC',
): string {
  switch (work.type) {
    case WORKOUT_DURATION_TYPE.TIME:
      return formatSeconds(work.value);
    case WORKOUT_DURATION_TYPE.DISTANCE:
      return unitSystem === 'IMPERIAL'
        ? `${Math.round(work.value * M_TO_YD)}yd`
        : `${work.value}m`;
    default:
      return String(work.value);
  }
}

export interface QuickExercise {
  /** The words to find the exercise by */
  query: string;
  sets: number;
  work: SetWork;
  load: number | null;
  rest: number | null;
}

/**
 * "squat 4x8 @60kg r2'", "gainage 3x45s r30", "tractions 5x5": the
 * exercise words, then sets x work, then the load and rest if given.
 */
export function parseQuickExercise(
  text: string,
  unitSystem: UnitSystem = 'METRIC',
): QuickExercise | null {
  const value = fold(text);
  const match = value.match(
    /^(.+?)\s+(\d{1,2})\s*[x×]\s*([0-9][0-9'":sminyd]*)(?:\s*@\s*(\d+(?:[.,]\d+)?)\s*(kg|lbs?)?)?(?:\s+(?:r|rest|recup|repos)\s*([0-9][0-9'":smin]*))?$/,
  );
  if (!match) return null;
  const sets = Number(match[2]);
  const work = parseWork(match[3], WORKOUT_DURATION_TYPE.REPS, unitSystem);
  if (!work || sets < 1 || sets > 99) return null;
  const rest = match[6] ? parseSeconds(match[6]) : null;
  if (match[6] && rest === null) return null;
  const rawLoad = match[4] ? Number(match[4].replace(',', '.')) : null;
  const loadUnit = match[5];
  const isImperialLoad = loadUnit
    ? loadUnit.startsWith('lb')
    : unitSystem === 'IMPERIAL';
  const load =
    rawLoad === null
      ? null
      : isImperialLoad
        ? Number((rawLoad / KG_TO_LB).toFixed(2))
        : rawLoad;
  return {
    query: match[1].trim(),
    sets,
    work,
    load,
    rest,
  };
}

export function quickSets(quick: QuickExercise): StrengthSet[] {
  return Array.from({ length: quick.sets }, () => ({
    work: { ...quick.work },
    load: quick.load,
    rpe: null,
    rest: quick.rest,
  }));
}
