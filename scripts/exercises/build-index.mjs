#!/usr/bin/env node
// Writes libs/shared/src/utils/strength/exercise-index.ts: id, English name,
// body part and equipment of every catalog exercise, so the API (whose image
// has neither scripts/ nor apps/web) knows the exercises of the bundled
// catalog. Reads apps/web/public/exercises/catalog.en.json, no clone needed.
//
//   node scripts/exercises/build-index.mjs
//
// Ids are stored in workout steps and never renamed: the script fails if an
// id of the current index is missing from the catalog (see index-guard.mjs).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { checkIds, indexPath as target, root } from './index-guard.mjs';

const catalog = join(root, 'apps/web/public/exercises/catalog.en.json');

const { exercises } = JSON.parse(readFileSync(catalog, 'utf8'));
const rows = exercises
  .map(({ id, name, bodyPart, equipment }) => [id, name, bodyPart, equipment])
  .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

checkIds(rows);

writeFileSync(
  target,
  [
    '/**',
    ' * Generated, do not edit: run node scripts/exercises/build-index.mjs',
    ' * [id, English name, body part, equipment] of the bundled exercise catalog.',
    ' */',
    '// One line per exercise: a rename or an addition is a one-line diff',
    '// prettier-ignore',
    'export const EXERCISE_INDEX: readonly (readonly [',
    '  id: string,',
    '  name: string,',
    '  bodyPart: string,',
    '  equipment: string,',
    '])[] = [',
    ...rows.map((row) => `  ${JSON.stringify(row)},`),
    '];',
    '',
  ].join('\n'),
);

// As the shared library's lint formats it, so a rebuild changes nothing
execFileSync('pnpm', ['exec', 'prettier', '--write', target], {
  cwd: join(root, 'libs/shared'),
  stdio: 'inherit',
});
console.log(`${rows.length} exercises in the index`);
