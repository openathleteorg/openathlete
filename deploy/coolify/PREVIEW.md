# Pull request previews on Coolify

Each pull request gets its own stack, built from its branch by
[`docker-compose.preview.yml`](../../docker-compose.preview.yml): PostgreSQL
(pgvector), Redis, the API, the worker, the web app, a one-shot seed and
Mailpit. The web app serves the app and forwards `/api` to the API, as in
self-hosting. Only `web` and `mailpit` have a domain, both behind basic auth
and `X-Robots-Tag: noindex`.

A preview behaves like a self-hosted instance without keys: no device
integrations, no Stripe (every feature unlocked, no Supporter mention), no
AI instance keys, no S3, no PostHog. Emails reach Mailpit, never a real
inbox.

## Coolify settings

Create one Application for the previews, separate from production:

| Setting | Value |
| --- | --- |
| Source | the GitHub App of the repository |
| Build pack | Docker Compose |
| Base directory | `/` |
| Docker Compose location | `/docker-compose.preview.yml` |
| Domains, `web` | `https://preview.<domain>:80`: write the port, Coolify does not read it from the Dockerfile or the labels and refuses the domain ("no internal port") without it |
| Domains, `mailpit` | `https://mail.preview.<domain>:8025` |
| Preview deployments | on (Advanced > Preview deployments), URL template `pr-{{pr_id}}.{{domain}}`: keep `{{domain}}`, a fixed host would give `web` and `mailpit` the same address |
| Advanced > Escape special characters in labels | **off**: the labels read `${COMPOSE_PROJECT_NAME}`, `${PREVIEW_BASIC_AUTH}` and the magic variables. Left on, Coolify writes them as `$${...}`, Traefik rejects the routers and every domain answers 503 although the containers are healthy |
| Advanced > Docker compose > Predefined network | off (the default) |

- With the template, pull request 12 is served at
  `https://pr-12.preview.<domain>` and its inbox at
  `https://pr-12.mail.preview.<domain>`. DNS needs `preview.<domain>`,
  `mail.preview.<domain>`, `*.preview.<domain>` and `*.mail.preview.<domain>`
  pointing at the server: the `*.mail` record hides `mail.preview.<domain>`
  from the `*.preview` wildcard, so it needs its own record. Traefik gets one
  Let's Encrypt certificate per host.
- The Application's own deployment runs the main branch at the main
  domains. It can stay stopped: pull request previews do not need it.
- Previews from forks: leave public previews off. The stack runs the pull
  request's compose file and Dockerfiles.

## Variables

Set them under **Preview Deployment Environment Variables**.

| Variable | Value |
| --- | --- |
| `PREVIEW_BASIC_AUTH` | Required. Users in htpasswd format, such as the output of `htpasswd -nbB preview '<password>'`. Several users are separated by commas. Tick **Is Literal**, or Coolify interpolates the `$` of the hash. |

Coolify generates the rest; the compose file only reads these:

| Variable | Use |
| --- | --- |
| `SERVICE_URL_WEB`, `SERVICE_FQDN_WEB` | The preview's web URL and host: `APP_URL`, `FRONTEND_URL` and the API router's rule. In a preview, Coolify fills them from the preview's own domain, not the main one (`ApplicationDeploymentJob::generate_runtime_environment_variables` writes the preview's `docker_compose_domains` into its `.env`; checked against the Coolify source of November 2026, instance on 4.7.6). |
| `SERVICE_NAME_API`, `_POSTGRES`, `_REDIS`, `_MAILPIT` | Hosts of the services. On the preview's own network they are the plain names; when a preview shares a network with others (predefined network, or a network with `name:`/`external:`), Coolify renames its services `<name>-pr-<id>` and these variables follow, so a preview never reaches another stack's containers. |
| `SERVICE_PASSWORD_POSTGRES`, `SERVICE_PASSWORD_64_JWT`, `SERVICE_PASSWORD_64_PEPPER`, `SERVICE_HEX_32_PREVIEWACCESS` | Secrets, generated once for the Application's previews. |
| `COMPOSE_PROJECT_NAME` | Set by Docker Compose to the project, `<uuid>-pr-<id>`: prefixes the Traefik router and middlewares, which must differ between previews. |

The compose file writes every integration, billing, AI, storage and
analytics key empty rather than reading a variable: Docker Compose reads the
repository's `.env` locally, and a preview can fall back to the
Application's production variables. Don't set those keys in the preview
variables: a non-empty variable of the same name would replace the empty
value.

