# Exercise library

The web app ships its strength exercise library as static files in
`apps/web/public/exercises`: a catalog per language and the drawings. It works
offline in the mobile apps and sends nothing to a third party.

Sources, at the commits pinned in `sources.json`:

- [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
  (MIT): names, muscles, equipment and instructions. Its media are © Gym visual
  and must not be used.
- [everkinetic/data](https://github.com/everkinetic/data) (CC BY-SA 4.0): start
  and end drawings of about 260 exercises.

`data/` holds what OpenAthlete adds:

| File | What |
| --- | --- |
| `names.json` | Exercise names in en, fr, es, it, pt-BR, de, pl and nl |
| `steps-pt-BR.json` | Brazilian Portuguese instructions, which the dataset lacks |
| `steps-de.json` | German instructions, which the dataset lacks |
| `steps-nl.json` | Dutch instructions, which the dataset lacks |
| `everkinetic-map.json` | The dataset exercise each Everkinetic drawing shows |
| `everkinetic-only.json` | Everkinetic exercises the dataset lacks, translated |
| `excluded.json` | Dataset exercises whose instructions are wrong, left out |
| `popular.json` | The usual exercise of common words, first in the search |
| `garmin-map.json` | Garmin's exercise of each one, for workouts sent to watches |

Catalog ids are slugs of the English names: workout steps store them
(`c:<id>`), so never rename one.

## Rebuild

```bash
git clone https://github.com/hasaneyldrm/exercises-dataset /tmp/hy
git clone https://github.com/everkinetic/data /tmp/ek
# check out the commits of sources.json in each
node scripts/exercises/build-catalog.mjs /tmp/hy /tmp/ek
```

It writes `apps/web/public/exercises`,
`apps/api/src/modules/providers-sync/mapping/garmin-exercises.ts` and, by
running `build-index.mjs`, the exercise index below. Keep
`apps/web/public/exercises/ATTRIBUTION.md` with the drawings: CC BY-SA asks
for the credit and the changes made.

## Exercise index

The API image has neither `scripts/` nor `apps/web`, so the ids, English names,
body parts and equipment of the catalog are also committed as
`libs/shared/src/utils/strength/exercise-index.ts` (`catalogExercise` in the
shared library; the MCP tools `list_exercises` and `get_exercise` and the
check of planned workouts use it). It is generated from
`apps/web/public/exercises/catalog.en.json`, no clone needed:

```bash
node scripts/exercises/build-index.mjs
```

`build-catalog.mjs` runs it at the end. Commit the result with the catalog.
Ids are never renamed. Both build scripts fail, before writing anything, if an
id of the current index would disappear; so does a correction of an English
name that changes its slug: add an override that keeps the old id first. They
also print every kept id whose English name changed, to review (a swap of `x`
and `x-2` after a reorder upstream shows up there).
The index has one line per exercise (`// prettier-ignore`). A test in
`apps/api` checks that it equals the catalog.
