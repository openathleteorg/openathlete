#!/usr/bin/env bash
# Vercel "Ignored Build Step" (ignoreCommand in each app's vercel.json):
# builds only when a path the app depends on changed since the last
# successful deployment. Exit 0 skips the build, exit 1 builds.
#
#   bash ../../scripts/vercel-ignore-build.sh web|website|docs
#
# A push carries several commits, so the comparison is against
# VERCEL_GIT_PREVIOUS_SHA, not HEAD^. When that commit is unknown (first deployment, shallow clone, history rewritten), the
# app builds: a useless build costs minutes, a skipped one ships stale code.

set -u

previous="${VERCEL_GIT_PREVIOUS_SHA:-}"
current="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

# Git pathspecs, from the repository root. The lockfile counts for the apps
# of the workspace: a dependency bump changes what they bundle.
common=(package.json pnpm-lock.yaml pnpm-workspace.yaml
  scripts/vercel-ignore-build.sh
  ':(exclude,glob)**/*.test.ts' ':(exclude,glob)**/*.test.tsx'
  ':(exclude,glob)**/*.spec.ts')

case "${1:-}" in
  web)
    paths=(apps/web libs/shared libs/database/prisma "${common[@]}"
      ':!apps/web/ios' ':!apps/web/android' ':!apps/web/fastlane'
      ':!apps/web/docs') ;;
  website)
    paths=(apps/website libs/shared "${common[@]}") ;;
  docs)
    # Standalone project, with its own lockfile
    paths=(apps/docs scripts/vercel-ignore-build.sh) ;;
  *)
    echo "Unknown app '${1:-}': building."
    exit 1 ;;
esac

if [ -z "$previous" ]; then
  echo "No previous deployment: building."
  exit 1
fi

cd "$(git rev-parse --show-toplevel)" || exit 1

if ! git cat-file -e "$previous^{commit}" 2>/dev/null; then
  # Vercel clones shallowly: fetch enough history to reach the commit
  git fetch --quiet --deepen=200 origin 2>/dev/null || true
fi

if ! git cat-file -e "$previous^{commit}" 2>/dev/null; then
  echo "Previous deployment ${previous:0:8} not in the clone: building."
  exit 1
fi

if git diff --quiet "$previous" "$current" -- "${paths[@]}"; then
  echo "Nothing changed for $1 since ${previous:0:8}: skipping the build."
  exit 0
fi

echo "Changes since ${previous:0:8}:"
git diff --name-only "$previous" "$current" -- "${paths[@]}" | head -20
exit 1
