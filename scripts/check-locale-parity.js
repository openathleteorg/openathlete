#!/usr/bin/env node
/**
 * Ensures every locale JSON in `apps/web/messages` exposes the same message keys.
 *
 * Usage: `node scripts/check-locale-parity.js`
 */
const fs = require('node:fs/promises');
const path = require('node:path');

const MESSAGES_DIR = path.resolve(process.cwd(), 'apps', 'web', 'messages');

async function main() {
  const localeFiles = (await fs.readdir(MESSAGES_DIR))
    .filter((name) => name.endsWith('.json'))
    .sort();

  if (localeFiles.length === 0) {
    console.error(`No locale JSON files found in ${MESSAGES_DIR}`);
    process.exit(1);
  }

  const locales = [];
  for (const file of localeFiles) {
    const locale = path.basename(file, '.json');
    const filePath = path.join(MESSAGES_DIR, file);

    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`Failed to read ${filePath}:`, error.message);
      process.exit(1);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error(`Invalid JSON in ${filePath}:`, error.message);
      process.exit(1);
    }

    const keys = new Set(flattenKeys(parsed));
    locales.push({ locale, filePath, keys });
  }

  const unionKeys = new Set();
  locales.forEach(({ keys }) => {
    keys.forEach((key) => unionKeys.add(key));
  });

  let hasDiff = false;

  for (const { locale, filePath, keys } of locales) {
    const missing = [];
    unionKeys.forEach((key) => {
      if (!keys.has(key)) {
        missing.push(key);
      }
    });

    if (missing.length === 0) {
      continue;
    }

    hasDiff = true;
    console.log(`⚠️  ${locale} (${path.relative(process.cwd(), filePath)}) is missing ${missing.length} key(s):`);
    missing.sort().forEach((key) => console.log(`  • ${key}`));
    console.log('');
  }

  if (!hasDiff) {
    console.log('✅ All locale files expose the same set of translation keys.');
  } else {
    console.log('Tip: Keep message keys aligned across all locales so Paraglide stays in sync.');
  }
}

function flattenKeys(node, prefix = '') {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return prefix ? [prefix] : [];
  }

  const keys = [];
  for (const [key, value] of Object.entries(node)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, nextPrefix));
    } else {
      keys.push(nextPrefix);
    }
  }

  return keys;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

