# Apple Health sync: setup and operation

This guide describes the implemented iOS integration. See [architecture and limits](healthkit-integration.md), the [workout API](healthkit-workout-api.md) and the [PR review](healthkit-pr-review.md).

## Build and signing

1. Use Node 22, pnpm 9, Xcode and the Ruby/Bundler/CocoaPods versions described in `mobile-releases.md`. Run `pnpm install --frozen-lockfile`, `pnpm database run db:generate` and `pnpm shared build` at the repository root.
2. Apply the two database migrations on the selected server through its normal deployment process: daily metric provenance/HRV SDNN and activity source reconciliation. Existing activity links and provider IDs are backfilled; no activities are deleted. Review index creation and backfill cost before deploying on a large database.
3. Native users select their server on the app's server screen. For a private build, `VITE_API_BASE_URL` and `VITE_WEBSITE_URL` may be supplied locally. Never commit an instance URL, credentials, signing team or personal bundle identifier.
4. In `apps/web`, build with `CAPACITOR=true pnpm build`, then `pnpm exec cap sync ios`. Open `ios/App/App.xcworkspace`.
5. Select the App target and your signing team. Keep `org.openathlete` for the official app; use the app-only `OPENATHLETE_BUNDLE_IDENTIFIER` build setting for a private identifier. Do not override framework identifiers. Enable HealthKit and HealthKit Background Delivery for the App ID and regenerate signing profiles with both entitlements. Debug and Release entitlements already declare them. This app requests Health reads only.
6. Use the standard unsigned check: `bundle exec fastlane ios check`. It checks the Capacitor JSON adapter and builds for the simulator. Its Firebase placeholder is for CI only: remove it before signing a personal build without Firebase. Do not ship the placeholder.
7. Select the connected iPhone in Xcode and run. The real HealthKit permission/data flow requires a physical device. Enter login credentials in the app; never put them in source or scripts.

## Use

Open Settings > Connectors to configure Apple Health measurements and Apple Watch activities separately. Choose history (7, 30, 90 or 365 days), measurement categories, workout sensors and optional routes. Approve local reading, then separately approve sending data to the displayed instance. Approval is remembered for that exact account, server and selection. Changing scope requires approval again. Enable automatic sync only if wanted. Apple's Health permission sheet is independent; an empty result cannot tell the app whether access was denied or data is absent.

The main menu links **Sync & import** between Metrics and Messages. **Sync now** reads and sends already-approved scopes with separate progress/results. Opening this page does not request Health access or upload data. **Import file** opens the existing FIT/GPX/TCX import dialog. Connections and scope choices stay in Settings; file import is no longer duplicated there. Strava is shown as an automatic server connection: there is no new manual Strava catch-up API in this change.

Local preview controls remain available in connection settings for inspection and troubleshooting. Preview-only measurements are labelled there. Ordinary sync needs no repeated agreement checkbox. A large history can require several bounded reads. Keep local previews after an upload error and retry: stable workout UUID/revision and daily metric keys make acknowledged retries idempotent. Diagnostics expose safe stage/reason codes, not samples, credentials or raw server responses.

## Automatic delivery and privacy

Native observer queries register at app launch. Enabled scopes use HealthKit background delivery; foreground activation, protected-data availability and connectivity recovery also retry. The worker saves anchors and receipts, serializes against manual sync, bounds each attempt and backs off after failure. Observer deliveries are acknowledged after the bounded attempt records its progress or retry state. iOS controls execution: force quitting, locking, unavailable Health data, network loss and expired credentials can delay transfers. No exact schedule or continuous execution is promised.

Caches are atomic, protected with complete file protection and excluded from backups. Background credentials use the device-only Keychain. Server/account changes and logout invalidate pending work and clear local state; failed protected-file cleanup is retried after unlocking. Bridge payload logging is disabled. Uploads use the selected HTTPS API and never a hosted fallback.

Imported daily metrics remain subject to existing instance/coach visibility. Workout raw source revisions are stored for reconciliation and are included in account export only when the user opts into activity streams; default export includes source identities and revision metadata. Deleting the athlete account cascades to attached and unresolved source records and their observations.

## Device acceptance before release

- Grant only selected Health categories and optional routes; verify denied/no-data behaviour without repeated consent prompts.
- Import HRV SDNN, resting HR, sleep, weight/body fat and a Watch workout; confirm values/units/dates and one canonical activity after the matching Strava/Garmin recording arrives in either order.
- Retry after lost connectivity and after a token expires. Confirm no duplicate activities, no lost preview and visible per-source results.
- Enable automatic sync, add a new recording, background/reopen/lock/unlock and confirm eventual delivery. Check that disabling sync and changing server/account prevents further transfer under the old consent.
- Confirm coach visibility, account export with/without raw streams, and complete account deletion on a disposable account.
- Do not interpret a simulator build or synthetic test as proof that personal Health uploads or background delivery worked on a device.

## Automatic sync frequency

Automatic Health sync attempts are limited to one per 3,600 seconds for the configured account. The attempt time is persisted before token refresh, network calls or Health reads, so failed attempts, observer events, app activation and process restarts cannot shorten the interval. Longer retry backoff is respected. Large historical imports continue in the next automatic window, or can be continued sooner using manual Sync now. Manual sync does not use the automatic frequency gate. iOS background delivery is requested hourly; this is a maximum frequency, not a guarantee that iOS will run the app every hour.


## Shared server-side activity review

The Sync & import page now includes Activity review for pending Garmin, Strava
and uploaded Apple Health workouts. Comparisons appear automatically; decisions
are persisted on the server and shared across web/iPhone. Link preserves canonical
edits and training links, import separately creates a distinct activity, and ignore
suppresses future source revisions. The original upload protocol and receipt IDs
remain unchanged. No extra Health reading/upload consent is requested for reviewing
data already uploaded. A native rebuild from this branch is needed to include the
updated bundled interface; keep signing settings and deployment URLs in ignored
local configuration. See the repository's activity-review guide for API details.
