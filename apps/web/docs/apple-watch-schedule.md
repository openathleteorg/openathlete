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
- Opt-in is stored per account (`UserDefaults`, not a credential). It only lets
  a background wake-up know that this account asked for scheduling.
- Connect/refresh/disconnect are serialized by the lifecycle actor. Logout,
  disconnect and instance switch bump an epoch and call
  `ScheduleReconciler.invalidate()` immediately, so an in-flight fetch cannot
  schedule anything; the call then waits for the pass to drain.
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
  decides whether and when it runs; there is no promised delivery time. On task
  expiry the pass is cancelled and the next request is resubmitted while the
  account remains opted in.

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
| Portable core tests (Linux Swift 6.1.2) | 174 passed, debug and release |
| Web unit tests (`pnpm web test`) | passed, including the settings section and lifecycle hook |
| `scripts/verify.sh` | see the task report; lint/types/translations/unit run |
| `scripts/verify.sh --e2e` | blocked on this host: Docker is unavailable, no stack was started |
| `fastlane ios check` (real Xcode build) | **not run**, this host is Linux (no Xcode/xcodebuild) |
| `fastlane android check` | **not run**, this host has no Android/JDK build lane |
| Paired iPhone + Apple Watch, all steps above | **not run**, no Apple hardware |
| WorkoutKit/HealthKit type-check against the iOS SDK | **not run**; the app-target Swift is parse-checked only |
| Pool scheduling | **disabled** until the paired-device gate passes |
