# Apple Watch scheduling

Opt-in iOS feature: planned running, cycling and (once verified) pool swimming
sessions are written to Apple's built-in Workout app through WorkoutKit, so the
athlete starts them from the watch with the prescribed steps. OpenAthlete stays
the source of truth; edits, moves and cancellations reconcile on the next pass.

This page is the operator/device-test record for the feature. **A successful
iPhone call is not proof of delivery to the watch.** WorkoutKit's
`schedule(_:at:)` returns without telling us that the watch received anything;
success in the settings screen only means Apple's phone-side scheduler reports a
matching entry.

## Where it lives

| Piece | Path |
| --- | --- |
| Portable lifecycle, opt-in, credentials, status | `apps/web/ios/WatchScheduleCore/Sources/WatchScheduleCore/WatchScheduleLifecycle.swift` |
| Snapshot read (own calendar, zones) | `.../ScheduleSource.swift`, `apps/web/ios/App/App/WatchScheduleClient.swift` |
| Reconciliation and durable journal | `.../ScheduleReconciler.swift` |
| WorkoutKit adapter | `apps/web/ios/App/App/AppleWorkoutStore.swift` |
| Capacitor plugin, Keychain vault, BG refresh | `apps/web/ios/App/App/WatchSchedulePlugin.swift` |
| Plugin registration | `apps/web/ios/App/App/AppBridgeViewController.swift`, `AppDelegate.swift`, `SceneDelegate.swift` |
| Settings section | `apps/web/src/views/dashboard/settings-view/apple-watch-schedule.tsx` |
| Foreground/resume/invalidation sync | `apps/web/src/hooks/use-watch-schedule-sync.ts` |
| Bridge types | `apps/web/src/utils/watch-schedule.ts` |

## Requirements and scope

- iOS 17 or later, with a paired Apple Watch. `WorkoutScheduler.isSupported`
  is checked before every read/write; unsupported devices only see the
  explanation.
- WorkoutKit permission is requested once at opt-in. Denied or revoked
  permission stops all reads and writes and keeps the opt-in so the settings
  screen can explain how to re-enable it.
- Window: today plus the next seven local calendar dates (day +7 included, day
  +8 excluded), using the iPhone's calendar so DST is handled locally.
- Sports: running, cycling and pool swimming. Swimming is **mapping-only in
  release**: `PoolSwimNativeScheduling.isEnabled == false`, so pool sessions are
  skipped with `poolSwimmingUnverified`. Open-water swimming is out of scope.
- Only the signed-in athlete's own calendar and training zones are read. The
  coach's currently viewed athlete, templates, recorded activities and
  completed sessions are ignored.
- Hidden on the web and on Android: neither platform mounts the settings
  section nor calls the bridge.

## Credentials, scope and lifecycle

- The only credential persisted is the **current access token with its
  expiry**. It lives in a Keychain generic-password item with
  `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`, scoped to the exact
  instance URL + athlete ID. A token without an expiry is never stored, so
  background work cannot use an unbounded credential.
- The **refresh token never crosses the bridge**. Foreground passes pass the
  current access token; a background pass may only use the stored token until
  it expires. On expiry the credential is purged and the pass defers to the
  next foreground sign-in.
- The native transport proves the pinned bearer's identity with
  `GET /athlete/me` before the opt-in is saved and before any calendar list is
  treated as authoritative, including an empty one. The fixture in
  `ScheduleSourceTests.testOwnAthleteFixtureUsesTheActualAPIWireShape` pins the
  response shape; a mismatched `athleteId` is a `scopeMismatch`, never an empty
  calendar.
- Opt-in is stored per account (`UserDefaults`, not a credential). It only lets
  a background wake-up know that this account asked for scheduling.
- Connect/refresh/disconnect are serialized by the lifecycle actor. Logout
  bumps an epoch and fences the reconciler immediately, even when no opt-in
  exists yet: a permission sheet or opt-in save that resolves later can never
  enable a signed-out account. A fence acknowledgement (`fence`) does not wait
  for Apple; the web clears auth state after that acknowledgement (bounded by a
  short timeout), then cleanup continues.
- Cleanup authorization is written to a separate device-protected teardown file
  **before** the opt-in is cleared, and only after writes and credential use
  have already been revoked: a stalled storage write cannot let a paused
  session continue. If the app crashes, the journal is unreadable or a Keychain
  purge fails, the teardown survives and the next account must finish it before
  scheduling. Unreadable teardown/journal state is reported as unknown, never
  as empty. A crash between the teardown write and the opt-in clear is repaired
  by clearing the stale opt-in; that account is not re-enabled automatically.
  If Application Support itself is unavailable, the runtime stays disabled:
  there is no temporary-directory fallback.
