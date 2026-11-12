import { describe, expect, it } from 'vitest';

import { searchExercises } from './exercise-search';
import type { ExerciseInfo } from './use-exercises';

const info = (
  ref: string,
  name: string,
  extra: Partial<ExerciseInfo> = {},
): ExerciseInfo => ({
  ref,
  name,
  bodyPart: 'upper legs',
  equipment: 'barbell',
  target: 'quads',
  secondary: [],
  frames: null,
  mediaUrl: null,
  steps: [],
  custom: null,
  ...extra,
});

const all = [
  info('c:front-squat', 'Squat avant à la barre'),
  info('c:back-squat', 'Squat à la barre', { frames: ['a', 'b'] }),
  info('c:goblet-squat', 'Squat goblet', { equipment: 'kettlebell' }),
  info('c:bench', 'Développé couché', { bodyPart: 'chest' }),
  info('u:3', 'Squat pistolet sur box', { custom: {} as never }),
];
const refs = (list: ExerciseInfo[]) => list.map((exercise) => exercise.ref);

describe('searchExercises', () => {
  it('matches every word, ignoring accents and case', () => {
    expect(refs(searchExercises(all, 'barre squat'))).toEqual([
      'c:back-squat',
      'c:front-squat',
    ]);
    expect(refs(searchExercises(all, 'DEVELOPPE'))).toEqual(['c:bench']);
  });

  it('filters by body part and equipment', () => {
    expect(refs(searchExercises(all, '', { bodyPart: 'chest' }))).toEqual([
      'c:bench',
    ]);
    expect(
      refs(searchExercises(all, 'squat', { equipment: 'kettlebell' })),
    ).toEqual(['c:goblet-squat']);
  });

  it('puts custom, recent and drawn exercises first', () => {
    const found = refs(searchExercises(all, 'squat', {}, ['c:goblet-squat']));
    expect(found[0]).toBe('c:goblet-squat');
    expect(found.slice(1, 3).sort()).toEqual(['c:back-squat', 'u:3']);
    expect(found[3]).toBe('c:front-squat');
  });

  it('puts the usual exercise first for a common word', () => {
    const squats = [
      info('c:hack', 'Hack squat à la barre', { frames: ['a', 'b'] }),
      info('c:front', 'Squat avant à la barre', { frames: ['a', 'b'] }),
      info('c:full', 'Squat complet à la barre', {
        frames: ['a', 'b'],
        popular: true,
      }),
    ];
    expect(refs(searchExercises(squats, 'squat barre'))[0]).toBe('c:full');
    expect(refs(searchExercises(squats, 'squat'))[0]).toBe('c:full');
  });

  it('prefers the plain exercise to its variants, small words aside', () => {
    const squats = [
      info('c:low-bar', 'Squat barre basse'),
      info('c:back', 'Squat à la barre', { frames: ['a', 'b'] }),
      info('c:pause', 'Squat à la barre avec pause'),
    ];
    expect(refs(searchExercises(squats, 'squat barre'))).toEqual([
      'c:back',
      'c:low-bar',
      'c:pause',
    ]);
  });
});
