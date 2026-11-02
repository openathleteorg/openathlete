import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header and rows, empty for what is missing', () => {
    expect(toCsv(['a', 'b'], [[1, null]])).toBe('a,b\n1,');
  });

  it('quotes what would break a column', () => {
    expect(toCsv(['name'], [['Trail, "long"']])).toBe(
      'name\n"Trail, ""long"""',
    );
  });
});
