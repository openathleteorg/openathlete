export type TextPart =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string };

// http(s) addresses, or ones starting with www.
const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"]+/gi;
// Punctuation that ends a sentence rather than the address
const TRAILING = /[.,;:!?)\]'»]+$/;

/** Splits plain text into text and links, so pasted URLs open on a tap */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const start = match.index ?? 0;
    let url = match[0];
    const trailing = TRAILING.exec(url)?.[0] ?? '';
    // Keep a closing parenthesis that belongs to the address
    const keep = trailing.startsWith(')') && url.includes('(') ? 1 : 0;
    url = url.slice(0, url.length - trailing.length + keep);
    if (start > last) {
      parts.push({ type: 'text', value: text.slice(last, start) });
    }
    parts.push({
      type: 'link',
      value: url,
      href: /^https?:\/\//i.test(url) ? url : `https://${url}`,
    });
    last = start + url.length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}