- The native fence acknowledges only when the opt-in was actually retired
  (read/clear errors are not ignored) and its absence was read back, including
  when there was no target opt-in. A malformed stored opt-in is unknown, not
  absent. A timeout, bridge rejection or incomplete fence is not treated as
  success: sign-out still escapes, but the app keeps an unconfirmed marker, the
  settings screen surfaces it, and a server switch is refused until
  acknowledged. A native fence guard is set before the first await and blocks
  connect, foreground and background passes while teardown authorization is
  pending, including on a cold runtime.
- Each fence-persisting, recovery and drain operation owns its own guard token;
  releasing one operation can never clear another's. The urgent fence and its
  durable acknowledgement serialize only with opt-in mutation (a second, narrow
  lock), never with a network pass, the permission sheet or Apple work: a
  suspended fetch or permission request cannot delay logout's acknowledgement.
  Opt-in saves and clears recheck the fence and session epoch inside that lock.
- A scoped disconnect waits for the pass that owns the lifecycle gate, then
  validates the exact account under the opt-in lock before touching the epoch,
  guard, opt-in, credential, reconciler generation or the background refresh
  request. A stale request for a previous account is read-only: B's connect or
  pass is not fenced by it.
- The web keeps a synchronous session/exit latch as well as an epoch. Logout and
  instance switches set the latch before their first await; while it is set,
  even work started at the newest epoch is refused because the previous access
  token is still in storage. Only an explicit successful authentication
  (login, signup, provider or SSO) establishes the successor and clears it; a
  bootstrap or refresh `getMe` never does, never publishes its user after a
  logout and never releases a newer exit. A launch or settings retry that
  fences accepts only the exact epoch boundary it created, never an arbitrary
  newer epoch. Every second status read is rechecked after it resolves, and
  each settings action checks the latch before it starts and after each await.
- A persisted zero-byte teardown document is corrupt/unknown, never an empty
  allow-list. Recovery proves the old opt-in read and clear (including a
  read-back) before deleting teardown authorization. `cleanupUnknown` dominates
  the other flags and pauses: launch and settings do not issue an unscoped
  disconnect; the settings screen and launch path use the dedicated recovery,
  and the screen offers a safe retry that only acts on authorized teardown.
- `hasOtherAccountOptIn` means exactly a readable opt-in for another account. A
  teardown for A with an opt-in for B is cleanup for A and never authorizes
  disconnecting B. Recovery acts only on existing durable teardown: it never
  reads an opt-in as cleanup permission and never retires a foreign opt-in.
  An explicit connect of the signed-in account is what persists that account's
  own teardown authorization before replacing a foreign opt-in. An unreadable
  or malformed opt-in fails closed.
- Recovery of an absent teardown is a no-op: it does not bump the epoch, fence
  the reconciler or cancel a background request. Recovering another scope's
  teardown waits for the signed-in account's pass and preserves its opt-in,
  credential and active generation; it never cancels the current background
  request. Credential retirement is scope-aware, so recovering an old account
  never purges the account currently signed in.
- The opt-in document is decoded from `UserDefaults.object(forKey:)`: only a
  missing key is absent. A present value of the wrong type, invalid JSON, an
  empty document or a non-positive athlete is corrupt and is never erased or
  acknowledged as a successful retirement. Synchronous background scheduling
  submits nothing for a corrupt value.
- Cleanup runs under the **exact stored scope and generation**: the reconciler
  is re-activated for that scope only after the pass drained, cleanup removes
  only journal-owned, non-completed entries, then the fence and credential are
  cleared. The journal is never reset. Removals Apple has not confirmed stay as
  durable cleanup intents (`retainedEventIDs`) and are finished before another
  account may schedule (`.pendingCleanup` / `.unresolvedWrite`).
- Apple's completed sessions are history: they are never removed and are
  tombstoned so a recurring event cannot be scheduled again.
- Amber states in the settings screen are real retention, not success:
  - `unresolvedEventIDs`: a submitted workout Apple's scheduler does not show
    yet. Nothing is retried with the same UUID and no other session is written
    past it.
  - `pendingCleanupEventIDs`: a removal Apple has not confirmed.
  - `otherAccountPending`: the same, for a previous account. It blocks
    scheduling for the current one until resolved.
- Background refresh uses `BGAppRefreshTask`. It is opportunistic: the OS
  decides whether and when it runs; there is no promised delivery time. The
  request's earliest date is a short delay (5 minutes) and is submitted only if
  the stored token remains valid for another margin (10 minutes). With a
  one-hour token that works; a token that cannot outlive the window submits
  nothing and waits for the next foreground refresh. On task expiry the pass is
  cancelled and the next request is resubmitted while the account remains
  opted in.
