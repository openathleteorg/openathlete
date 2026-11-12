import { describe, expect, it } from 'vitest';

import { type DropRow, INDENT, projectDrop } from './drop';

// warmup, 6 x (effort, rest), cooldown — and a session ending on a repeat
const rows: DropRow[] = [
  { kind: 'step', id: 'warmup', parent: null },
  { kind: 'repeat', id: 'set', parent: null },
  { kind: 'step', id: 'effort', parent: 'set' },
  { kind: 'step', id: 'rest', parent: 'set' },
  { kind: 'end', id: 'set:end', parent: 'set' },
  { kind: 'step', id: 'cooldown', parent: null },
];
const endingOnRepeat: DropRow[] = [
  { kind: 'step', id: 'cooldown', parent: null },
  { kind: 'step', id: 'warmup', parent: null },
  { kind: 'repeat', id: 'set', parent: null },
  { kind: 'step', id: 'effort', parent: 'set' },
  { kind: 'step', id: 'rest', parent: 'set' },
  { kind: 'end', id: 'set:end', parent: 'set' },
];

describe('projectDrop', () => {
  it('puts a step dragged below the last repeat after it, not in it', () => {
    expect(projectDrop(endingOnRepeat, 'cooldown', 'set:end', 0)).toEqual({
      parent: null,
      index: 2,
      depth: 0,
    });
    expect(projectDrop(endingOnRepeat, 'cooldown', 'rest', 0)).toEqual({
      parent: null,
      index: 2,
      depth: 0,
    });
  });

  it('puts it in the repeat when dragged to the right', () => {
    expect(projectDrop(endingOnRepeat, 'cooldown', 'set:end', INDENT)).toEqual({
      parent: 'set',
      index: 2,
      depth: 1,
    });
  });

  it('takes a step out of a repeat when dragged to the left at its end', () => {
    expect(projectDrop(rows, 'rest', 'rest', -INDENT)).toEqual({
      parent: null,
      index: 2,
      depth: 0,
    });
    // Its own level otherwise
    expect(projectDrop(rows, 'rest', 'rest', 0)).toEqual({
      parent: 'set',
      index: 1,
      depth: 1,
    });
  });

  it('keeps a step between two steps of a repeat inside it', () => {
    expect(projectDrop(rows, 'warmup', 'effort', -INDENT)).toEqual({
      parent: 'set',
      index: 1,
      depth: 1,
    });
  });

  it('moves steps before and after repeats at the top level', () => {
    // The cool-down up to the very start
    expect(projectDrop(rows, 'cooldown', 'warmup', 0)).toEqual({
      parent: null,
      index: 0,
      depth: 0,
    });
    // Just below a repeat's header is its first step
    expect(projectDrop(rows, 'warmup', 'set', 0)).toEqual({
      parent: 'set',
      index: 0,
      depth: 1,
    });
    // Below its end, after it
    expect(projectDrop(rows, 'warmup', 'set:end', 0)).toEqual({
      parent: null,
      index: 1,
      depth: 0,
    });
  });

  it('moves a step of a repeat to the very start', () => {
    expect(projectDrop(rows, 'effort', 'warmup', 0)).toEqual({
      parent: null,
      index: 0,
      depth: 0,
    });
  });

  it('moves a repeat whole, never into another one', () => {
    expect(projectDrop(rows, 'set', 'cooldown', INDENT * 3)).toEqual({
      parent: null,
      index: 2,
      depth: 0,
    });
    expect(projectDrop(rows, 'set', 'warmup', 0)).toEqual({
      parent: null,
      index: 0,
      depth: 0,
    });
    expect(projectDrop(rows, 'set', 'set', 0)).toBeNull();
  });
});
