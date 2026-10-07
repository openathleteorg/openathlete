---
name: release
description: Cut and verify an OpenAthlete release, from choosing the version and running checks to the vX.Y.Z tag, GHCR images and GitHub release notes, including what self-hosters must know. Use when asked to release, tag or publish a version.
---

# Release

Versions follow SemVer:
- **patch**: fixes only;
- **minor**: features, or additive migrations;
- **major**: a change self-hosters must act on (a required env var, a breaking API change, a manual migration).

## Steps

1. `main` must be green: `gh run list -R openathleteorg/openathlete -b main -L 5`.
2. Run everything locally: `scripts/verify.sh --all`.
3. Collect what changed since the last tag:
   ```bash
   git describe --tags --abbrev=0
   git log --oneline <last-tag>..main
   ```
   Look for migrations (`libs/database/prisma/schema/migrations/`), new or renamed env vars (the `.env.example` files, compose files), and changes to `docker-compose.yml`.
4. Tag and push:
   ```bash
   git tag -a vX.Y.Z -m "OpenAthlete X.Y.Z" && git push origin vX.Y.Z
   ```
   `.github/workflows/release.yml` then:
   - builds and pushes `ghcr.io/openathleteorg/openathlete-{api,web}` for amd64 and arm64, tagged `X.Y.Z`, `X.Y` and `X`;
   - creates the GitHub release with generated notes;
   - uploads the iOS app to TestFlight and the Android app to the Google Play testing track (when `MOBILE_RELEASES` is `true`; see `apps/web/docs/mobile-releases.md`).

   A tag with a suffix (`v1.2.0-rc.1`) is published as a pre-release. Mobile builds need a numbered suffix (`-rc.1` to `-rc.98`), since the build number is computed from the tag: check with `node apps/web/scripts/mobile-version.ts vX.Y.Z` before tagging. A store refuses a build number twice, so never move a tag; push the next one.
5. Watch the run until it finishes: `gh run list -R openathleteorg/openathlete -w Release -L 1`.
6. Check the images are public and multi-arch, without logging in:
   ```bash
   docker manifest inspect ghcr.io/openathleteorg/openathlete-api:X.Y.Z | grep architecture
   ```
7. Edit the release notes (`gh release edit vX.Y.Z --notes-file ...`). Put an **Upgrading** section first, with:
   - migrations, which run automatically at startup;
   - new required or renamed env vars;
   - behaviour self-hosters will notice.

   Then the highlights in user terms, then the generated changelog.
8. Mobile apps: check both upload jobs passed. Once the maintainer has tried the TestFlight and Play builds, they ship them with the **Mobile promote** workflow (`gh workflow run mobile-promote.yml -f tag=vX.Y.Z`): Play production, and App Store review.
9. Draft a short announcement for Discord and GitHub Discussions for the maintainer to post.
