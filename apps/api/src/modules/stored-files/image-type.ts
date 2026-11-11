/**
 * The image type of a file from its first bytes, whatever the client
 * declared: only images the app shows are stored, never a page or a script
 * named .png.
 */
export function detectImageType(bytes: Buffer): string | null {
  const starts = (signature: number[], offset = 0) =>
    signature.every((byte, i) => bytes[offset + i] === byte);
  if (starts([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return 'image/png';
  if (starts([0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  // RIFF....WEBP
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8))
    return 'image/webp';
  return null;
}
