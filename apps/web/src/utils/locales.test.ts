import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { getDateFnsLocale, localizeDatePattern } from './locales';

const day = new Date(2026, 10, 12);
const write = (pattern: string, locale: string) =>
  format(day, localizeDatePattern(pattern, locale), {
    locale: getDateFnsLocale(locale),
  });

describe('localizeDatePattern', () => {
  it('writes German dates with the day dot and the weekday comma', () => {
    expect(write('EEEE d MMMM', 'de')).toBe('Donnerstag, 12. November');
    expect(write('d MMMM yyyy', 'de')).toBe('12. November 2026');
    expect(write('d MMM', 'de')).toBe('12. Nov.');
  });

  it('writes Polish dates with the weekday comma and the genitive month', () => {
    expect(write('EEEE d MMMM', 'pl')).toBe('czwartek, 12 listopada');
    expect(write('d MMMM yyyy', 'pl')).toBe('12 listopada 2026');
  });

  it('leaves the other languages as written', () => {
    expect(write('EEEE d MMMM', 'fr')).toBe('jeudi 12 novembre');
    expect(write('d MMM', 'en')).toBe('12 Nov');
    expect(write('EEEE d MMMM', 'nl')).toBe('donderdag 12 november');
  });
});