- Native Capacitor bridge logging is off in every build mode
  (`ios.loggingBehavior: 'none'`) because bridge calls carry access tokens.
  The JS bridge never persists credentials and logs none.
- Status exposes only the current account's event IDs and its own sync state.
  Per-account state means a speculative or failed pass for one scope cannot
  rewrite another account's last success, error or counts. Another account
  contributes only `otherAccountPending`; a same-account teardown is
  `cleanupPending`, not an "other account" flag. `cleanupUnknown` means the
  durable state could not be read. Token expiry is not exposed. Submitted
  writes (Apple may have them) are separated from local or planning-stage work
  that is safe to retry.

## Device acceptance — required before release

Nothing below has been run on Apple hardware yet. Record the iPhone model, iOS
version, watch model and watchOS version for each run, and keep observed results
separate from untested cases.

Build and install:

```bash
cd apps/web
bundle install
bundle exec fastlane ios check          # simulator build, no signing
# or archive/TestFlight through the release lane when signing is available
```

1. **Opt-in and permission** — Settings → Connectors → Apple Watch workouts →
   Enable. Accept WorkoutKit/Health permission on the iPhone. Expect
   "Scheduling is on" and a last-updated time.
2. **Guided run** — plan today's structured run, enable, refresh. On the watch:
   the workout appears on the planned day in Apple's Workout app with warmup,
   intervals, repeats and cooldown. Start it: execution stays in Apple's app.
3. **Guided ride** — same for a power/HR-target cycling session. Confirm the
   target is an alert on the watch, and that the plan's title and step order are
   right.
4. **Pool session, both units** — with the pool gate still off, confirm the
   session is skipped and the settings screen shows the pool explanation.
   When deliberately enabling the gate for acceptance, test both:
   - 4 × 100 m in a 25 m pool with 20 s rest;
   - 4 × 100 yd in a 25 yd pool with 20 s rest;
   and a prescription whose pool length differs from the watch's selected pool
   length. Check distances are not rescaled and rest steps are preserved.
5. **Day window** — a session today and a session on day +7 appear; a session
   on day +8 does not.
6. **Edit, move, cancel** — edit a step, move a session to another day, cancel
   one. Refresh and confirm exactly one entry per session, at the new date, with
   the new steps, and no duplicate. Confirm a completed session is not
   rescheduled.
7. **Repeated refresh** — refresh several times, including app relaunch and
   resume. Confirm Apple's list still contains one entry per session.
8. **Revoked authorization** — revoke Health/WorkoutKit permission in iPhone
   Settings, return to the app, refresh. Expect writes to stop, the permission
   explanation, and the previous upcoming entries to remain until cleanup can
   run.
9. **Logout / instance switch** — with entries scheduled, log out (or switch
   server). Confirm only the previous account's upcoming entries are removed,
   completed history stays, and the new account starts with scheduling off.
   With Apple's scheduler reporting an unreadable state, confirm the removal is
   retained and surfaced, then retried before the next account schedules.
10. **Background opportunity** — background the app overnight with a valid
    stored token and an edited session. Confirm that a refresh opportunity, when
    the OS provides one, applies the edit; confirm the app makes no attempt
    after the token expires. Do not treat "no wake-up" as a bug: this is
    opportunistic.
11. **Offline recovery** — start a refresh in airplane mode, then reconnect.
    The partial read must leave the existing entries and retry later.

Pool acceptance also requires both native pool units and a mismatched pool
length to match the prescription exactly. Until then, keep
`PoolSwimNativeScheduling.isEnabled` false.

## Verification status on this change

| Check | Result |
| --- | --- |
| Portable core tests (Linux Swift 6.1.2) | 220 passed, debug and release |
| Web unit tests (`pnpm web test`) | passed, including settings, lifecycle hook, bridge logging/storage audit and server no-op |
| `scripts/verify.sh` | see the task report; lint/types/translations/unit run |
| `scripts/verify.sh --e2e` | blocked on this host: Docker is unavailable, no stack was started |
| `fastlane ios check` (real Xcode build) | **not run**, this host is Linux (no Xcode/xcodebuild) |
| `fastlane android check` | **not run**, this host has no Android/JDK build lane |
| Paired iPhone + Apple Watch, all steps above | **not run**, no Apple hardware |
| WorkoutKit/HealthKit type-check against the iOS SDK | **not run**; the app-target Swift is parse-checked only |
| Pool scheduling | **disabled** until the paired-device gate passes |
