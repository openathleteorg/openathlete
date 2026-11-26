# Planned workouts in the Apple Watch Workout app

## Athlete experience

An athlete enables Apple Watch scheduling once in the OpenAthlete iPhone app and grants Apple's scheduling permission. Their supported sessions appear on the planned day in Apple's built-in Workout app, ready to start with the prescribed steps. The window includes today and the next seven calendar dates. OpenAthlete is the source of truth for edits, moves and cancellations. No per-session action, separate account, watch app or paid plan is required.

## Approaches

- **Chosen: automatically schedule via WorkoutKit on iPhone.** This matches the requested TrainingPeaks experience and leaves workout execution to Apple.
- A manual “Add to Watch” preview can send individual sessions, but requires repeated action and does not keep the schedule current.
- A custom watchOS app could render proprietary workouts but would require athletes to leave Apple's Workout app. It solves a different problem.

## Proposed delivery scope

- Include structured running, cycling and swimming in the first release. Preserve the title, interval order, fixed repeat count, warmup, recovery, cooldown and time, distance or open goals. Support absolute pace, heart-rate, power and cadence targets where WorkoutKit supports the sport and alert. Check capabilities at runtime. If a prescription cannot be represented faithfully (including multiple simultaneous targets or unresolved zones), skip that session and show why. Do not silently turn intervals into an open workout.
- Swimming is pool-only in this release. Explain at opt-in that structured `SWIMMING` sessions are scheduled as pool sets; no new venue field or open-water support. Apple's [custom swimming workouts](https://developer.apple.com/videos/play/wwdc2024/10084/) support pool intervals on watchOS 11 or later. Preserve explicit rest steps; do not infer a send-off from target pace.
- Let the planner specify metres or yards for swim distances, independent of device region. Keep stored distances in metres (100 yd = 91.44 m exactly); existing metre prescriptions must not change. The pool length and the prescribed interval distance are distinct: switching pools must not rescale the workout. Test 4 × 100 m in a 25 m pool and 4 × 100 yd in a 25 yd pool, each with 20 seconds of rest. Direct entry in feet is outside the first release.
- Use the athlete's calendar dates as shown on their iPhone, including across daylight-saving changes. Query the signed-in athlete's own schedule from the selected instance, including coach-authored sessions. Ignore the coach's currently viewed athlete, templates, recorded activities and completed sessions.
- Implement a native iPhone bridge to WorkoutKit. Start with `EventAPI.getMyEvents` in `apps/web/src/api/event/event.api.ts` and retrieve missing workout detail before reconciliation. Check original step semantics before using any flattened export representation. No server-to-Apple service or Health data access is required. PR #106's completed-activity import is independent.
- Refresh on opt-in, app launch/resume and relevant local calendar changes. Request opportunistic iOS background refresh using an authenticated fetch of the same calendar; if authentication is unavailable, wait for the next foreground refresh. No promise of immediate delivery while the phone is asleep or offline.

## Reconciliation and controls

Persist an account- and instance-scoped association between each event and its WorkoutKit plan ID, last scheduled date and prescription fingerprint. Serialize refreshes. Compare against Apple's actual scheduled plans, not just local receipts. Skip unchanged sessions, replace changed ones, and remove canceled, superseded or out-of-window entries belonging to this integration. Do not reschedule a session Apple already reports completed. Preserve other apps' workouts and recorded history.

Only infer deletion from a complete, fresh calendar response. A failed detail fetch or interrupted update must remain retryable without producing duplicates. Prioritize nearest dates, then start time and event ID, up to Apple's runtime scheduling limit; show pending overflow and retry when space opens. Never claim receipt by the watch from a successful phone scheduling call.

Expose an iPhone setting with connection state, last successful refresh, skipped sessions and an explicit refresh action. If permission is denied or revoked, stop writes and explain how to enable scheduling. On disconnect, logout or account/instance switch, stop scheduling and remove only the previous account's upcoming OpenAthlete entries. Retain minimal pending cleanup IDs if Apple prevents removal; reconcile before scheduling for another account. Do not reuse old credentials. Hide the integration on other platforms; explain unavailability on unsupported iPhones. Localize user-facing text in all supported locales.

## Acceptance

Test mapping, capacity, date boundaries, account isolation and reconciliation with deterministic fixtures, including partial reads and interrupted writes. Build the native bridge on macOS. On a paired iPhone and Apple Watch, verify today's guided intervals, day +7 inclusion, day +8 exclusion, edit, move, cancellation, offline recovery, revocation and disconnect. Verify repeated refreshes create one entry and starting a session still uses Apple's Workout app. Background verification must distinguish a refresh opportunity from a guaranteed deadline.

## Zone resolution and acceptance

- **Zone-based prescriptions:** A `ZONE` step references an OpenAthlete training zone ID, not an Apple zone number. At sync time resolve it against the workout owner's zones, preferring bounds for the workout sport over the all-sports default. Do not borrow bounds from another sport. Carry the absolute pace, watts or bpm into the supported WorkoutKit step alert; retain both endpoints for a range. Convert pace to speed with correctly ordered bounds. Include resolved values in the fingerprint so a zone edit refreshes upcoming sessions without requiring an event edit. Test differing athlete and sport values, changed zones, reversed pace-to-speed ordering and missing or unsupported targets. A failed zone fetch is retryable, not evidence that a zone was deleted.
- See [Apple's WorkoutKit scheduling walkthrough](https://developer.apple.com/videos/play/wwdc2023/10016/).
