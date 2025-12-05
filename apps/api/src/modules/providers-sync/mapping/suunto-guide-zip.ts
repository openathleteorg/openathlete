import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SuuntoGuide } from './suunto-guide.types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require('adm-zip');

// Cache the icon buffer to avoid reading from disk on every call
let cachedIconBuffer: Buffer | null = null;

/**
 * Get the default icon PNG (300x300)
 * Reads from assets/300.png file
 * Tries multiple paths to work in both dev and production
 */
function getDefaultIcon(): Buffer {
  if (cachedIconBuffer) {
    return cachedIconBuffer;
  }

  // Try multiple paths:
  // 1. Relative to compiled file (production: dist/modules/providers-sync/mapping)
  // 2. Relative to process.cwd() (should be /app/apps/api in production)
  // 3. Absolute path from process.cwd()
  const possiblePaths = [
    join(__dirname, '../../../../assets/300.png'), // Relative to compiled file
    join(process.cwd(), 'assets/300.png'), // Relative to working directory
    join(process.cwd(), 'apps/api/assets/300.png'), // Monorepo structure
  ];

  for (const iconPath of possiblePaths) {
    try {
      cachedIconBuffer = readFileSync(iconPath);
      return cachedIconBuffer;
    } catch {
      // Try next path
      continue;
    }
  }

  throw new Error(
    `Failed to load default icon from assets/300.png. Tried paths: ${possiblePaths.join(', ')}`,
  );
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
