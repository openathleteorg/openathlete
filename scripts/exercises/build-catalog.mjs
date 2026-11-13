#!/usr/bin/env node
// Builds the bundled strength exercise catalog of the web app from its two
// open sources, at the commits pinned in sources.json:
//
//   - hasaneyldrm/exercises-dataset: names, muscles, equipment and
//     instructions (MIT). Its media are © Gym visual and NOT used.
//   - everkinetic/data: start and end drawings (CC BY-SA 4.0), redrawn in
//     currentColor so they follow the theme.
//
// The names in six languages, the matching between the two sources and the
// translations the sources lack live in data/, written for OpenAthlete.
//
//   git clone https://github.com/hasaneyldrm/exercises-dataset /tmp/hy
//   git clone https://github.com/everkinetic/data /tmp/ek
//   (checkout the commits of sources.json in each)
//   node scripts/exercises/build-catalog.mjs /tmp/hy /tmp/ek
//
// Writes apps/web/public/exercises/catalog.<locale>.json and media/*.svg.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(root, 'apps/web/public/exercises');
const [hyDir, ekDir] = process.argv.slice(2);
if (!hyDir || !ekDir) {
  console.error('Usage: build-catalog.mjs <exercises-dataset dir> <everkinetic data dir>');
  process.exit(1);
}

const LOCALES = ['en', 'fr', 'es', 'it', 'pt-BR', 'de'];
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const hy = read(join(hyDir, 'data/exercises.json'));
const ek = read(join(ekDir, 'dist/exercises.json'));
const names = read(join(here, 'data/names.json'));
const ekMap = read(join(here, 'data/everkinetic-map.json'));
const ekOnly = read(join(here, 'data/everkinetic-only.json'));
const stepsPtBr = read(join(here, 'data/steps-pt-BR.json'));
const stepsDe = read(join(here, 'data/steps-de.json'));
const excluded = new Set(read(join(here, 'data/excluded.json')).ids);
const popular = new Set(read(join(here, 'data/popular.json')).ids);

/** Everkinetic entries dropped as copies of another Everkinetic entry */
const EK_DUPLICATES = new Set(['0010', '0011', '0302', '0095', '0080', '0184', '0199']);

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);

const ids = new Set();
function uniqueId(name) {
  const base = slug(name) || 'exercise';
  let id = base;
  for (let n = 2; ids.has(id); n += 1) id = `${base}-${n}`;
  ids.add(id);
  return id;
}

// Everkinetic vocabulary, as the other source writes it
const EK_EQUIPMENT = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  dumbbells: 'dumbbell',
  cable: 'cable',
  body: 'body weight',
  machine: 'leverage machine',
  'smith machine': 'smith machine',
  'exercise band': 'band',
  'exercise ball': 'stability ball',
  'stability ball': 'stability ball',
  'swiss ball': 'stability ball',
  'bosu ball': 'bosu ball',
  'medicine ball': 'medicine ball',
  'weight plate': 'weighted',
};
const EK_TARGET = {
  'biceps brachii': ['biceps', 'upper arms'],
  'triceps brachii': ['triceps', 'upper arms'],
  'pectoralis major': ['pectorals', 'chest'],
  quadriceps: ['quads', 'upper legs'],
  deltoid: ['delts', 'shoulders'],
  abdominals: ['abs', 'waist'],
  obliques: ['abs', 'waist'],
  'latissimus dorsi': ['lats', 'back'],
  gastrocnemius: ['calves', 'lower legs'],
  soleus: ['calves', 'lower legs'],
  'ischiocrural muscles': ['hamstrings', 'upper legs'],
  'erector spinae': ['spine', 'back'],
  trapezius: ['traps', 'back'],
  'glutaeus maximus': ['glutes', 'upper legs'],
};

/** Fewer, clearer equipment filters: variants of one tool become one */
const EQUIPMENT_GROUP = {
  'resistance band': 'band',
  'olympic barbell': 'barbell',
  'trap bar': 'barbell',
  'wheel roller': 'roller',
  'sled machine': 'leverage machine',
  'elliptical machine': 'cardio machine',
  'stepmill machine': 'cardio machine',
  'stationary bike': 'cardio machine',
  'upper body ergometer': 'cardio machine',
  'skierg machine': 'cardio machine',
  hammer: 'other',
  tire: 'other',
};
const equipmentOf = (name) => EQUIPMENT_GROUP[name] ?? name;

