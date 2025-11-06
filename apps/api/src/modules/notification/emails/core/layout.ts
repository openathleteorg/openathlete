import { brand } from './brand';
import { escapeHtml } from './utils';

export function layout({
  title,
  contentHtml,
  preview,
}: {
  title: string;
  contentHtml: string;
  preview?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${preview ? `<meta name="x-preview-text" content="${escapeHtml(preview)}" />` : ''}
  </head>
  <body style="margin:0;padding:24px 0;background:${brand.bg};color:${brand.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="width:560px;max-width:560px;background:${brand.cardBg};border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(5,12,52,0.18);">
            <tr>
              <td style="padding:18px 24px;background:${brand.headerBg};border-bottom:1px solid ${brand.border};">
                <a href="https://openathlete.org" style="text-decoration:none;color:${brand.fg};font-weight:700;font-size:16px;display:inline-flex;align-items:center;gap:10px;">
                  <img src="${brand.logoUrl}" alt="OpenAthlete" width="32" height="32" style="display:inline-block;border:0;outline:none;" />
                  <span>OpenAthlete</span>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:36px; color:${brand.text};">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:${brand.footerBg};border-top:1px solid ${brand.border};">
                <p style="margin:0;font-size:12px;color:${brand.muted};">© ${new Date().getFullYear()} OpenAthlete — Tous droits réservés</p>
                <p style="margin:4px 0 0;font-size:12px;color:#9AA4D6;">Vous recevez cet email suite à une action sur votre compte.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}