The rest of the environment: `ENV=preview`, `NODE_ENV=production`,
`SIGNUP_MODE=open`; emails through SMTP to `mailpit:1025` (no TLS, no
authentication), `EMAIL_SIGNATURE` empty so the onboarding and recap emails
stay off. The API runs the migrations and no jobs; the worker runs every job
(`ENABLE_ACTIVITY_IMPORT`, `ENABLE_ACTIVITY_PROCESSING`,
`ENABLE_TRAINING_LOAD_ESTIMATION` at `true`).

## Basic auth and the API

The app sends its own `Authorization: Bearer` header to `/api`, which
Traefik's basic auth would refuse. So the web service has a second router,
for `/api/` with a Bearer token, without basic auth; it only matches with the
`oa_preview` cookie that the basic-authenticated router sets on every
response (value: `SERVICE_HEX_32_PREVIEWACCESS`). Requests without a Bearer
token (login, sign-up, Socket.IO) go through basic auth, with the
credentials the browser remembers.

Coolify adds the middlewares defined in a service's labels to the routers it
generates for that service, so the labels only define them. Traefik drops a
router or middleware that two containers define differently: the names start
with `COMPOSE_PROJECT_NAME`, unique to each preview. The router rule uses
`HeaderRegexp`, which needs Traefik v3 (Coolify's default proxy). Coolify
also sends its own `X-Robots-Tag` on preview domains; the labels set it
anyway, for the main domains too.

Checked locally with Traefik v3.6 and a router like the one Coolify
generates: a page without credentials gets 401, with them 200 plus the
cookie and `X-Robots-Tag`; `/api` with a Bearer token gets 401 without the
cookie, with a wrong one or with `xoa_preview=`, and 200 with it; login goes
through basic auth.

## The seed

The `seed` service runs once the API is healthy, so the migrations have
run: [`scripts/screenshots/seed.ts`](../../scripts/screenshots/seed.ts),
built as the `seed` stage of `apps/api/Dockerfile` (tsx, Prisma client, the
API's dependencies; never published). It creates the screenshot accounts,
queues the activities for the worker, waits until they are processed (about
two minutes), then exits. `restart: "no"` keeps it out of Coolify's health
status once it has exited.

- `--once`: when the coach account already exists, it does nothing. Each new
  commit redeploys the preview and starts the seed again; what testers did
  on the preview stays.
- It still refuses a database holding accounts it did not create, and never
  runs with `--force`.
- To start over, delete the preview in Coolify, which removes its volumes,
  then redeploy it.

Every seeded account has the password `Screenshots2026!`:

| Account | Email |
| --- | --- |
| Coach (Julien Moreau) | `julien.moreau@openathlete.org` |
| Athlete (Camille Laurent) | `camille.laurent@openathlete.org` |
| Club member (marathon group) | `thomas.bernard@openathlete.org` |
| Club admin | `claire.vidal@openathlete.org` |

See [`scripts/screenshots/README.md`](../../scripts/screenshots/README.md)
for what the seed holds.

## Memory

Measured with `docker stats` on 2026-11-23, on a stack at rest: seeded,
activities processed, every container restarted, then idle for 90 seconds
(Docker Desktop, arm64).

| Service | Memory |
| --- | --- |
| `api` | 196 MiB |
| `worker` | 200 MiB |
| `postgres` | 39 MiB |
| `mailpit` | 14 MiB |
| `web` | 12 MiB |
| `redis` | 6 MiB |
| **Total** | **about 470 MiB** |

The seed has exited by then. While it runs (about 2 minutes, 1,700
activities), the worker and PostgreSQL take more. On disk, a preview holds
about 220 MB of database. Its images: API and worker 1.3 GB (the same
layers), seed 1.2 GB, web 80 MB; previews with unchanged dependencies share
most layers.

## Locally

```bash
PREVIEW_BASIC_AUTH="$(htpasswd -nbB preview secret)" \
  docker compose -f docker-compose.preview.yml up --build -d
docker compose -f docker-compose.preview.yml logs -f seed
docker compose -f docker-compose.preview.yml exec web wget -qO- http://127.0.0.1/api/health
docker compose -f docker-compose.preview.yml down -v      # removes the data
```

Nothing is published on the host. The project is `openathlete-preview`, so its
volumes stay separate from the other compose files'; without Coolify the secrets take
local defaults and the labels have no effect.
