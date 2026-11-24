# Post-deploy smoke checks

A few read-only checks against a live deployment, production by default. They
run after each deployment and tell Constellation whether production still works.

## What they check

- the landing page answers;
- the API's `/health` route answers `{"status": "ok"}`;
- the app loads its login page without errors;
- the dedicated smoke account signs in through the real form;
- the dashboard and the calendar render without an uncaught error, a console
  error or a 5xx answer;
- the calendar shows its days.

Nothing is created, edited or deleted. The checks do not depend on data that
changes: the smoke account can be empty.

## Running them

```bash
cd e2e
SMOKE_EMAIL=smoke@tblt.fr SMOKE_PASSWORD=… pnpm test:smoke
```

| Variable            | Default                       |
| ------------------- | ----------------------------- |
| `SMOKE_BASE_URL`    | `https://app.openathlete.org` |
| `SMOKE_API_URL`     | `https://api.openathlete.org` |
| `SMOKE_LANDING_URL` | `https://openathlete.org`     |
| `SMOKE_EMAIL`       | required                      |
| `SMOKE_PASSWORD`    | required                      |

Results go to `smoke/smoke-results/`: a JSON report, an HTML report, and the
Playwright traces of failed tests.

## After each deployment

`.github/workflows/post-deploy.yml` runs the suite in the private mirror
(`tblt-lab/openathlete`) only:

- **web**: on GitHub's `deployment_status` event, when Vercel's
  `Production – openathlete-web` deployment succeeded;
- **api**: on `repository_dispatch` of type `api-deployed`, which Constellation
  sends when it sees a new deployment of the API in Coolify (Coolify does not
  report to GitHub);
- **by hand**: Actions, « Post-deploy checks », Run workflow, with the target.

It then posts the result to Constellation with `e2e/smoke/report.mjs`:
`{scope: "openathlete", target, sha, status, failures, runUrl}`, with
`Authorization: Bearer <DEPLOY_CHECK_TOKEN>`. A failure there raises a critical
alert and a « roll back? » decision card. When the suite could not even start
(runner, install), nothing is reported: that is not a broken production. The
Playwright traces of a failed run are kept 7 days as an artifact.

Secrets of the mirror: `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `DEPLOY_CHECK_TOKEN`,
`CONSTELLATION_DEPLOY_CHECK_URL`.
