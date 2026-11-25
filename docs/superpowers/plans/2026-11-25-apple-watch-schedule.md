# Apple Watch schedule implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After one opt-in, schedule the athlete’s next eight calendar dates of supported training in Apple's Workout app.

**Architecture:** The existing iPhone app reads the athlete's calendar from the configured instance. A native Swift module maps original workout steps and athlete zones into WorkoutKit plans; a serialized reconciler owns scheduling and cleanup. Foreground and background refresh share the same native pipeline, independent of PR #106.

**Tech stack:** React, Capacitor, Swift, WorkoutKit, BackgroundTasks, XCTest and Vitest.

**Spec:** [Approved design](../specs/2026-11-25-apple-watch-schedule-design.md)

## Global constraints

- Today through day +7 inclusive in local calendar dates; no rolling 192-hour cutoff.
- Running, cycling, pool swimming. Pool custom workouts require watchOS 11 or later. Gate native APIs by runtime availability, not an app-wide deployment-target increase.
- Metres or yards for pool input; preserve absolute distances in metres. Never infer pool length, send-offs or athlete thresholds.
- No paywall, external service, HealthKit read permission or watchOS target. Localize UI in all eight project locales.

## Review focus

- Saving a reopened yard prescription must not round the distance (task 1).
- A coach's zone ID or bounds must never substitute for the session owner's (task 2).
- Daylight-saving changes and incomplete reads must not unschedule valid workouts (tasks 3–4).
- A crash halfway through a move or a repeat refresh must not duplicate a workout (task 4).
- A late background response after logout must not write to the next account’s watch schedule (tasks 4–5).

### 1. Pool distance entry

Files: `apps/web/src/components/session-builder/{step-panel.tsx,swim-distance.ts,swim-distance.test.ts}`, `apps/web/src/components/workout/step-form.tsx`, `apps/web/messages/*.json`.

- [ ] Add failing tests for `toMetres(value: number, unit: 'm' | 'yd'): number` and `fromMetres` with the same signature: `expect(toMetres(100,'yd')).toBeCloseTo(91.44,9)`; `expect(fromMetres(91.44,'yd')).toBeCloseTo(100,9)`. Verify changing only the display unit and saving leaves the original stored value unchanged.
- [ ] Run `pnpm web test swim-distance` and observe the missing conversion. Implement the converters and unit control in swim distance editors, bypass whole-metre rounding for pool distances, preserve metres for old sessions. Leave rest in seconds.
- [ ] Repeat the test, check locale parity, and commit `feat(web): support yard distances in pool workouts`.

### 2. Native prescription mapper

Create Swift package `apps/web/ios/WatchScheduleCore` with `Sources/WatchScheduleCore/{Prescription.swift,WorkoutMapper.swift}` and matching `Tests/WatchScheduleCoreTests/WorkoutMapperTests.swift`. Put the Apple-framework adapter in `apps/web/ios/App/App/AppleWorkoutStore.swift`.

- [ ] Specify `mapPrescription(_ event: TrainingEventInput, zones: [ZoneInput]) -> MappingResult` (`plan(PlanInput)` or `unsupported(Reason)`). Define Codable inputs from actual calendar/detail/zone responses, preserving original units, nested repeats, metric, training zone ID and sport. Test: `XCTAssertEqual(mappedPowerRange, 210...245)` for the owner's cycling zone; verify different-owner and different-sport bounds cannot match. Check slower pace becomes the lower speed bound.
- [ ] Run `swift test --package-path apps/web/ios/WatchScheduleCore`, expect missing mapper. Implement warmup, work, rest, cooldown, fixed repeats and open/time/distance goals; reject unsupported structures, targets and multiple alerts explicitly. Test four repeats of 91.44 m with 20 s rests, unchanged 100 m repeats, zone edits and missing bounds.
- [ ] Implement `makeWorkoutPlan(_ input: PlanInput, id: UUID) throws -> WorkoutPlan` using native sport, goal and alert capability checks. Verify meter and yard fixtures on the Apple SDK before accepting pool mapping. Run package tests plus an iOS build and commit `feat(ios): map planned sessions and athlete zones to WorkoutKit`.

