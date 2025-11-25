#!/usr/bin/env node
/**
 * Quick heuristic scanner that reports string literals inside `apps/web`
 * TypeScript/TSX files that might still be hard-coded instead of using Paraglide.
 *
 * Usage: `node scripts/find-untranslated.js`
 */
const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.resolve(process.cwd(), 'apps', 'web');
const TARGET_DIR = path.join(ROOT, 'src');
const VALID_EXTENSIONS = new Set(['.ts', '.tsx']);

const STRING_REGEX = /(['"`])((?:\\.|(?!\1).)*?)\1/g;
const TOKEN_LIKE_REGEX = /^[\w.-]+$/i;
const PATH_LIKE_REGEX = /^(?:\.{0,2}\/|@|#)/;

async function main() {
  const files = await collectFiles(TARGET_DIR);
  const findings = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (shouldIgnoreLine(line)) {
        return;
      }

      for (const match of line.matchAll(STRING_REGEX)) {
        const rawValue = match[2];
        if (shouldFlagValue(rawValue, line, lines, index)) {
          findings.push({
            file,
            line: index + 1,
            value: rawValue.trim(),
            snippet: line.trim(),
          });
        }
      }
    });
  }

  if (findings.length === 0) {
    console.log('✅ No suspicious string literals detected in apps/web.');
    return;
  }

  console.log(`⚠️  Found ${findings.length} potentially untranslated string(s):\n`);
  for (const finding of findings) {
    console.log(`• ${path.relative(ROOT, finding.file)}:${finding.line}`);
    console.log(`  text: "${finding.value}"`);
    console.log(`  code: ${finding.snippet}`);
    console.log('');
  }

  console.log('Tip: Convert these strings to Paraglide messages (apps/web/messages/*).');
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (VALID_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldIgnoreLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('*')) return true;
  if (/^\/\*/.test(trimmed)) return true;
  if (/['"`]\s*\+\s*m\./.test(trimmed)) return true;
  if (/m\.[\w]+/.test(trimmed)) return true;
  return false;
}

function shouldFlagValue(value, line, lines, lineIndex) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('{{')) return false;
  if (trimmed.includes('}}')) return false;
  if (trimmed.includes('${')) return false;
  if (trimmed.toLowerCase() === trimmed) return false;
  if (trimmed.length < 3) return false;
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(trimmed)) return false;
  if (TOKEN_LIKE_REGEX.test(trimmed)) return false;
  if (PATH_LIKE_REGEX.test(trimmed)) return false;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return false;
  if (trimmed.includes('{{') || trimmed.includes('}}')) return false;
  if (/\bclass(Name)?=/.test(line)) return false;
  if (/aria-|data-/.test(line)) return false;
  if (/console\./.test(line)) return false;
  if (/^https?:\/\//.test(trimmed)) return false;
  if (isTailwindContext(lines, lineIndex)) return false;
  if (isTailwindUtilityString(trimmed)) return false;
  return true;
}

function isTailwindContext(lines, lineIndex) {
  const start = Math.max(0, lineIndex - 3);
  for (let i = start; i <= lineIndex; i += 1) {
    const fragment = lines[i];
    if (!fragment) continue;
    if (/\bclass(Name)?\b/.test(fragment)) return true;
    if (/cn\(|clsx\(|twMerge\(/.test(fragment)) return true;
  }
  return false;
}

const TAILWIND_TOKEN = /^[a-z0-9_\-\[\]\/:%]+$/i;
const COMMON_TAILWIND_SINGLE_CLASSES = new Set([
  'flex',
  'grid',
  'block',
  'inline',
  'inline-block',
  'inline-flex',
  'hidden',
  'contents',
  'sr-only',
]);

function isTailwindUtilityString(value) {
  const tokens = value.trim().split(/\s+/);
  if (tokens.length === 0) return false;

  let tailwindishTokens = 0;
  for (const token of tokens) {
    if (!TAILWIND_TOKEN.test(token)) {
      return false;
    }
    if (token.length === 0) continue;
    if (
      token.includes('-') ||
      token.includes(':') ||
      token.includes('/') ||
      token.includes('[') ||
      COMMON_TAILWIND_SINGLE_CLASSES.has(token)
    ) {
      tailwindishTokens += 1;
    }
  }

  if (tailwindishTokens === 0) {
    return false;
  }

  return tokens.length > 1 || tailwindishTokens > 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

