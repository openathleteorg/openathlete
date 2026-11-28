---
name: e2e
description: Run, debug or extend the OpenAthlete Playwright end-to-end tests, which exercise the production Docker images (API, worker, web, PostgreSQL, Redis) through the API and a real browser on desktop and mobile. Use when a change affects a user flow, deployment wiring, or when an E2E check fails in CI.
---

# End-to-end tests

Everything lives in `e2e/`:
- `docker-compose.yml`: the stack, built from `apps/api/Dockerfile` and `apps/web/Dockerfile`;
- `playwright.config.ts`;
- `tests/` and `support/`.

## Run

```bash
pnpm e2e stack:up        # build images and wait until every service is healthy
pnpm e2e test:e2e        # all projects
pnpm e2e test:e2e tests/web/dashboard.spec.ts --project desktop
pnpm e2e test:e2e:ui     # interactive mode
pnpm e2e stack:down      # stop and delete the data
```

After changing API or web code, run `stack:up` again: it rebuilds the images. The web app is on http://localhost:18080 and the API on http://localhost:13000.

## Projects

| Project | Files | Context |
| --- | --- | --- |
| `setup` | `tests/auth.setup.ts` | Creates an athlete and logs in through the UI; saves `.auth/athlete.json` |
| `api` | `tests/api/*.spec.ts` | Playwright `request`, no browser |
| `desktop` | `tests/web/*.spec.ts` | Desktop Chrome, logged in as the shared athlete |
| `mobile` | `tests/mobile/*.spec.ts` | iPhone 13 viewport and touch input on Chromium, logged in |
| `android` | `tests/mobile/*.spec.ts` | The same phone tests as a Pixel 8 (Chromium), logged in |

## Writing tests

- Create users through `createAthlete(request)` from `support/api.ts`. Every test gets its own account, and each test owns its data.
- API calls go through `apiHeaders()`. It sets a random private `X-Forwarded-For`, so tests don't share the 10 logins per minute rate limit. Browser pages get one such address per worker from `playwright.config.ts`.
- For pages, start with `const problems = trackPageProblems(page)` and end with `expect(problems).toEqual([])`. This catches uncaught errors, console errors and failed requests.
- To test logged out, add `test.use({ storageState: { cookies: [], origins: [] } })`.
- Prefer role and text locators, or `data-*` attributes already in the app. Never use timeouts as waits: use `expect(...).toBeVisible()` or `toHaveURL` instead.
- Mobile layout bugs: assert there is no horizontal overflow (see `tests/mobile/navigation.spec.ts`).

## Debugging a failure

1. In CI, download the `playwright-report` artifact and open it with `npx playwright show-report <dir>`. Failed tests keep a trace and a screenshot.
2. Read the service logs: `pnpm e2e stack:logs`. The CI job prints them when it fails.
3. Reproduce locally with `--project <name> --debug`, or replay the trace with `npx playwright show-trace`.
4. If the setup project fails, every browser test is skipped: fix login or signup first.
