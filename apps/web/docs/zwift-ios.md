# Zwift workout upload on iPhone

The iOS app connects directly to Zwift using its unofficial private API. No OpenAthlete server endpoint, database migration or server-side credential storage is needed. This is an experimental connection: login, file upload, wrapped-file download and byte verification have now been confirmed on the user’s iPhone. Production diagnostics then confirmed the missing workouts.files entry. The client now registers and verifies that entry; the user has confirmed that the workout is visible in the Zwift game after restarting it.

## User flow

1. Settings → Connectors → Zwift: enter your Zwift email and password and select Connect Zwift. The password is cleared from the form immediately, used for login, and never persisted or sent to OpenAthlete. Access/refresh tokens are stored in this iPhone's Keychain, accessible only while unlocked and not transferable to another device. The connection is scoped to the current OpenAthlete server and account.
2. Open Sync & import from the main menu. Under Today's workouts → Zwift, select Send to Zwift beside the desired planned cycling workout. Today uses the iPhone's local calendar day; completed sessions are excluded. The workout is fetched again before sending so changed dates and completed sessions are rejected.
3. After Send to Zwift succeeds, fully close and reopen Zwift, then check Workouts → Custom. The app verifies both the uploaded .zwo bytes and the shared-directory update before reporting success. Zwift’s running game may still cache its workout list.
4. Disconnect in Settings to remove the locally saved tokens. This does not delete files already uploaded to Zwift or revoke all Zwift sessions.

## Supported export

- Cycling, virtual rides, gravel and mountain biking; structured timed steps only.
- Nested repeat blocks are flattened in order. Export is bounded to 600 visited steps, nesting depth 8 and six hours.
- Power as a fraction of cycling FTP is preserved. Absolute watts use the user's current FTP_CYCLING metric; missing FTP blocks export. Cadence is preserved. Ranges use their midpoint. Warmup/cooldown steps are exported at their prescribed target rather than inventing a power ramp.
- Steps without a power target use FreeRide. Step names and notes become text events. Names, descriptions and notes are XML escaped.
- Other sports, heart-rate/zone/pace/RPE targets, non-time durations and unsupported relative metrics block export. They are never silently converted to free rides.

## Native transport

- Login: form-encoded POST to secure.zwift.com/auth/realms/zwift/protocol/openid-connect/token with client_id=Zwift Game Client. Tokens never cross back into JavaScript. Refresh is done near expiry or once after a 401 rejection.
- Profile validation: GET /api/profiles/me on us-or-rly101.zwift.com.
- Device-validated upload contract: POST /api/zfiles, Source: zwift-companion, application/json, body {folder: customworkouts, name: deterministic .zwo filename, content: Base64 UTF-8 XML}. No fabricated game version or Android/OSX identity is sent.
- The upload response must identify the expected file in customworkouts. Downloads request Accept: */* and support bare files plus validated protobuf/JSON file envelopes. The extracted .zwo bytes must match exactly before registration continues. JSON-only download requests caused production HTTP 406; comparing the entire envelope against XML caused a second verification failure.
- Filename contains a hash of the OpenAthlete account/server scope and the event ID. Explicit retries reuse that filename, following the emulator's replacement behavior; production deduplication remains unverified. There are no automatic retries after ambiguous POST failures, background uploads, bulk synchronization or remote deletions.
- After file verification, the client reads the live customworkouts directory and workouts.files. It upserts only the exact uploaded filename, with checksum, stable positive GUID, timestamp and deleted=false. Existing workout entries, deletion history, unknown elements and attributes are preserved. Invalid/ambiguous directories are never replaced. A missing directory is created only if no other unindexed files exist. The manifest is read again immediately before publishing; concurrent changes trigger a fresh merge, bounded to three attempts. A verified re-download must match the published manifest. Without a server-side conditional-write contract, a race after the final comparison cannot be excluded; avoid concurrent editing in another Zwift session while sending.
- Requests use an ephemeral URLSession with no cookie/credential/cache storage, 30-second timeouts, TLS validation and no redirects. Errors expose static codes, never credentials, bearer tokens or response bodies. Only one native connection/upload operation runs at a time.

## Validation

On 2026-10-22, the user confirmed a real workout is visible in Zwift Workouts → Custom after restarting the game (build 2026102207). The iPhone verified the uploaded workout and merged directory by downloading them again. Diagnostic logs contain only static stages and HTTP status codes.

Build 2026102208 adds Send to Zwift directly to workout details for the signed-in athlete’s own planned cycling sessions, including future dates. Completed sessions and other athletes’ sessions do not expose this action. The Sync page remains limited to today. It also limits automatic Apple Health sync attempts to once per hour; manual sync remains available immediately.

Automated validation includes 13 Zwift Swift protocol tests, 25 HealthKit Swift tests, and 21 targeted web tests. Repository verification, fastlane iOS check and the signed device archive passed. The passing browser test exercises connection, upload from Sync and upload from workout details using synthetic server/native fixtures. Android validation remains blocked by the local Java trust store (PKIX failure downloading Gradle).

Native tests:

    swift test --package-path apps/web/ios/ZwiftCore
    swift test --package-path apps/web/ios/HealthKitCore

Latest signed local archive: /tmp/OpenAthlete-Strava-20261022.xcarchive (build 2026102209). Signature and HealthKit purpose strings were verified, and App Store Connect accepted the TestFlight upload. Build 2026102208 was also uploaded and was installed directly on the paired iPhone; build 2026102209 adds the manual Strava action.

## References

- Investigation supplied from the separate zwift-uploader project: research/zwift-iphone-integration.md (2026-10-22).
- Emulator reference, not proof of production behavior: https://github.com/zoffline/zwift-offline/blob/master/zwift_offline.py (api_zfiles) and workouts_manifest.py.
- Working authentication wrapper referenced by the investigation: https://github.com/rally25rs/zwift-api-wrapper.
