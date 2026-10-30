import { describe, expect, it } from 'vitest';

import { matchesQuery } from './finder';

describe('matchesQuery', () => {
  it('ignores case and accents', () => {
    expect(matchesQuery('Métriques', 'metri')).toBe(true);
    expect(matchesQuery('Zoé Müller', 'ZOE muller')).toBe(true);
  });

  it('accepts words in any order', () => {
    expect(matchesQuery('Ada Lovelace', 'lovelace ada')).toBe(true);
  });

  it('needs every word', () => {
    expect(matchesQuery('Ada Lovelace', 'ada turing')).toBe(false);
  });

  it('matches everything on an empty query', () => {
    expect(matchesQuery('Calendar', '  ')).toBe(true);
  });
});
