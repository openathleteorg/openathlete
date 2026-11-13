// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rememberLanguageChoice, saveLanguageChoice } from './language-choice';

const api = vi.hoisted(() => ({ updateLanguage: vi.fn() }));

vi.mock('@/api/user/user.api', () => ({
  UserAPI: { updateLanguage: api.updateLanguage },
}));

describe('saveLanguageChoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('keeps the saved language when nobody chose one on this device', async () => {
    // The app shows its default locale (en): that is no choice
    await saveLanguageChoice('ES', '');
    expect(api.updateLanguage).not.toHaveBeenCalled();
  });

  it('saves a language picked before signing in, once', async () => {
    rememberLanguageChoice('it');
    await saveLanguageChoice('FR', '');
    expect(api.updateLanguage).toHaveBeenCalledWith('IT');

    api.updateLanguage.mockClear();
    await saveLanguageChoice('FR', '');
    expect(api.updateLanguage).not.toHaveBeenCalled();
  });

  it('maps Brazilian Portuguese to the API code', async () => {
    rememberLanguageChoice('pt-BR');
    await saveLanguageChoice('EN', '');
    expect(api.updateLanguage).toHaveBeenCalledWith('PT_BR');
  });

  it('accepts a pt-BR language link', async () => {
    await saveLanguageChoice('EN', '?lang=pt-BR');
    expect(api.updateLanguage).toHaveBeenCalledWith('PT_BR');
  });

  it('maps German to the API code', async () => {
    await saveLanguageChoice('EN', '?lang=de');
    expect(api.updateLanguage).toHaveBeenCalledWith('DE');
  });

  it('does nothing when the choice is already saved', async () => {
    rememberLanguageChoice('es');
    await saveLanguageChoice('ES', '');
    expect(api.updateLanguage).not.toHaveBeenCalled();
  });

  it('prefers a ?lang= link, and ignores unknown languages', async () => {
    rememberLanguageChoice('it');
    await saveLanguageChoice('FR', '?lang=en');
    expect(api.updateLanguage).toHaveBeenCalledWith('EN');

    api.updateLanguage.mockClear();
    await saveLanguageChoice('FR', '?lang=nl');
    expect(api.updateLanguage).not.toHaveBeenCalled();
  });
});
