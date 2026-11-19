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

  it('keeps a text that a spreadsheet would run as a formula a text', () => {
    expect(toCsv(['note'], [['=HYPERLINK("x")'], ['@SUM(A1)'], [-3]])).toBe(
      'note\n"\'=HYPERLINK(""x"")"\n\'@SUM(A1)\n-3',
    );
  });
});
