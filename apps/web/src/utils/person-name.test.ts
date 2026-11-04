import { describe, expect, it } from 'vitest';

import { isPlausiblePersonName } from '@openathlete/shared';

describe('isPlausiblePersonName', () => {
  it.each([
    'Ana',
    'Jean-Pierre',
    "O'Connor",
    'J.-P.',
    'García Márquez',
    'Zoë',
    'Nguyễn',
    '김민준',
    'Ахмед',
    'Saint Exupéry',
  ])('accepts %s', (name) => {
    expect(isPlausiblePersonName(name)).toBe(true);
  });

  it.each([
    '',
    '   ',
    '⚡5.000 TL Alın',
    'Gagnez 500€',
    'https://spam.example',
    'www.casino',
    'bit.ly',
    'visit site.com',
    'Ana 2',
    'a'.repeat(51),
  ])('refuses %j', (name) => {
    expect(isPlausiblePersonName(name)).toBe(false);
  });
});
