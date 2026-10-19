import { formatRpe } from './rpe';

describe('formatRpe', () => {
  it('reads the stored 0-1 value on a 10-point scale', () => {
    expect(formatRpe(0.6)).toBe('6/10');
    expect(formatRpe(0.75)).toBe('7.5/10');
    expect(formatRpe(1)).toBe('10/10');
    expect(formatRpe(0)).toBe('0/10');
  });

  it('never shows floating point noise', () => {
    expect(formatRpe(0.7)).toBe('7/10');
    expect(formatRpe(0.3)).toBe('3/10');
    expect(formatRpe(0.1 + 0.2)).toBe('3/10');
  });
});
