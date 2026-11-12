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
| `names.json` | Exercise names in en, fr, es, it and pt-BR |
| `steps-pt-BR.json` | Brazilian Portuguese instructions, which the dataset lacks |
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

It writes `apps/web/public/exercises` and
`apps/api/src/modules/providers-sync/mapping/garmin-exercises.ts`. Keep
`apps/web/public/exercises/ATTRIBUTION.md` with the drawings: CC BY-SA asks
for the credit and the changes made.
