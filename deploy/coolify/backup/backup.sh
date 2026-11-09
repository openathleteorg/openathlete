#!/bin/sh
# Backs up the hosted database to the restic repository in RESTIC_REPOSITORY
# (Cloudflare R2). Run nightly by a Coolify scheduled task in this container.
#
# Restore: restic dump latest /openathlete.sql | psql -d <empty database>
set -eu

heartbeat() {
  if [ -n "${BACKUP_HEARTBEAT_URL:-}" ]; then
    wget -q -T 10 -O /dev/null "${BACKUP_HEARTBEAT_URL}$1" || true
  fi
}

run() {
  if [ -z "${RESTIC_REPOSITORY:-}" ]; then
    echo "RESTIC_REPOSITORY is not set, nothing to do."
    return 0
  fi

  restic cat config >/dev/null 2>&1 || restic init
  # A deployment during a backup kills it and leaves its lock behind.
  restic unlock

  # Plain, uncompressed SQL: restic deduplicates it against the previous
  # nights and compresses it itself, so each night stores only what changed.
  # A fixed host keeps the retention working across container recreations.
  restic backup --host openathlete --tag nightly \
    --stdin-from-command --stdin-filename openathlete.sql -- \
    nice -n 19 pg_dump --no-owner --no-acl

  restic forget --host openathlete --tag nightly \
    --keep-daily 7 --keep-weekly 4 --prune

  # Sundays: read back a tenth of the stored data to catch silent corruption.
  if [ "$(date -u +%u)" = 7 ]; then
    restic check --read-data-subset=10%
  fi
}

# Through a trap rather than `if run`, which would turn off `set -e` in run.
trap 'if [ $? -eq 0 ]; then heartbeat ""; else heartbeat "/fail"; fi' EXIT
run