### 3. Own-calendar snapshot

Create `ScheduleSource.swift` and `ScheduleSourceTests.swift` in the Swift package. Implement the transport in `apps/web/ios/App/App/WatchScheduleClient.swift`. Use `apps/web/src/api/event/event.api.ts` as the existing wire contract.

- [ ] Test `loadSnapshot(scope: AccountScope, now: Date, calendar: Calendar) async throws -> ScheduleSnapshot` with a fixture transport. Assert ordered eligible IDs for today, day +7 and day +8 are `[todayID, plusSevenID]` across a DST transition. Test coach-authored sessions, an empty complete response, an expired credential, failed detail/zone lookup, and a foreign athlete.
- [ ] Run package tests red, then implement date arithmetic with `Calendar`, own-athlete range query, event details as needed, zone lookup and instance-scoped authentication. A list failure throws; a failed detail/zone read is retryable, not a cancellation. Snapshot contains all owned in-window IDs before filtering, mapped candidates, completed IDs and per-event reasons.
- [ ] Repeat tests green and commit `feat(ios): read an account-scoped watch schedule snapshot`.

### 4. Reconcile with Apple's schedule

Create `ScheduleReconciler.swift` and `ScheduleReconcilerTests.swift` in the package; extend `AppleWorkoutStore.swift` to implement the store protocol.

- [ ] Test `reconcile(_ snapshot: ScheduleSnapshot, scope: AccountScope, generation: UInt64) async throws -> SyncSummary` against a fake store and durable receipts. Assert `count(eventID) == 1` after rerun, edit, crash during move and retry; assert canceled IDs are absent, completed entries are not rescheduled, changed zone bounds cause replacement, unreadable details keep prior entries and foreign entries survive.
- [ ] Run tests red. Persist stable plan UUID, scope, scheduled date, prescription fingerprint and pending operation before writing. Serialize work; recheck the active generation before writes. Compare with actual Apple state; separate confirmed unsupported changes from transient read failures. Sort by day, time, event ID and respect Apple's runtime capacity. Test overflow becoming schedulable on a later pass.
- [ ] Run tests green; commit `feat(ios): reconcile owned Apple Watch workouts safely`.

### 5. Opt-in, lifecycle and acceptance

Create `apps/web/ios/App/App/WatchSchedulePlugin.swift`, `apps/web/src/views/dashboard/settings-view/apple-watch-schedule.tsx` and adjacent UI tests. Wire through native app lifecycle, Xcode target, signing entitlements, Info.plist, settings view and locale catalogs. Record device checks in `apps/web/docs/apple-watch-schedule.md`.

- [ ] Write failing bridge/UI tests for native iPhone only, unsupported device, denied/revoked permission, explicit refresh, last success and skipped/overflow counts. Fake logout during a fetch and assert `writesAfterLogout == 0`. Run `pnpm web test apple-watch-schedule` and package tests.
- [ ] Expose `status()`, `connect()`, `refresh()` and `disconnect()` via Capacitor. Trigger refresh on connect, launch/resume and own calendar/zone invalidation. Register opportunistic iOS background refresh; cancel on expiration and resubmit while enabled. Store only device-protected, scoped credentials needed for fetch; if authentication expires, defer to foreground. Invalidate scope on logout, disconnect and instance switch, purge credentials, journal pending cleanup and finish it before scheduling for another account.
- [ ] Run unit tests, `scripts/verify.sh`, `scripts/verify.sh --e2e`, and the repository’s Android/iOS fastlane check lanes on supported hosts. Exercise settings with a mocked bridge; verify no entry on web or Android. Device-test one real guided run, ride and pool session; include both pool units, edit/move/cancel, +7/+8, repeated refresh and revoked authorization. Record OS versions, observed results and untested cases separately. A successful phone call does not prove delivery to the watch.
- [ ] Commit `feat(ios): enable automatic Apple Watch scheduling`.
