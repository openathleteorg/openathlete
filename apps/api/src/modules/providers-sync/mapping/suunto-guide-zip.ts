import AdmZip from 'adm-zip';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SuuntoGuide } from './suunto-guide.types';

// Cache the icon buffer to avoid reading from disk on every call
let cachedIconBuffer: Buffer | null = null;

/**
 * Get the default icon PNG (300x300)
 * Reads from assets/300.png file
 */
function getDefaultIcon(): Buffer {
  if (cachedIconBuffer) {
    return cachedIconBuffer;
  }

  try {
    // Path relative to this file: ../../../../assets/300.png
    const iconPath = join(__dirname, '../../../../assets/300.png');
    cachedIconBuffer = readFileSync(iconPath);
    return cachedIconBuffer;
  } catch (error) {
    throw new Error(
      `Failed to load default icon from assets/300.png: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Create a ZIP file containing guide.json and icon.png
 */
export function createSuuntoGuideZip(guide: SuuntoGuide): Buffer {
  const zip = new AdmZip();

  // Add guide.json
  const guideJson = JSON.stringify(guide, null, 2);
  zip.addFile('guide.json', Buffer.from(guideJson, 'utf-8'));

  // Add icon.png (using default 300x300 icon from assets)
  const iconBuffer = getDefaultIcon();
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
  zip.addFile('icon.png', iconBuffer || getDefaultIcon());

  return zip.toBuffer();
}
