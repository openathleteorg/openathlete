#!/usr/bin/env bash
# Runs the same checks as CI, locally. Stops at the first failing step and
# prints its log.
#
#   scripts/verify.sh                 # static checks + unit tests (~2 min)
#   scripts/verify.sh --build         # + production builds and AI agent tests
#   scripts/verify.sh --integration   # + PostgreSQL integration tests (Docker)
#   scripts/verify.sh --e2e           # + end-to-end tests on the Docker images
#   scripts/verify.sh --all           # everything
set -uo pipefail

cd "$(dirname "$0")/.."

BUILD=false
INTEGRATION=false
E2E=false
for arg in "$@"; do
  case "$arg" in
    --build) BUILD=true ;;
    --integration) INTEGRATION=true ;;
    --e2e) E2E=true ;;
    --all) BUILD=true INTEGRATION=true E2E=true ;;
    -h | --help)
      sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (see --help)" >&2
      exit 2
      ;;
  esac
done

LOG_DIR=$(mktemp -d)
trap 'rm -rf "$LOG_DIR"' EXIT

step() {
  local name=$1
  shift
  local log="$LOG_DIR/$name.log"
  local start=$SECONDS
  if "$@" >"$log" 2>&1; then
    printf 'ok    %-22s %3ss\n' "$name" $((SECONDS - start))
  else
    printf 'FAIL  %-22s %3ss\n\n' "$name" $((SECONDS - start))
    tail -n 60 "$log"
    # The tail can miss the failure when packages run together (the output
    # of the one that failed comes first): keep the whole log
    local kept="${TMPDIR:-/tmp}/openathlete-verify-$name.log"
    cp "$log" "$kept"
    printf '\nFull log: %s\n' "$kept"
    exit 1
  fi
}

step install pnpm install --frozen-lockfile
step prisma-client pnpm database run db:generate
step shared-build pnpm shared build
step translations bash -c 'pnpm web exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide && pnpm website translate'
step locale-parity pnpm check:locale-parity
step lint pnpm -r --parallel --no-bail --aggregate-output lint
step type-check pnpm -r --parallel --no-bail --aggregate-output tsc:check
# Date bucketing must not depend on the machine's timezone
step unit-tests env TZ=America/New_York pnpm -r --no-bail --aggregate-output test

if $BUILD; then
  step build-api pnpm api build
  step agent-tests pnpm api test:agents
  step build-web pnpm web build
  step build-website pnpm website build
fi

if $INTEGRATION; then
  DB_CONTAINER=openathlete-verify-db
  DB_URL=postgresql://oa:oa@localhost:15436/oa?schema=public
  docker rm -f "$DB_CONTAINER" >/dev/null 2>&1
  step start-postgres docker run -d --rm --name "$DB_CONTAINER" \
    -e POSTGRES_USER=oa -e POSTGRES_PASSWORD=oa -e POSTGRES_DB=oa \
    -p 127.0.0.1:15436:5432 pgvector/pgvector:pg17
  trap 'docker rm -f "$DB_CONTAINER" >/dev/null 2>&1; rm -rf "$LOG_DIR"' EXIT
  step wait-postgres bash -c "until docker exec $DB_CONTAINER pg_isready -U oa -d oa; do sleep 1; done; sleep 2"
  step migrations env DATABASE_URL="$DB_URL" pnpm database run db:deploy
  step integration-tests env INTEGRATION_DATABASE_URL="$DB_URL" pnpm api test:integration
fi

if $E2E; then
  step e2e-stack pnpm e2e stack:up
  step e2e-tests pnpm e2e test:e2e
  step e2e-stop pnpm e2e stack:down
fi

echo
echo "All checks passed."
