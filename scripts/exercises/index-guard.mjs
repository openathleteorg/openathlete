// Ids of the exercise index are stored in workout steps and never renamed.
// Shared by build-catalog.mjs (which checks before it writes anything) and
// build-index.mjs.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const root = join(here, '..', '..');
export const indexPath = join(
  root,
  'libs/shared/src/utils/strength/exercise-index.ts',
);

/**
 * id -> English name of the committed index, empty if there is none yet.
 * Reads either quote style (the generator writes double, prettier may turn
 * them single) and fails when a file exists but yields no id: a guard that
 * finds nothing would let every rename through.
 */
export function previousIndex() {
  const names = new Map();
  if (!existsSync(indexPath)) return names;
  const source = readFileSync(indexPath, 'utf8');
  const row =
    /\[\s*["']([a-z0-9-]+)["'],\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  for (const [, id, quoted] of source.matchAll(row)) {
    names.set(id, quoted.slice(1, -1));
  }
  if (!names.size) {
    console.error(
      `${indexPath} exists but no exercise id could be read from it: fix the file or the guard before regenerating`,
    );
    process.exit(1);
  }
  return names;
}

/**
 * Fails if an id of the committed index is not in `rows` ([id, name, ...]),
 * and lists the ids whose English name changed, for review (a swap of `x` and
 * `x-2` shows up there: the ids are the same, the exercises are not)
 */
export function checkIds(rows) {
  const ids = new Set(rows.map((row) => row[0]));
  if (ids.size !== rows.length) {
    console.error('Duplicate exercise ids in the catalog');
    process.exit(1);
  }
  const previous = previousIndex();
  const lost = [...previous.keys()].filter((id) => !ids.has(id));
  if (lost.length) {
    console.error(
      `Exercise ids would disappear (ids are never renamed; add an id override to the build first): ${lost.join(', ')}`,
    );
    process.exit(1);
  }
  const now = new Map(rows.map((row) => [row[0], JSON.stringify(row[1])]));
  for (const [id, before] of previous) {
    const after = now.get(id).slice(1, -1);
    if (after !== before) {
      console.warn(`Name of ${id} changed, check it: "${before}" -> "${after}"`);
    }
  }
}
