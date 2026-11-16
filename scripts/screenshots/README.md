# Product screenshots

A seeded stack and a Playwright script that capture the app for the website,
the stores and the docs. Everything runs locally, apart from the map tiles
(OpenStreetMap) and the weather of the most recent activities (Open-Meteo),
which the API fetches while processing them.

## What the seed holds

Dates are relative to the day it runs (`SEED_TODAY=YYYY-MM-DD` pins them).

- **Camille Laurent**, trail runner and marathoner in Annecy, a month from
  her goal race (SaintéLyon). A year of activities recorded on real paths
  around the lake and the mountains (GPS, elevation, heart rate, cadence,
  power on the bike, laps), a spring marathon, a trail block, a calf strain,
  a summer ultra, a 10 km PB; planned sessions with structured workouts for
  the last six weeks and up to the race; daily HRV, resting heart rate,
  sleep, weight; zones (heart rate, pace, power), VMA and FTP tests; gear;
  Garmin and Strava connected; a conversation with her coach; AI keys and
  model choices (placeholders); a Supporter subscription.
- **Julien Moreau**, her coach, with eleven more athletes: on track,
  behind on the plan, coming back from an injury, gone quiet, waiting for an
  answer. A template library in folders.

- **Annecy Lakeside Runners**, the club Julien owns, with Claire Vidal
  (admin) and Romain Blanc (assistant, beginners group): thirty athletes,
  his eleven plus eighteen members he reaches through the club, in four
  groups; a shared library; five weekly club sessions four weeks ahead with
  answers (one Thursday called off); pending invitations from an imported
  list; a group conversation, a scheduled message and metric alerts.

Records, grade-adjusted pace, intensity, profiles and training load are not
seeded: the API computes them, as it would for an import.

| Account | Email | Password |
| --- | --- | --- |
| Athlete | `camille.laurent@openathlete.org` | `Screenshots2026!` |
| Coach | `julien.moreau@openathlete.org` | `Screenshots2026!` |
| Club member (marathon group) | `thomas.bernard@openathlete.org` | `Screenshots2026!` |
| Club admin | `claire.vidal@openathlete.org` | `Screenshots2026!` |

Roster athletes use `firstname.lastname@openathlete.org` and the same
password. No email is ever sent: the stack has no mail key.

## Run

```bash
scripts/screenshots/start.sh      # databases (Docker), API :3010, web :5180
pnpm --filter @openathlete/database exec tsx ../../scripts/screenshots/seed.ts
# the seed waits for the API to process the activities (about a minute)
pnpm --filter @openathlete/database exec tsx ../../scripts/screenshots/capture.ts [outDir] [--only=name,...]
scripts/screenshots/stop.sh       # stops the API and web app, keeps the data
```

- `start.sh` runs PostgreSQL on `:5434` and Redis on `:6380` under the
  Docker project `openathlete-screenshots`, so it never touches a regular dev
  database. The API reads `api.env` instead of `apps/api/.env`: no real
  provider, billing, email or analytics key is loaded. The web app runs
  without the PostHog and Firebase keys.
- The seed empties its database first. It refuses to when the database holds
  accounts it did not create (`--force` overrides).
- Screenshots go to `scripts/screenshots/out/` by default (ignored by git),
  at 2× scale: desktop 1440×900, mobile 390×844, light theme plus a few dark
  ones. The shot list is `SHOTS` in `capture.ts`. Shots run in full
  Chromium (`channel: 'chromium'`): the headless shell ignores `--lang`, and
  native date fields would read mm/dd/yyyy.

Type-check the scripts with
`libs/database/node_modules/.bin/tsc -p scripts/screenshots/tsconfig.json`.

## Routes

`routes.json` holds ten real paths around Annecy with their elevation. It
was built once by `build-routes.ts` (FOSSGIS OSRM routing, OpenTopoData
EU-DEM); rerun it only to change the routes:

```bash
pnpm --filter @openathlete/database exec tsx ../../scripts/screenshots/build-routes.ts [ids...]
```
