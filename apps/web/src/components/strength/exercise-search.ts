import type { ExerciseInfo } from './use-exercises';

export interface ExerciseFilters {
  bodyPart?: string | null;
  equipment?: string | null;
}

const fold = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Small words left out when comparing: "squat barre" is "squat à la barre" */
const SMALL = new Set([
  'a',
  'au',
  'aux',
  'la',
  'le',
  'les',
  'de',
  'du',
  'des',
  'd',
  'l',
  'en',
  'sur',
  'with',
  'the',
  'on',
  'of',
  'con',
  'el',
  'en',
  'del',
  'com',
  'do',
  'da',
  'no',
  'na',
  'alla',
  'al',
  'ai',
  'agli',
  'sul',
  'y',
  'e',
]);
const core = (text: string) =>
  text.split(/[\s'’-]+/).filter((word) => word && !SMALL.has(word));

/**
 * The exercises matching every word typed, in any order and without
 * accents, best first: a name starting with the query, drawn ones (the
 * athlete sees the movement), the ones picked lately, then shorter names.
 */
export function searchExercises(
  exercises: ExerciseInfo[],
  query: string,
  filters: ExerciseFilters = {},
  recent: string[] = [],
): ExerciseInfo[] {
  const words = fold(query)
    .split(/[\s,]+/)
    .filter(Boolean);
  const wanted = core(words.join(' '));
  const scored: { info: ExerciseInfo; score: number }[] = [];
  for (const info of exercises) {
    if (filters.bodyPart && info.bodyPart !== filters.bodyPart) continue;
    if (filters.equipment && info.equipment !== filters.equipment) continue;
    const name = fold(info.name);
    if (!words.every((word) => name.includes(word))) continue;
    let score = 0;
    const named = core(name);
    // The name starts with the first word typed, the others follow in order
    if (wanted.length && named[0]?.startsWith(wanted[0])) score += 20;
    let at = 0;
    const inOrder = wanted.every((word) => {
      const found = named.findIndex(
        (part, i) => i >= at && part.startsWith(word),
      );
      at = found + 1;
      return found >= 0;
    });
    if (wanted.length && inOrder) score += 10;
    // "squat barre" is the plain barbell squat before its variants
    if (wanted.length) score -= Math.max(0, named.length - wanted.length) * 4;
    if (info.frames) score += 22;
    if (info.popular) score += 18;
    if (info.custom) score += 25;
    const used = recent.indexOf(info.ref);
    if (used >= 0) score += 30 - Math.min(used, 20);
    score -= name.length / 10;
    scored.push({ info, score });
  }
  return scored.sort((a, b) => b.score - a.score).map(({ info }) => info);
}
