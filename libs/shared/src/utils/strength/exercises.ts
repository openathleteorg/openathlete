import { EXERCISE_INDEX } from './exercise-index';

/** The body parts of the bundled catalog */
export const EXERCISE_BODY_PARTS = [
  'back',
  'cardio',
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist',
] as const;
export type ExerciseBodyPart = (typeof EXERCISE_BODY_PARTS)[number];

export interface CatalogEntry {
  /** As workout steps store it: "c:<id>" */
  ref: string;
  /** English name */
  name: string;
  bodyPart: string;
  equipment: string;
}

let entries: CatalogEntry[] | undefined;
let byRef: Map<string, CatalogEntry> | undefined;

function load() {
  if (!entries || !byRef) {
    entries = EXERCISE_INDEX.map(([id, name, bodyPart, equipment]) => ({
      ref: `c:${id}`,
      name,
      bodyPart,
      equipment,
    }));
    byRef = new Map(entries.map((entry) => [entry.ref, entry]));
  }
  return { entries, byRef };
}

/** An exercise of the bundled catalog by its ref ("c:<id>"), if it exists */
export function catalogExercise(ref: string): CatalogEntry | undefined {
  return load().byRef.get(ref);
}

/** Every exercise of the bundled catalog, by id */
export function catalogExercises(): CatalogEntry[] {
  return load().entries;
}
