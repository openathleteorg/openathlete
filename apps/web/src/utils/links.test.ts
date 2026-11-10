import { describe, expect, it } from 'vitest';

import { splitLinks } from './links';

describe('splitLinks', () => {
  it('keeps text without links whole', () => {
    expect(splitLinks('Easy week')).toEqual([
      { type: 'text', value: 'Easy week' },
    ]);
  });

  it('finds links among text and leaves the final punctuation out', () => {
    expect(
      splitLinks('Drills: https://youtu.be/abc?t=30. Then www.example.com!'),
    ).toEqual([
      { type: 'text', value: 'Drills: ' },
      {
        type: 'link',
        value: 'https://youtu.be/abc?t=30',
        href: 'https://youtu.be/abc?t=30',
      },
      { type: 'text', value: '. Then ' },
      {
        type: 'link',
        value: 'www.example.com',
        href: 'https://www.example.com',
      },
      { type: 'text', value: '!' },
    ]);
  });

  it('keeps the parentheses of an address', () => {
    expect(splitLinks('(see https://en.wikipedia.org/wiki/VO2_(max))')).toEqual(
      [
        { type: 'text', value: '(see ' },
        {
          type: 'link',
          value: 'https://en.wikipedia.org/wiki/VO2_(max)',
          href: 'https://en.wikipedia.org/wiki/VO2_(max)',
        },
        { type: 'text', value: ')' },
      ],
    );
  });

  it('never makes a link of another scheme', () => {
    expect(splitLinks('javascript:alert(1)')).toEqual([
      { type: 'text', value: 'javascript:alert(1)' },
    ]);
  });
});
