/**
 * RPE as people and models read it. It is stored from 0 to 1; prompts say
 * "6/10", rounded to a tenth so 0.7 never reads 7.000000000000001.
 */
export function formatRpe(rpe: number): string {
  return `${Math.round(rpe * 100) / 10}/10`;
}
