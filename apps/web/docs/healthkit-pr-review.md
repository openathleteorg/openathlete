# HealthKit PR review

Review date: 2026-10-20. Scope: the iOS client, metric backend, workout backend and shared provider reconciliation, consolidated on current upstream `main` into `feature/healthkit-sync`. The PR is a draft: the implemented import is useful, but the broader original sync requirements are not all complete.

## Consolidation and scope

Includes the iOS branch, daily metric backend, workout backend, shared client/backend contract fixtures and the backend-only JSON parser/refresh-token fixes. Existing branches are preserved. The consolidated branch has a new history based on upstream main so obsolete private deployment values and exploratory commits are not published in its ancestry. No local build credentials, personal server URL, Health samples, generated bundle or Firebase placeholder belongs in the PR. The unrelated Zwift investigation document is excluded. Upstream dependency updates are inherited from main rather than repeated as feature changes; generated iOS pod paths follow those versions.

## Findings addressed

- Workout-specific JSON parsing had disabled ordinary login JSON parsing. Include the server fix and HTTP regression tests for login/refresh, normal limits, large bounded workouts, OAuth forms and webhook raw bytes.
- Invalid refresh tokens produced server errors. Include the server fix and token/error tests; database errors remain distinguishable.
- The source-record tables lacked account export coverage. Export source/revision metadata by default and raw source observations only on stream opt-in, one record at a time. Include attached and unresolved sources in the shared account-deletion fixture and test cross-account export isolation.
- Observer completion was signalled before its scheduled sync attempt. Defer each acknowledgement until the bounded attempt has persisted progress/retry state; coalesce subsequent notifications for the next attempt. Background workout receipts now also validate the dispatch field, like foreground receipts.
- Correct stale consent/error wording in all five locales: automatic sync is optional, retries do not require agreeing again, and a read failure does not claim that no background transfer ever happened.
- Keep upstream signing-team defaults while allowing an app-only local bundle-ID override.
- Replace the accumulated device-debug diary/proposals with current setup, architecture and explicit limits. Keep tests that exercise real regressions rather than personal data or device details.

## Remaining merge/release decisions

- **Blocking for the full originally requested sync:** source deletion/tombstones, sample-level server provenance and the preview-only measurement families are not implemented. Either explicitly agree to this smaller first PR or implement those contracts before claiming full coverage.
- **Blocking for resolving every workout:** ambiguous receipts have no resolution workflow. Clear matches are automatic; preserve unresolved sources without counting duplicate training load.
- **Required device acceptance:** successful manual upload, retained consent and eventual native background sync after network loss/lock/token refresh still need recorded acceptance on the consolidated build. Prior successful installation is not upload acceptance.
- **Release requirements:** update App ID/profiles for HealthKit Background Delivery; validate default/Release signing, privacy policy/App Store disclosures and existing coaching/AI uses of imported data. No App Store submission is part of this PR.
- **Migration review:** two migrations; one replaces global external-ID uniqueness, backfills source athlete identity and legacy source links. Evaluate backfill/index cost and mixed-version deployment before a large production rollout. No destructive down migration or automatic deployment is included.

## Validation

- `scripts/verify.sh`: passed on the consolidated branch (generation, locale parity, lint, types and every unit test in America/New_York).
- Full PostgreSQL integration suite: **27 suites, 166 tests passed** after applying every migration to a new disposable PostgreSQL 17/pgvector database. This includes HTTP contract validation, concurrent imports, both arrival orders, revision/queue retries, user edits, account export and account deletion. A second full run exposed unscoped workout-test queries; all assertions now filter their own athlete. The shared fixture uses genuinely expired timestamps to avoid app/database clock skew.
- Swift core: **23 tests passed**; the actual Capacitor converter regression passed. Standard `bundle exec fastlane ios check` passed after the observer change, including Release simulator compilation and web/Capacitor sync. An additional clean unsigned Release simulator build passed with upstream signing-team defaults restored.
- Docs: standalone frozen-lockfile installation, `types:check` and production build passed.
- Production API/web/worker images built and started healthy in an isolated Docker Compose stack on the development machine. The stack has separate names, image tags, ports and a dedicated subnet; no live instance data/configuration was used. Playwright runs locally through SSH forwarding with installed Chrome, on desktop/iPhone/Android viewports. **126 E2E tests passed**, covering production metric/workout import, receipts and revision conflicts, account isolation, self-hosting, FIT/GPX/TCX import, desktop and phone navigation/layout. Three stale capability/mobile-locator assertions exposed by the first run were corrected; the full rerun passed.
- Android native check was attempted and is **blocked** by the local Java 8 trust-chain failure downloading Gradle; Java 21/Android SDK CI is still required. Generated Android dependency-path drift is excluded.
- Personal HealthKit/manual/background device acceptance is **pending**. Synthetic fixtures, browser viewport tests and an unsigned native build do not prove OS delivery or personal-data upload success.

