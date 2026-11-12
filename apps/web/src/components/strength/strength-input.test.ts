import { describe, expect, it } from 'vitest';

import { WORKOUT_DURATION_TYPE as D } from '@openathlete/shared';

import {
  formatSeconds,
  formatWork,
  parseQuickExercise,
  parseSeconds,
  parseWork,
} from './strength-input';

describe('parseSeconds', () => {
  it.each([
    ['90', 90],
    ['90s', 90],
    ['45"', 45],
    ["1'30", 90],
    ['1’30', 90],
    ["2'", 120],
    ['2min', 120],
    ['1:30', 90],
    ['', null],
    ['vite', null],
  ])('reads %s as %s', (text, seconds) => {
    expect(parseSeconds(text)).toBe(seconds);
  });

  it('writes rests back the same way', () => {
    expect([30, 60, 90, 125].map(formatSeconds)).toEqual([
      '30"',
      "1'",
      "1'30",
      "2'05",
    ]);
    expect(formatSeconds(null)).toBe('');
  });
});

describe('parseWork', () => {
  it('reads a bare number in the unit of the column', () => {
    expect(parseWork('12', D.REPS)).toEqual({ type: D.REPS, value: 12 });
    expect(parseWork('40', D.TIME)).toEqual({ type: D.TIME, value: 40 });
  });

  it('switches unit when one is typed', () => {
    expect(parseWork('45s', D.REPS)).toEqual({ type: D.TIME, value: 45 });
    expect(parseWork("1'", D.REPS)).toEqual({ type: D.TIME, value: 60 });
    expect(parseWork('20m', D.REPS)).toEqual({ type: D.DISTANCE, value: 20 });
    expect(parseWork('8 reps', D.TIME)).toEqual({ type: D.REPS, value: 8 });
    expect(parseWork('0', D.REPS)).toBeNull();
  });

  it('writes work back', () => {
    expect(formatWork({ type: D.TIME, value: 45 })).toBe('45"');
    expect(formatWork({ type: D.REPS, value: 8 })).toBe('8');
  });
});

describe('parseQuickExercise', () => {
  it('reads a whole exercise in one line', () => {
    expect(parseQuickExercise("Squat barre 4x8 @60kg r2'")).toEqual({
      query: 'squat barre',
      sets: 4,
      work: { type: D.REPS, value: 8 },
      load: 60,
      rest: 120,
    });
    expect(parseQuickExercise('gainage 3x45s r30')).toMatchObject({
      query: 'gainage',
      work: { type: D.TIME, value: 45 },
      rest: 30,
    });
    expect(parseQuickExercise('tractions 5x5')).toMatchObject({
      sets: 5,
      load: null,
      rest: null,
    });
    expect(
      parseQuickExercise('développé couché 3 x 10 @ 42,5 kg'),
    ).toMatchObject({
      query: 'developpe couche',
      load: 42.5,
    });
  });

  it('refuses what it cannot read', () => {
    expect(parseQuickExercise('squat')).toBeNull();
    expect(parseQuickExercise('squat 4x8 r vite')).toBeNull();
  });
});
