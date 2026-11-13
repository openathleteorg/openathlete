import { describe, expect, it } from 'vitest';

import { adoptLegacyLocaleCookie } from './locale-cookie';

/** A minimal cookie jar: reads join the cookies, writes add one. */
function jar(initial: string[]) {
  const cookies = [...initial];
  return {
    get cookie() {
      return cookies.join('; ');
    },
    set cookie(value: string) {
      cookies.push(value.split(';')[0]);
    },
  };
}

describe('locale cookie', () => {
  it("keeps the app's own language over a parent domain's", () => {
    // The parent domain's cookie comes first, the app's own last
    const doc = jar(['PARAGLIDE_LOCALE=en', 'PARAGLIDE_LOCALE=fr']);
    adoptLegacyLocaleCookie(doc);
    expect(doc.cookie).toContain('OA_LOCALE=fr');
  });

  it('leaves a language already chosen under the new name', () => {
    const doc = jar(['OA_LOCALE=it', 'PARAGLIDE_LOCALE=fr']);
    adoptLegacyLocaleCookie(doc);
    expect(doc.cookie).not.toContain('OA_LOCALE=fr');
  });

  it('accepts Brazilian Portuguese from the legacy cookie', () => {
    const doc = jar(['PARAGLIDE_LOCALE=pt-BR']);
    adoptLegacyLocaleCookie(doc);
    expect(doc.cookie).toContain('OA_LOCALE=pt-BR');
  });

  it('accepts German from the legacy cookie', () => {
    const doc = jar(['PARAGLIDE_LOCALE=de']);
    adoptLegacyLocaleCookie(doc);
    expect(doc.cookie).toContain('OA_LOCALE=de');
  });

  it('ignores anything that is not a supported language', () => {
    const doc = jar(['PARAGLIDE_LOCALE=nl']);
    adoptLegacyLocaleCookie(doc);
    expect(doc.cookie).not.toContain('OA_LOCALE');
  });
});