No personal Health data, login credentials or deployment URLs were used in test fixtures. Repository checks do not replace maintainer migration/privacy review.

## Apple references

- [HealthKit authorization](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data): a read request completing does not reveal whether every type was granted.
- [Observer query completion](https://developer.apple.com/documentation/healthkit/executing-observer-queries): completion follows processing of the delivery.
- [Background delivery entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.healthkit.background-delivery).
- [App Review Guidelines, Health and Health Research](https://developer.apple.com/app-store/review/guidelines/#health-and-health-research).

## Startup connection recovery (2026-10-21)

A single unanswered `/user/me` request previously latched the app into the offline screen until a browser `online` event or manual retry. A native web view may remain online throughout that failure. Authentication now retries with bounded backoff while visible and on focus/visibility/online recovery, coalesces simultaneous checks, and ignores stale checks after logout/unmount. Startup/profile and token-refresh requests have explicit timeouts. Refresh transport errors propagate without an unauthenticated follow-up that could erase valid credentials. The UI describes inability to reach the server rather than claiming the phone is offline, in all five locales.

Verification: the full lint/type/unit suite passed; 11 focused regressions passed; 12 production-browser auth/recovery tests passed, including deliberately failed profile and refresh requests with no connectivity transition. Signed iOS build and in-place device installation passed. These reproduce/fix recovery defects, but the original native transport failure is still under device investigation and is not claimed resolved.

## Manual Strava catch-up (2026-10-22)

The dedicated Sync page now has an explicit Strava action, separate from Apple Health. It starts a server-side catch-up and reports queue acceptance, not a completed import. It requires an active connection with activity imports enabled. Repeated taps are disabled for one minute; the queue also coalesces requests per provider account for one minute. Failed POSTs are not automatically repeated. Results from an old account are not shown after switching accounts.

Contract: authenticated `POST /provider/strava/sync` with no body returns HTTP 202 and `{ "success": true, "queued": true }`. The account comes only from the signed-in athlete. Missing connections return 404; disabled imports return 400. Redis failures do not return a false success. Older servers produce a localized explanation in the app.

The new `provider-recent-sync` queue uses the existing activity-import enable flag, three attempts and exponential backoff starting at one minute. A separate queue prevents older history workers from treating a catch-up request as a full historical import during a rolling deployment. The worker rechecks consent and connection state and requests the 30 days preceding the queued request, capped at 1,000 summaries. Strava receives `after`/`before` parameters. Existing source links and provider IDs are filtered, and the normal activity-import reconciliation handles cross-provider matches. One-time full-import state is untouched. No database migration or new credentials are needed.

Server rollout: apply the backend/shared changes together, build the shared library and API, and deploy both API and worker with `ENABLE_ACTIVITY_IMPORT=true` on the worker. If self-hosting runs workers inside the API process, rebuild/restart that service. Do not treat an HTTP 202 as evidence that the worker imported the activity; verify new activities in the calendar or inspect the queue. The existing webhook problem has not been conclusively diagnosed by this catch-up feature.

Validation: final repository generation, translations, lint, types and all unit tests passed after the queue separation. Production browser coverage at iPhone width exercises the Strava POST and acceptance message alongside both Zwift upload paths. Extended verification passed API/web/website builds and agent tests, then stopped because the local Docker daemon was unavailable; PostgreSQL/Redis integration and full Docker E2E coverage remain required. The Strava endpoint was deployed from server commit e953d4a0: the API became healthy, the authenticated route returned HTTP 401 without a token, and one recent-sync worker was connected. The public health and authenticated-route probes also returned HTTP 200/401 respectively. A subsequently observed Date serialization failure was reproduced and fixed at the activity-worker boundary. BullMQ JSON timestamps are restored to Dates before provider access; malformed/reversed dates fail without provider calls. The corrected image was deployed and passed health, authenticated-route and worker probes. A previously failing live Strava import then completed successfully and produced its calendar activity; personal IDs/data are omitted here. All 17 targeted tests passed in Linux Node 22, including the real JSON roundtrip regression.

## Strava completion feedback (2026-10-22)

The Sync panel now follows the actual activity-import jobs, rather than stopping at queue acceptance. `POST /provider/strava/sync` additionally returns `syncId`; authenticated `GET /provider/strava/sync/:syncId` returns a shared, validated status and counts (`total`, `imported`, `needsReview`, `failed`, `pending`, `retrying`). Both endpoints derive the connection from the signed-in athlete; jobs from another connection return 404. Provider error bodies are never returned in status responses.

The worker records the activity-job manifest before enqueueing and retains it across listing retries. A completed listing with pending child jobs stays running; failed imports produce failure feedback, and ambiguous matches are not counted as successful imports. An explicit empty manifest means nothing new was found. Older workers or pruned job results produce “status unavailable”, never a fabricated zero/success. Queue retention remains unchanged; this is not a permanent sync history and needs no migration.

The app polls every three seconds while the Sync panel is open and the job is running, pauses polling in the background, and stops after a terminal result. A server/account-scoped session reference restores progress after navigation without issuing another sync. Network errors retrieving progress are distinguished from import failures. A completed or partly successful import invalidates calendar queries. Older servers without a sync ID still show the queue-acceptance message. Existing import consent, duplicate reconciliation and the 30-day catch-up range are unchanged.

Validation: repository generation, all locale checks, lint, types and unit tests passed. The targeted backend suite passed 23 tests, UI coverage passed 15 tests, and the production browser test passed at iPhone width (Strava running → completed, one POST, calendar refresh and both Zwift send paths). API and web production builds passed. The full Docker E2E stack was attempted but the local Compose installation rejects the existing top-level `name` property; it did not run.

Deployment: update shared/API and recent-sync workers together, then distribute a new native web bundle. An older iPhone build continues to work but cannot display the new completion feedback.

Rollout verification: the production API image built from commit `2e76dfd9` passed a real-Redis preflight with isolated synthetic queues (deduplicated IDs, pending/completed/failed imports, empty result and foreign-account denial). After deployment the API was healthy, one recent-sync worker was connected, and the same Redis checks passed again. Public health/status-route probes returned 200/401. No database migration or instance credentials were changed. Signed iOS build `2026102210` archived successfully and App Store Connect accepted the TestFlight upload; Apple processing/distribution is separate from upload acceptance.

## Branch organization

The fork keeps one branch for implemented iPhone work and one branch per future feature:

| Branch | Purpose |
| --- | --- |
| `main` | Unmodified upstream base, fast-forwarded from `openathleteorg/openathlete` |
| `feature/healthkit-sync` | All implemented iPhone/HealthKit work, self-hosted login recovery, Zwift uploads and manual Strava catch-up; upstream draft PR #106 |
| `feat/automatic-ftp-estimation` | FTP estimation discussion only; implementation deferred |
| `docs/activitypub-integration-proposal` | ActivityPub/FitPub proposal only; implementation not started |
| `docs/hammerhead-integration-status` | Hammerhead investigation only; deferred |

The intermediate HealthKit API, iOS, integration and proposal branches are superseded by `feature/healthkit-sync`. The custom MCP OAuth branch is retired: the common branch has no MCP differences from upstream, which already contains PR #96. Additional experimental MCP documentation/tests are not part of this iPhone PR. Historical refs and personal build overrides are retained in private local backups, rather than republished as archive branches. Personal signing, instance URLs and credentials remain outside tracked files.
