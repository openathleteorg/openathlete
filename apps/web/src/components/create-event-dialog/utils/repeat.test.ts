import { describe, expect, it } from 'vitest';

import { countRepeats } from './repeat';

// Tuesday 6 October 2026, 18:00 local
const START = new Date(2026, 9, 6, 18);

describe('countRepeats', () => {
  it('counts the occurrences until the end of the chosen day', () => {
    // Until Tuesday 3 November, end of day: 13, 20, 27 Oct and 3 Nov
    expect(countRepeats(START, 1, new Date(2026, 10, 3, 23, 59))).toBe(4);
    expect(countRepeats(START, 2, new Date(2026, 10, 3, 23, 59))).toBe(2);
  });

  it('stops at 90 days', () => {
    expect(countRepeats(START, 1, new Date(2027, 5, 1))).toBe(12);
  });

  it('counts nothing without a repetition or before the next one', () => {
    expect(countRepeats(START, 0, new Date(2026, 10, 3))).toBe(0);
    expect(countRepeats(START, 1, new Date(2026, 9, 12, 23))).toBe(0);
  });
});
