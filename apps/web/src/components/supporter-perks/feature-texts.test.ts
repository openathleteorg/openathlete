import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { Feature } from '@openathlete/shared';

import { featureMessageKey } from './feature-texts';

const LOCALES = ['en', 'fr', 'it', 'es', 'pt-BR', 'de', 'pl', 'nl'];

const catalogue = (locale: string): Record<string, string> =>
  JSON.parse(
    readFileSync(
      resolve(__dirname, `../../../messages/${locale}.json`),
      'utf8',
    ),
  );

describe('feature texts', () => {
  it.each(LOCALES)(
    'gives every feature a paywall title and body in %s',
    (locale) => {
      const messages = catalogue(locale);
      for (const feature of Object.values(Feature)) {
        const key = featureMessageKey(feature);
        expect(messages[`${key}_title`], `${key}_title`).toBeTruthy();
        expect(messages[`${key}_body`], `${key}_body`).toBeTruthy();
      }
    },
  );

  it('never says premium: the tone thanks rather than punishes', () => {
    for (const locale of LOCALES) {
      const messages = catalogue(locale);
      for (const [key, value] of Object.entries(messages)) {
        if (key.startsWith('feature_')) {
          expect(value.toLowerCase(), key).not.toContain('premium');
        }
      }
    }
  });
});
