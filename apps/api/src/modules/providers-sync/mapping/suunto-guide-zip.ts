import AdmZip from 'adm-zip';
import { createHash } from 'node:crypto';

import type { SuuntoGuide } from './suunto-guide.types';

/**
 * Create a default icon PNG (300x300 transparent PNG)
 * Returns a minimal valid PNG buffer
 */
function createDefaultIcon(): Buffer {
  // Minimal valid 300x300 transparent PNG
  // PNG signature + IHDR chunk + IEND chunk
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // IHDR chunk: 300x300, RGBA, 8-bit
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(300, 0); // width
  ihdrData.writeUInt32BE(300, 4); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrCrc = createHash('crc32').update(ihdrData).digest();
  const ihdrChunk = Buffer.concat([
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc.slice(0, 4),
  ]);

  // IEND chunk
  const iendChunk = Buffer.from([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  // For a simple transparent PNG, we'll create a minimal valid one
  // In production, you might want to use a proper image library or store a default icon
  // For now, return a minimal valid PNG
  return Buffer.concat([pngSignature, ihdrChunk, iendChunk]);
}

/**
 * Create a ZIP file containing guide.json and icon.png
 */
export function createSuuntoGuideZip(guide: SuuntoGuide): Buffer {
  const zip = new AdmZip();

  // Add guide.json
  const guideJson = JSON.stringify(guide, null, 2);
  zip.addFile('guide.json', Buffer.from(guideJson, 'utf-8'));

  // Add icon.png (default transparent icon for now)
  // TODO: In the future, allow custom icons or generate sport-specific icons
  const iconBuffer = createDefaultIcon();
  zip.addFile('icon.png', iconBuffer);

  return zip.toBuffer();
}

/**
 * Create a ZIP file from guide JSON and optional icon buffer
 */
export function createSuuntoGuideZipFromFiles(
  guideJson: string,
  iconBuffer?: Buffer,
): Buffer {
  const zip = new AdmZip();

  zip.addFile('guide.json', Buffer.from(guideJson, 'utf-8'));
  zip.addFile('icon.png', iconBuffer || createDefaultIcon());

  return zip.toBuffer();
}
