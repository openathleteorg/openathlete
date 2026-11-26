# Apple Watch Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the release blockers remaining at `e875453a` before preparing a signed branch build.

**Architecture:** First make the web session owner authoritative across asynchronous auth and transport operations. Then scope Watch exit and recovery independently of general auth. Finally enforce event eligibility, durable ownership and one calendar per scheduling pass.

**Tech Stack:** TypeScript, Axios, Vitest, Swift, XCTest, WorkoutKit, Capacitor.

**Spec:** [Apple Watch schedule design](../specs/2026-11-25-apple-watch-schedule-design.md)

## Global Constraints

- Work on `feature/apple-watch-schedule` in the current checkout. DeepSeek implements; Sol reviews each task.
- The schedule covers today through day +7 in the athlete’s local calendar. Only the signed-in athlete’s workouts from the selected instance may sync.
- Keep pool scheduling disabled pending paired-device verification. Skip unsupported sessions individually.
- No new refresh-token persistence. Never assume delivery from a phone response or retry an unknown Apple write. No push, merge, signing or upload without approval.

## Review Focus

- Logout and preference writes interleaved with a successor login must not clear its credential or publish a stale profile (Task 1).
- An old or unknown exit marker must not disconnect a different account, including on launch (Task 2).
- Native connect with the wrong bearer must not alter any opt-in or scheduler state (Task 2).
- Submitting or replacing an entry must retain ownership when Apple returns both complete and incomplete copies (Task 3).
- Failed eviction read-back must stop further mutations; one frozen calendar must reach every adapter call (Task 3).

### Task 1: Make web authentication and transport session-owned

**Files:** `apps/web/src/contexts/auth/context/auth-provider.tsx`, `apps/web/src/utils/{auth,axios,socket-auth}.ts`, and their adjacent tests.

**Contract:** Extend the existing auth session snapshot with stable ownership across refresh rotation. Use `isAuthSessionCurrent(snapshot: AuthSessionSnapshot): boolean` (or adapt the existing equivalent) at state and transport boundaries. Capture both owner and API instance. Never substitute a successor’s token into an already-started request.

- [ ] Add controlled fixtures: old logout fence resolves after new login installs tokens; language change awaits while a successor logs in; Axios refresh awaits across account/instance switch; socket refresh resolves after successor login. Assert successor tokens survive, stale user publication and Watch-epoch changes are zero, stale requests never reach the adapter, and socket code never reinstalls tokens.
- [ ] Run `pnpm web test auth-provider axios socket-auth`; record failures before fixes.
- [ ] Bind authentication commits, user publication, logout clearing, Axios dispatch and refresh to the initiating owner. Refresh may rotate a credential only within that same owner; consumers do not install credentials from a refresh result.
- [ ] Rerun the focused tests and `scripts/verify.sh`; commit `fix(web): fence auth requests and writes to their session`.

### Task 2: Scope Watch exit, identity and recovery

**Files:** `apps/web/src/{utils/watch-schedule.ts,hooks/use-watch-schedule-sync.ts,views/dashboard/settings-view/apple-watch-schedule.tsx}`, `apps/web/ios/WatchScheduleCore/Sources/WatchScheduleCore/WatchScheduleLifecycle.swift`, `apps/web/ios/App/App/WatchSchedulePlugin.swift`, and adjacent tests.

**Contract:** Delayed exit retry consumes its saved `UnconfirmedWatchScheduleExit`, not the currently displayed scope. Unknown scope may attempt only `recover()` against previously authorized teardown, never create one. Clear the marker only on positive acknowledgement for that exact operation.

- [ ] Write regressions: mount B with A’s exit marker (zero unscoped calls); `recover() == false` preserves marker; cold logout with no JS scope attempts durable recovery after fence acknowledgement; mismatched native identity or denial cannot retire or change an opt-in; a fence while recovery awaits the opt-in read prevents stale restoration.
- [ ] Run `pnpm web test watch-schedule use-watch-schedule-sync apple-watch-schedule` and `swift test --package-path apps/web/ios/WatchScheduleCore`; record expected failures.
- [ ] Share retry semantics across launch and settings. Prove native athlete identity before permission or teardown changes, recheck epoch after awaited reads and immediately before restoring a binding, and preserve current-scope status on unrelated recovery.
- [ ] Rerun checks, run `scripts/verify.sh`, and commit `fix(ios): scope Watch exit recovery and authorization`.

### Task 3: Preserve scheduling ownership through skips and eviction

**Files:** `apps/web/ios/WatchScheduleCore/Sources/WatchScheduleCore/ScheduleReconciler.swift`, `apps/web/ios/WatchScheduleCore/Tests/WatchScheduleCoreTests/ScheduleReconcilerTests.swift`, `apps/web/ios/App/App/{WatchSchedulePlugin,AppleWorkoutStore}.swift`.

**Contract:** Freeze one `Calendar` per pass and pass it to all store operations. An entry is displaceable only when the actual Apple UUID and normalized date match a confirmed, owned, incomplete receipt. Never treat a failed read-back as absence.

- [ ] Add regressions: unsupported edit to existing ride at capacity allows later valid run; Paris pass passes Paris into removal despite New York startup; `{}` journal rejects; immediate post-submit and replacement return mixed copies yet retain ownership; wrong-date victim stays, and failed eviction read-back yields zero subsequent mutations.
- [ ] Run `swift test --package-path apps/web/ios/WatchScheduleCore` and record expected failures.
- [ ] Drive removal, replacement and capacity from effective per-event dispositions. Thread the frozen calendar through reads and removal. Validate journal document shape and keep receipts for incomplete siblings in each confirmation path. Stop the pass on unconfirmed eviction.
- [ ] Rerun debug/release Swift tests and `scripts/verify.sh`; commit `fix(ios): preserve watch ownership through scheduling changes`.

### Task 4: Verify release readiness without shipping

- [ ] Give Sol the whole stabilization diff and each task’s test evidence. Recheck original release-blocking reproductions together; do not mark a residual blocker as passing.
- [ ] Run macOS `bundle exec fastlane ios check` from `apps/web` on an authorized runner. Record unavailable checks separately; a Linux parse is not a build.
- [ ] Request maintainer approval for a signed branch build only after review and the macOS build pass. Use the [paired-watch checklist](../../../apps/web/docs/apple-watch-schedule.md) for real run/ride delivery. Keep pool disabled until its separate acceptance passes.
