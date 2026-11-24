#!/bin/sh
# Backs up the hosted database to the restic repository in RESTIC_REPOSITORY
# (Cloudflare R2). Run nightly by a Coolify scheduled task in this container.
#
# Restore: restic dump latest /openathlete.sql | psql -d <empty database>
set -eu

# Tells the monitor (Constellation, /api/heartbeats/backup?token=...) that the
# backup ran: the URL as is after a success, with status=fail after a failure.
heartbeat() {
  url="${BACKUP_HEARTBEAT_URL:-}"
  [ -n "$url" ] || return 0
  if [ "$1" = fail ]; then
    case "$url" in
      *\?*) url="$url&status=fail" ;;
      *) url="$url?status=fail" ;;
    esac
  fi
  wget -q -T 10 -O /dev/null "$url" || true
}

run() {
  if [ -z "${RESTIC_REPOSITORY:-}" ]; then
    echo "RESTIC_REPOSITORY is not set, nothing to do."
    # Watched but not configured: no backup is a failure, not a success.
    [ -z "${BACKUP_HEARTBEAT_URL:-}" ] || return 1
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
trap 'if [ $? -eq 0 ]; then heartbeat ok; else heartbeat fail; fi' EXIT
run
