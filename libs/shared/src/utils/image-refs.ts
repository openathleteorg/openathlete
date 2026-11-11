/**
 * Images in notes and messages are stored files, referenced in the text as
 * `![image](file:<id>)`: plain text that reads as Markdown in an export,
 * and that every client renders as the image.
 *
 * The alt text is bounded: unbounded, a text full of `![` makes the scan
 * quadratic, and the API runs it on every note and message it saves.
 */
const IMAGE_REF = /!\[[^\]\n]{0,200}\]\(file:([0-9a-f-]{36})\)/gi;

/** The text of an image, to insert where the cursor is */
export function imageRef(fileId: string): string {
  return `![image](file:${fileId})`;
}

/** Ids of the images a text shows, once each */
export function imageIdsIn(text: string): string[] {
  return [...new Set([...text.matchAll(IMAGE_REF)].map((m) => m[1]))];
}

export type ImageTextPart =
  { type: 'text'; value: string } | { type: 'image'; fileId: string };

/** Splits a text into its text and its images, in order */
export function splitImages(text: string): ImageTextPart[] {
  const parts: ImageTextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(IMAGE_REF)) {
    const start = match.index ?? 0;
    if (start > last)
      parts.push({ type: 'text', value: text.slice(last, start) });
    parts.push({ type: 'image', fileId: match[1] });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

/**
 * The text with each image as a short label, for places that show text
 * only: emails, push notifications, conversation previews
 */
export function withImagesAsLabel(text: string, label: string): string {
  return text.replace(IMAGE_REF, label).trim();
}