/** Theme-coloured line art: no white ground, strokes in currentColor */
function cleanSvg(source) {
  return source
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<g fill="#fff(?:fff)?">[\s\S]*?<\/g>/gi, '')
    .replace(/fill="#(?!fff)[0-9a-f]{3,6}"/gi, 'fill="currentColor"')
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace(/(\d+\.\d)\d+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

rmSync(join(out, 'media'), { recursive: true, force: true });
mkdirSync(join(out, 'media'), { recursive: true });

const ekByHy = new Map();
for (const [ekId, hyId] of Object.entries(ekMap)) if (hyId) ekByHy.set(hyId, ekId);
const ekById = new Map(ek.map((entry) => [entry.id, entry]));

function writeMedia(id, ekId) {
  const entry = ekById.get(ekId);
  if (!entry || entry.svg.length !== 2) return 0;
  entry.svg.forEach((file, frame) => {
    const svg = cleanSvg(readFileSync(join(ekDir, 'dist', file), 'utf8'));
    writeFileSync(join(out, 'media', `${id}-${frame}.svg`), svg);
  });
  return 2;
}

/** One record per exercise; `name` and `steps` per locale */
const records = [];
for (const entry of hy) {
  if (excluded.has(entry.id)) continue;
  const name = names[entry.id];
  if (!name) throw new Error(`No names for ${entry.id}`);
  const id = uniqueId(name.en);
  const steps = Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      locale === 'pt-BR'
        ? stepsPtBr[entry.id]
        : locale === 'de'
          ? stepsDe[entry.id]
          : (entry.instruction_steps?.[locale] ?? entry.instruction_steps?.en ?? []),
    ]),
  );
  const ekId = ekByHy.get(entry.id);
  records.push({
    id,
    name,
    bodyPart: entry.body_part,
    equipment: equipmentOf(entry.equipment),
    target: entry.target,
    secondary: entry.secondary_muscles ?? [],
    media: ekId ? writeMedia(id, ekId) : 0,
    popular: popular.has(entry.id),
    steps,
  });
}
for (const [ekId, i18n] of Object.entries(ekOnly)) {
  if (EK_DUPLICATES.has(ekId) || ekMap[ekId]) continue;
  const entry = ekById.get(ekId);
  const id = uniqueId(i18n.name.en);
  const [target, bodyPart] = EK_TARGET[entry.primary[0]] ??
    (ekId === '0001' || ekId === '0002' ? ['levator scapulae', 'neck'] : ['abs', 'waist']);
  records.push({
    id,
    name: i18n.name,
    bodyPart,
    equipment: EK_EQUIPMENT[entry.equipment[0]?.toLowerCase()] ?? 'body weight',
    target,
    secondary: entry.secondary.map((muscle) => EK_TARGET[muscle]?.[0]).filter(Boolean),
    media: writeMedia(id, ekId),
    popular: false,
    steps: i18n.steps,
  });
}

const attribution = {
  data: 'Exercise data: hasaneyldrm/exercises-dataset (MIT), translations by OpenAthlete',
  media: 'Drawings: Everkinetic, Greg Priday (CC BY-SA 4.0), recoloured by OpenAthlete',
};
// The source numbers variants of a movement ("Side bridge v2"). The number
// means nothing to a coach: drop it unless another exercise has that name.
const VARIANT = /\s+v\d+$/i;
function displayNames(locale) {
  const count = new Map();
  for (const record of records) {
    const base = record.name[locale].replace(VARIANT, '');
    count.set(base, (count.get(base) ?? 0) + 1);
  }
  return (record) => {
    const base = record.name[locale].replace(VARIANT, '');
    return count.get(base) === 1 ? base : record.name[locale];
  };
}
for (const locale of LOCALES) {
  const nameOf = displayNames(locale);
  const exercises = records
    .map((record) => ({
      id: record.id,
      name: nameOf(record),
      bodyPart: record.bodyPart,
      equipment: record.equipment,
      target: record.target,
      secondary: record.secondary,
      media: record.media,
      ...(record.popular && { popular: true }),
      steps: record.steps[locale]?.length ? record.steps[locale] : record.steps.en,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
  writeFileSync(
    join(out, `catalog.${locale}.json`),
    JSON.stringify({ version: 1, attribution, exercises }),
  );
}
// Garmin's exercise for each catalog exercise, for workouts sent to watches
const garmin = read(join(here, 'data/garmin-map.json'));
const garminLines = Object.keys(garmin)
  .sort()
  .filter((id) => garmin[id])
  .map((id) => {
    const [category, name] = garmin[id];
    return `  '${id}': ['${category}', ${name ? `'${name}'` : 'null'}],`;
  });
const garminModule = join(
  root,
  'apps/api/src/modules/providers-sync/mapping/garmin-exercises.ts',
);
writeFileSync(
  garminModule,
  [
    '/**',
    " * Garmin's exercise of each exercise of the bundled catalog (see",
    ' * scripts/exercises), so a strength workout sent to a watch shows the right',
    ' * exercise: [category, name], or [category, null] when Garmin has the movement',
    " * but not that variant. Values from Garmin's exercise list (FIT profile).",
    ' * Generated by scripts/exercises/build-catalog.mjs from data/garmin-map.json.',
    ' */',
    'export const GARMIN_EXERCISES: Record<',
    '  string,',
    '  readonly [string, string | null]',
    '> = {',
    ...garminLines,
    '};',
    '',
  ].join('\n'),
);

// As the API's lint formats it, so a rebuild changes nothing
execFileSync('pnpm', ['exec', 'prettier', '--write', garminModule], {
  cwd: join(root, 'apps/api'),
  stdio: 'ignore',
});

const illustrated = records.filter((record) => record.media).length;
console.log(`${records.length} exercises, ${illustrated} illustrated`);
