import { describe, expect, it } from 'vitest';

import { transparencyPageUrl } from './transparency';

describe('transparencyPageUrl', () => {
  it('serves English at the root and other languages under their prefix', () => {
    expect(transparencyPageUrl('en')).toBe(
      'https://openathlete.org/transparency',
    );
    expect(transparencyPageUrl('fr')).toBe(
      'https://openathlete.org/fr/transparency',
    );
    expect(transparencyPageUrl('pt-BR')).toBe(
      'https://openathlete.org/pt-br/transparency',
    );
  });
});
