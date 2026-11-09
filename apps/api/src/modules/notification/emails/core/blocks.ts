import { brand } from './brand';
import { escapeAttribute, escapeHtml } from './utils';

/** A piece of an email, drawn in HTML and written out for the text part. */
export interface Block {
  html: string;
  text: string;
}

/** Text inside a paragraph: plain, a link, or words in bold */
export type Inline =
  string | { href: string; label: string } | { strong: string };

function inlineHtml(parts: Inline[]) {
  return parts
    .map((part) => {
      if (typeof part === 'string') return escapeHtml(part);
      if ('href' in part) {
        return `<a href="${escapeAttribute(part.href)}" style="color:${brand.link};text-decoration:underline;">${escapeHtml(part.label)}</a>`;
      }
      return `<strong style="font-weight:600;color:${brand.ink};">${escapeHtml(part.strong)}</strong>`;
    })
    .join('');
}

function inlineText(parts: Inline[]) {
  return parts
    .map((part) => {
      if (typeof part === 'string') return part;
      if ('href' in part) return `${part.label} (${part.href})`;
      return part.strong;
    })
    .join('');
}

export function heading(text: string): Block {
  return {
    html: `<h1 style="margin:0 0 16px 0;font-size:22px;line-height:30px;font-weight:600;letter-spacing:-0.01em;color:${brand.ink};">${escapeHtml(text)}</h1>`,
    text,
  };
}

export function paragraph(...parts: Inline[]): Block {
  return {
    html: `<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:${brand.text};">${inlineHtml(parts)}</p>`,
    text: inlineText(parts),
  };
}

/** Small print under the content: expiry, why the email came, a fallback link */
export function note(...parts: Inline[]): Block {
  return {
    html: `<p style="margin:0 0 12px 0;font-size:13px;line-height:20px;color:${brand.muted};">${inlineHtml(parts)}</p>`,
    text: inlineText(parts),
  };
}

export function button({
  href,
  label,
}: {
  href: string;
  label: string;
}): Block {
  const safeHref = escapeAttribute(href);
  return {
    // A table cell carries the colour where padding on links is ignored
    // (Outlook); the link fills it so the whole button is clickable
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px 0;">
  <tr>
    <td bgcolor="${brand.ink}" style="border-radius:10px;background:${brand.ink};">
      <a href="${safeHref}" style="display:inline-block;padding:12px 20px;border-radius:10px;font-size:15px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`,
    text: `${label}: ${href}`,
  };
}

/** Figures side by side, like the metric tiles of the app (two to four) */
export function stats(items: { label: string; value: string }[]): Block {
  const width = Math.floor(100 / items.length);
  const cells = items
    .map(
      (
        item,
        index,
      ) => `<td width="${width}%" valign="top" style="padding:0 ${index < items.length - 1 ? '8px' : '0'} 0 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
        <td bgcolor="${brand.tile}" style="background:${brand.tile};border-radius:10px;padding:14px 14px 12px 14px;">
          <div style="font-size:12px;line-height:16px;color:${brand.muted};">${escapeHtml(item.label)}</div>
          <div style="margin-top:4px;font-size:20px;line-height:26px;font-weight:600;color:${brand.ink};">${escapeHtml(item.value)}</div>
        </td>
      </tr></table>
    </td>`,
    )
    .join('');
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 20px 0;"><tr>${cells}</tr></table>`,
    text: items.map((item) => `${item.label}: ${item.value}`).join('\n'),
  };
}

/** Quoted lines, such as the messages of a conversation */
export function quotes(items: { body: string; caption: string }[]): Block {
  const html = items
    .map(
      (item) => `<tr><td style="padding:0 0 12px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
        <td width="3" bgcolor="${brand.border}" style="background:${brand.border};border-radius:2px;"></td>
        <td style="padding:2px 0 2px 14px;">
          <div style="font-size:15px;line-height:22px;color:${brand.text};">${escapeHtml(item.body)}</div>
          <div style="margin-top:4px;font-size:12px;line-height:16px;color:${brand.muted};">${escapeHtml(item.caption)}</div>
        </td>
      </tr></table>
    </td></tr>`,
    )
    .join('');
  return {
    html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px 0;">${html}</table>`,
    text: items.map((item) => `> ${item.body}\n  ${item.caption}`).join('\n\n'),
  };
}

/** Label and value on one line, for facts such as an email address */
export function facts(items: { label: string; value: string }[]): Block {
  const rows = items
    .map(
      (item) => `<tr>
      <td style="padding:6px 16px 6px 0;font-size:13px;line-height:20px;color:${brand.muted};white-space:nowrap;" valign="top">${escapeHtml(item.label)}</td>
      <td style="padding:6px 0;font-size:15px;line-height:20px;color:${brand.ink};">${escapeHtml(item.value)}</td>
    </tr>`,
    )
    .join('');
  return {
    html: `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;">${rows}</table>`,
    text: items.map((item) => `${item.label}: ${item.value}`).join('\n'),
  };
}

/** The name at the foot of a personal email */
export function signature(name: string): Block {
  return {
    html: `<p style="margin:24px 0 20px 0;font-size:15px;line-height:24px;color:${brand.text};">${escapeHtml(name)}</p>`,
    text: name,
  };
}
