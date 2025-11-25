#!/usr/bin/env node
/**
 * Reports translation keys defined under `apps/web/messages/*.json` that never
 * appear in the frontend codebase (heuristic search for `m.key()` usage).
 *
 * Usage:
 *   - Detect unused keys: `node scripts/find-unused-translations.js`
 *   - Remove unused keys: `node scripts/find-unused-translations.js --fix`
 */
const fs = require('node:fs/promises');
const path = require('node:path');

const MESSAGES_DIR = path.resolve(process.cwd(), 'apps', 'web', 'messages');
const SOURCE_DIR = path.resolve(process.cwd(), 'apps', 'web', 'src');
const VALID_EXTENSIONS = new Set(['.ts', '.tsx']);
const FIX_MODE = process.argv.includes('--fix');
const DOT_CALL_REGEX = /\bm\.([a-z0-9_]+)\s*\(/gi;
const BRACKET_CALL_REGEX = /\bm\[['"]([a-z0-9_]+)['"]\]\s*\(/gi;

async function main() {
  const locales = await loadLocales();
  const allKeys = collectUnionKeys(locales);

  if (allKeys.size === 0) {
    console.log('No translation keys found.');
    return;
  }

  const usage = await collectKeyUsage(allKeys);

  const unused = [...allKeys].filter((key) => !usage.has(key));

  if (unused.length === 0) {
    console.log('✅ Every translation key is referenced at least once in apps/web/src.');
    return;
  }

  if (!FIX_MODE) {
    console.log(`⚠️  Found ${unused.length} translation key(s) with no usage:\n`);
    unused.sort().forEach((key) => console.log(`  • ${key}`));
    console.log('\nTip: Remove stale keys or wire them into the UI to avoid drift.');
    console.log('Use `--fix` to remove the unused keys automatically.');
    return;
  }

  await removeUnusedKeys(locales, new Set(unused));
}

async function loadLocales() {
  const files = (await fs.readdir(MESSAGES_DIR)).filter((name) => name.endsWith('.json'));
  if (files.length === 0) {
    console.error(`No locale JSON files found in ${MESSAGES_DIR}`);
    process.exit(1);
  }

  const locales = [];

  for (const file of files) {
    const filePath = path.join(MESSAGES_DIR, file);
    let parsed;

    try {
      parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
      console.error(`Invalid locale file ${filePath}:`, error.message);
      process.exit(1);
    }

    locales.push({
      locale: path.basename(file, '.json'),
      filePath,
      data: parsed,
    });
  }

  return locales;
}

function collectUnionKeys(locales) {
  const union = new Set();
  locales.forEach(({ data }) => {
    flattenKeys(data).forEach((key) => {
      if (key === '$schema') return;
      union.add(key);
    });
  });
  return union;
}

async function collectKeyUsage(targetKeys) {
  const files = await collectSourceFiles(SOURCE_DIR);
  const usage = new Map();

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');

    extractMatches(content, DOT_CALL_REGEX, usage, file, targetKeys);
    extractMatches(content, BRACKET_CALL_REGEX, usage, file, targetKeys);
  }

  return usage;
}

function extractMatches(content, regex, usage, file, targetKeys) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    if (!targetKeys.has(key)) continue;
    if (!usage.has(key)) {
      usage.set(key, new Set());
    }
    usage.get(key).add(file);
  }
}

async function collectSourceFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (VALID_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function flattenKeys(node, prefix = '') {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return prefix ? [prefix] : [];
  }

  const keys = [];
  for (const [key, value] of Object.entries(node)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, next));
    } else {
      keys.push(next);
    }
  }

  return keys;
}

async function removeUnusedKeys(locales, unusedSet) {
  let removed = 0;

  for (const locale of locales) {
    const pruned = pruneKeys(locale.data, unusedSet);
    if (pruned > 0) {
      removed += pruned;
      await fs.writeFile(locale.filePath, `${JSON.stringify(locale.data, null, 2)}\n`);
      console.log(`🧹 Removed ${pruned} key(s) from ${path.relative(process.cwd(), locale.filePath)}`);
    }
  }

  if (removed === 0) {
    console.log('No keys removed (none of the unused keys existed in the files).');
  } else {
    console.log(`✅ Completed cleanup. ${removed} key(s) removed across locales.`);
  }
}

function pruneKeys(obj, unusedSet, prefix = '') {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return 0;
  }

  let removed = 0;
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (unusedSet.has(fullKey)) {
      delete obj[key];
      removed += 1;
      continue;
    }

    removed += pruneKeys(obj[key], unusedSet, fullKey);
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && Object.keys(obj[key]).length === 0) {
      delete obj[key];
    }
  }

  return removed;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

