import { describe, expect, it } from 'vitest';

import { exerciseRefSchema } from '../../types/dtos/core/workout.dto';
import { EXERCISE_INDEX } from './exercise-index';
import {
  EXERCISE_BODY_PARTS,
  catalogExercise,
  catalogExercises,
} from './exercises';

// That the index equals the web catalog is tested in apps/api, which can read
// the catalog file (providers-sync/mapping/garmin.mapper.spec.ts)
describe('exercise index', () => {
  it('is in id order', () => {
    const ids = EXERCISE_INDEX.map(([id]) => id);
    expect(ids).toEqual([...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  });

  it('has unique ids that are valid exercise refs', () => {
    const ids = EXERCISE_INDEX.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(exerciseRefSchema.safeParse(`c:${id}`).success).toBe(true);
    }
  });

  it('uses the body parts of EXERCISE_BODY_PARTS', () => {
    const parts = [...new Set(EXERCISE_INDEX.map(([, , part]) => part))].sort();
    expect(parts).toEqual([...EXERCISE_BODY_PARTS]);
  });
});

describe('catalogExercise', () => {
  it('finds an exercise by its c: ref', () => {
    expect(catalogExercise('c:air-bike')).toEqual({
      ref: 'c:air-bike',
      name: 'Air bike',
      bodyPart: 'waist',
      equipment: 'body weight',
    });
  });

  it('does not find unknown refs, custom refs or bare ids', () => {
    expect(catalogExercise('c:back-squatt')).toBeUndefined();
    expect(catalogExercise('u:1')).toBeUndefined();
    expect(catalogExercise('air-bike')).toBeUndefined();
  });

  it('lists every exercise, each findable by its ref', () => {
    const all = catalogExercises();
    expect(all).toHaveLength(EXERCISE_INDEX.length);
    for (const entry of all) expect(catalogExercise(entry.ref)).toBe(entry);
  });
});
