import { button, heading, paragraph, quotes, stats } from './blocks';
import { renderEmail } from './layout';

describe('renderEmail', () => {
  it.each([
    ['ES', 'es', 'acción en tu cuenta'],
    ['EN', 'en', 'action on your OpenAthlete account'],
    ['FR', 'fr', 'action sur votre compte'],
    ['IT', 'it', 'azione sul tuo account'],
    ['PT_BR', 'pt-BR', 'ação na sua conta'],
    ['DE', 'de', 'Aktion in deinem OpenAthlete-Konto'],
  ] as const)(
    'renders the %s language and footer',
    (language, htmlLanguage, footer) => {
      const { html, text } = renderEmail({
        language,
        title: 'Test',
        blocks: [paragraph('Test')],
      });
      expect(html).toContain(`<html lang="${htmlLanguage}">`);
      expect(html).toContain(footer);
      expect(text).toContain(footer);
    },
  );

  it('escapes what it is given and defaults to French', () => {
    const { html } = renderEmail({
      title: '<script>bad</script>',
      preview: '"preview"',
      blocks: [
        paragraph('<img src=x onerror=alert(1)>'),
        quotes([{ body: '<b>hi</b>', caption: 'Ana' }]),
      ],
    });
    expect(html).toContain('<html lang="fr">');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>hi</b>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('puts the preview text first in the body, hidden', () => {
    const { html } = renderEmail({
      title: 'Title',
      preview: 'One step left',
      blocks: [paragraph('Body')],
    });
    const body = html.slice(html.indexOf('<body'));
    expect(body.indexOf('One step left')).toBeLessThan(body.indexOf('Body'));
    expect(body).toMatch(/display:none[^>]*>One step left/);
  });

  it('writes a plain text version of every block', () => {
    const { text } = renderEmail({
      title: 'Title',
      blocks: [
        heading('148 sessions imported'),
        paragraph('Hi Ana,', ' see ', {
          href: 'https://x.org/a',
          label: 'this',
        }),
        stats([
          { label: 'Distance', value: '162 km' },
          { label: 'Sessions', value: '14' },
        ]),
        button({ href: 'https://x.org/b', label: 'Open' }),
      ],
    });
    expect(text).toContain('148 sessions imported');
    expect(text).toContain('Hi Ana, see this (https://x.org/a)');
    expect(text).toContain('Distance: 162 km\nSessions: 14');
    expect(text).toContain('Open: https://x.org/b');
    expect(text).not.toContain('<');
  });

  it('links to unsubscribing and to the settings in a list footer', () => {
    const { html, text } = renderEmail({
      language: 'EN',
      title: 'Title',
      blocks: [paragraph('Body')],
      footer: {
        kind: 'list',
        reason: 'You get tips because you have an account.',
        unsubscribeUrl: 'https://app.example/emails/unsubscribe?token=abc',
        preferencesUrl: 'https://app.example/dashboard/settings?tab=profile',
      },
    });
    expect(html).toContain(
      'href="https://app.example/emails/unsubscribe?token=abc"',
    );
    expect(html).toContain('Stop these emails');
    expect(text).toContain(
      'Stop these emails: https://app.example/emails/unsubscribe?token=abc',
    );
    expect(text).toContain('You get tips because you have an account.');
  });

  it('draws a letter without the card or logo', () => {
    const card = renderEmail({ title: 'T', blocks: [paragraph('x')] });
    const letter = renderEmail({
      title: 'T',
      blocks: [paragraph('x')],
      variant: 'letter',
    });
    expect(card.html).toContain('logo_dark.png');
    expect(letter.html).not.toContain('logo_dark.png');
  });
});
