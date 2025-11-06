import { brand } from './brand';
import { escapeAttribute, escapeHtml } from './utils';

export function h1(text: string) {
  return `<h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;">${escapeHtml(text)}</h1>`;
}

export function p(text: string) {
  return `<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;">${escapeHtml(text)}</p>`;
}

export function note(text: string) {
  return `<p style="margin:14px 0 0 0;font-size:12px;color:${brand.muted};">${escapeHtml(text)}</p>`;
}

export function button({ href, label }: { href: string; label: string }) {
  const safeHref = escapeAttribute(href);
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
    <tr>
      <td style="border-radius:10px;background:#050C34;">
        <a href="${safeHref}" style="display:inline-block;padding:12px 18px;color:#EAF0FF;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function rawLink(href: string) {
  const safeHref = escapeAttribute(href);
  return `<a href="${safeHref}" style="color:${brand.accent};text-decoration:none;">${escapeHtml(href)}</a>`;
}


