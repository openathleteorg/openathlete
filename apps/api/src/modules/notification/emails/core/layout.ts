import type { EmailLanguage } from '@openathlete/shared';

import { Block } from './blocks';
import { brand } from './brand';
import { escapeAttribute, escapeHtml } from './utils';

const htmlLanguages: Record<EmailLanguage, string> = {
  FR: 'fr',
  EN: 'en',
  IT: 'it',
  ES: 'es',
  PT_BR: 'pt-BR',
};

const footers = {
  FR: {
    account:
      'Vous recevez cet email suite à une action sur votre compte OpenAthlete.',
    unsubscribe: 'Ne plus recevoir ces emails',
    preferences: 'Gérer mes emails',
  },
  EN: {
    account:
      'You received this email following an action on your OpenAthlete account.',
    unsubscribe: 'Stop these emails',
    preferences: 'Email settings',
  },
  IT: {
    account:
      'Ricevi questa email in seguito a un’azione sul tuo account OpenAthlete.',
    unsubscribe: 'Non ricevere più queste email',
    preferences: 'Gestisci le email',
  },
  ES: {
    account: 'Recibes este correo por una acción en tu cuenta de OpenAthlete.',
    unsubscribe: 'No recibir más estos correos',
    preferences: 'Gestionar mis correos',
  },
  PT_BR: {
    account: 'Você recebeu este e-mail após uma ação na sua conta OpenAthlete.',
    unsubscribe: 'Não receber mais estes e-mails',
    preferences: 'Gerenciar meus e-mails',
  },
} as const satisfies Record<EmailLanguage, Record<string, string>>;

/** Why the email came, at its foot */
export type EmailFooter =
  /** Sent because of something done on the account: no way out needed */
  | { kind: 'account' }
  /** One of the emails a person can turn off, with the links to do so */
  | {
      kind: 'list';
      reason: string;
      unsubscribeUrl: string;
      preferencesUrl: string;
    };

export interface RenderedEmail {
  html: string;
  text: string;
}

/**
 * Lays an email out. `card` frames it with the logo, for the emails of the
 * product; `letter` is a plain page, for the ones a person writes.
 */
export function renderEmail({
  language = 'FR',
  title,
  preview,
  blocks,
  footer = { kind: 'account' },
  variant = 'card',
}: {
  language?: EmailLanguage;
  title: string;
  preview?: string;
  blocks: Block[];
  footer?: EmailFooter;
  variant?: 'card' | 'letter';
}): RenderedEmail {
  const t = footers[language];
  const content = blocks.map((block) => block.html).join('\n');

  const footerLines =
    footer.kind === 'account'
      ? [escapeHtml(t.account)]
      : [
          escapeHtml(footer.reason),
          `<a href="${escapeAttribute(footer.unsubscribeUrl)}" style="color:${brand.muted};text-decoration:underline;">${escapeHtml(t.unsubscribe)}</a>&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${escapeAttribute(footer.preferencesUrl)}" style="color:${brand.muted};text-decoration:underline;">${escapeHtml(t.preferences)}</a>`,
        ];
  const footerHtml = footerLines
    .map(
      (line) =>
        `<p style="margin:0 0 6px 0;font-size:12px;line-height:18px;color:${brand.muted};">${line}</p>`,
    )
    .join('');

  const band = brand.logoColors
    .map(
      (color) =>
        `<td width="25%" height="4" bgcolor="${color}" style="height:4px;line-height:4px;font-size:4px;background:${color};">&nbsp;</td>`,
    )
    .join('');

  const card = `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${brand.card};border:1px solid ${brand.border};border-radius:14px;overflow:hidden;">
            <tr><td style="padding:0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>${band}</tr></table></td></tr>
            <tr>
              <td style="padding:28px 36px 4px 36px;">
                <a href="${brand.siteUrl}" style="text-decoration:none;">
                  <img src="${brand.logoUrl}" alt="OpenAthlete" width="32" height="32" style="display:inline-block;vertical-align:middle;border:0;outline:none;" /><span style="display:inline-block;vertical-align:middle;margin-left:8px;font-size:16px;line-height:32px;font-weight:600;letter-spacing:-0.01em;color:${brand.ink};">OpenAthlete</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 20px 36px;">
                ${content}
              </td>
            </tr>
          </table>`;

  const letter = `
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${brand.card};">
            <tr>
              <td style="padding:32px 28px 12px 28px;">
                ${content}
              </td>
            </tr>
          </table>`;

  const html = `<!DOCTYPE html>
<html lang="${htmlLanguages[language]}">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${variant === 'card' ? brand.paper : brand.card};color:${brand.text};font-family:${brand.font};-webkit-text-size-adjust:100%;">
    ${preview ? previewText(preview) : ''}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${variant === 'card' ? brand.paper : brand.card};">
      <tr>
        <td align="center" style="padding:${variant === 'card' ? '32px 12px' : '0'};font-family:${brand.font};">
          ${variant === 'card' ? card : letter}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:${variant === 'card' ? '20px 36px 8px 36px' : '8px 28px 32px 28px'};text-align:left;">
                ${footerHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  const footerText =
    footer.kind === 'account'
      ? t.account
      : `${footer.reason}\n${t.unsubscribe}: ${footer.unsubscribeUrl}\n${t.preferences}: ${footer.preferencesUrl}`;
  const text = `${blocks.map((block) => block.text).join('\n\n')}\n\n--\n${footerText}\n`;

  return { html, text };
}

/**
 * The line inboxes show next to the subject. Clients read it from the start
 * of the body, so it sits there hidden, followed by blank characters that
 * keep the content from filling the rest of the line.
 */
function previewText(preview: string) {
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preview)}${'&#847;&zwnj;&nbsp;'.repeat(80)}</div>`;
}
