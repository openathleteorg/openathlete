import { layout } from './layout';

describe('localized email layout', () => {
  it.each([
    ['ES', 'es', 'Todos los derechos reservados'],
    ['EN', 'en', 'All rights reserved'],
    ['FR', 'fr', 'Tous droits réservés'],
    ['IT', 'it', 'Tutti i diritti riservati'],
  ] as const)(
    'renders the %s language and footer',
    (language, htmlLanguage, footer) => {
      const html = layout({
        language,
        title: 'Test',
        contentHtml: '<p>Test</p>',
      });
      expect(html).toContain(`<html lang="${htmlLanguage}">`);
      expect(html).toContain(footer);
    },
  );

  it('preserves escaping and the existing default language', () => {
    const html = layout({
      title: '<script>bad</script>',
      preview: '"preview"',
      contentHtml: '<p>Content</p>',
    });
    expect(html).toContain('<html lang="fr">');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<p>Content</p>');
  });
});
