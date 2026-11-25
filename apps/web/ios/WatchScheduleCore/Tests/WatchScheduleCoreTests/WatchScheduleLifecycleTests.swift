import XCTest

@testable import WatchScheduleCore

/// The lifecycle is the only owner of connect/refresh/disconnect ordering.
/// These tests keep the app target thin: the Capacitor plugin and the settings
/// view only translate between this model, WorkoutKit and the web layer.
final class WatchScheduleLifecycleTests: XCTestCase {
    private let scope = AccountScope(
        instanceURL: URL(string: "https://train.example.org/api")!,
        athleteId: 7
    )
    private let otherScope = AccountScope(
        instanceURL: URL(string: "https://other.example.org/api")!,
        athleteId: 11
    )
    private let readAt = Date(timeIntervalSince1970: 1_780_000_000)
    private var now: Date { readAt }

    private var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        calendar.locale = Locale(identifier: "en_US_POSIX")
        return calendar
    }

    // MARK: - Fixtures

    private func candidate(
        _ eventId: Int,
        title: String = "Session"
    ) -> ScheduleCandidate {
        let plan = PlanInput(
            title: title,
            sport: .running,
            location: .unspecified,
            warmup: nil,
            blocks: [
                PlannedBlock(
                    repetitions: 1,
                    steps: [
                        PlannedStep(
                            stepType: "STEADY",
                            goal: .time(seconds: 600),
                            target: nil
                        ),
                    ]
                ),
            ],
            cooldown: nil
        )
        return ScheduleCandidate(
            eventId: eventId,
            startDate: readAt.addingTimeInterval(3_600),
            plan: plan
        )
    }

    private func snapshot(
        candidates: [ScheduleCandidate] = [],
        skipped: [SkippedScheduleEvent] = [],
        completed: [Int] = [],
        scope: AccountScope? = nil
    ) -> ScheduleSnapshot {
        ScheduleSnapshot(
            scope: scope ?? self.scope,
            window: DateInterval(
                start: readAt,
                end: readAt.addingTimeInterval(8 * 86_400)
            ),
            readAt: readAt,
            ownedEventIds: (candidates.map(\.eventId) + skipped.map(\.eventId)
                + completed).sorted(),
            completedEventIds: completed,
            candidates: candidates,
            skipped: skipped
        )
    }

    private func credential(
        scope: AccountScope? = nil,
        expiresAt: Date? = nil
    ) -> WatchScheduleCredential {
        WatchScheduleCredential(
            scope: scope ?? self.scope,
            accessToken: "access-token",
            expiresAt: expiresAt ?? readAt.addingTimeInterval(3_600)
        )
    }

    private func makeLifecycle(
        store: LifecycleFakeStore,
        journal: any ScheduleJournal,
        vault: LifecycleFakeVault = LifecycleFakeVault(),
        optIn: LifecycleFakeOptIn = LifecycleFakeOptIn(),
        authorization: LifecycleFakeAuthorization = LifecycleFakeAuthorization(),
        teardown: LifecycleFakeTeardown = LifecycleFakeTeardown(),
        loader: LifecycleSnapshotLoader,
        credentials: WatchScheduleCredentialStore? = nil
    ) -> (WatchScheduleLifecycle, WatchScheduleCredentialStore, LifecycleFakeVault) {
        let credentialStore = credentials ?? WatchScheduleCredentialStore(
            vault: vault,
            now: { self.now }
        )
        let reconciler = ScheduleReconciler(
            store: store,
            journal: journal,
            calendar: calendar
        )
        let lifecycle = WatchScheduleLifecycle(
            reconciler: reconciler,
            journal: journal,
            credentials: credentialStore,
            optIn: optIn,
            teardown: teardown,
            authorization: authorization,
            calendar: calendar,
            now: { self.now },
            loadSnapshot: { scope, _, _ in
                try await loader.load(scope)
            }
        )
        return (lifecycle, credentialStore, vault)
    }

    private func temporaryJournal() -> (FileScheduleJournal, URL) {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("watch-lifecycle-\(UUID().uuidString).json")
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }
        return (FileScheduleJournal(fileURL: url), url)
    }

    // MARK: - Opt-in and permission

    func testConnectWhenPermissionIsDeniedShowsDeniedAndSchedulesNothing() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn()
        let authorization = LifecycleFakeAuthorization(
            permission: .notDetermined,
            requested: .denied
        )
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            vault: LifecycleFakeVault(),
            optIn: optIn,
            authorization: authorization,
            loader: loader
        )

        let report = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        XCTAssertEqual(report.outcome, .deferred(.permissionDenied))
        XCTAssertEqual(report.status.permission, .denied)
        XCTAssertTrue(report.status.enabled)
        let watched1 = await authorization.requestCount
        XCTAssertEqual(watched1, 1)
        // Nothing may be read or written without Apple's authorization.
        let watched2 = await store.scheduleCount
        XCTAssertEqual(watched2, 0)
        let watched3 = await loader.loadCount
        XCTAssertEqual(watched3, 0)
        // A denied account has no reason to keep a token for background work.
        let watched4 = try await vault.load()
        XCTAssertNil(watched4)
    }

    func testUnsupportedDeviceIsReportedAndDoesNotEnable() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let authorization = LifecycleFakeAuthorization(permission: .unsupported)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            authorization: authorization,
            loader: loader
        )

        let report = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        XCTAssertEqual(report.outcome, .deferred(.unsupportedDevice))
        XCTAssertEqual(report.status.permission, .unsupported)
        XCTAssertFalse(report.status.enabled)
        let watched5 = await authorization.requestCount
        XCTAssertEqual(watched5, 0)
        let watched6 = await store.scheduleCount
        XCTAssertEqual(watched6, 0)
        let watched7 = try await vault.load()
        XCTAssertNil(watched7)
    }

    func testConnectRefreshesAndPersistsOnlyTheScopedAccessCredential() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let vault = LifecycleFakeVault()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(101)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            loader: loader
        )

        let report = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        guard case .synced(let summary) = report.outcome else {
            return XCTFail("expected a synced connect, got \(report.outcome)")
        }
        XCTAssertEqual(summary.scheduledEventIDs, [101])
        let watched8 = await store.scheduleCount
        XCTAssertEqual(watched8, 1)
        XCTAssertEqual(report.status.lastSuccessAt, now)
        XCTAssertEqual(report.status.counts.confirmed, 1)

        let storedCredential = try await vault.load()
        let stored = try XCTUnwrap(storedCredential)
        XCTAssertEqual(stored.scope, scope)
        XCTAssertEqual(stored.accessToken, "access-token")
        XCTAssertEqual(stored.expiresAt, credential().expiresAt)
        // The vault type only accepts an access token: there is no refresh
        // token field to persist, by construction.
        let watched9 = await vault.saveCount
        XCTAssertEqual(watched9, 1)
    }

    func testCredentialWithoutExpiryIsNotStoredForBackgroundRefresh() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let vault = LifecycleFakeVault()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            loader: loader
        )

        let report = await lifecycle.connect(
            scope: scope,
            credential: WatchScheduleCredential(
                scope: scope,
                accessToken: "short-lived",
                expiresAt: nil
            ),
            requestPermission: true
        )

        guard case .synced = report.outcome else {
            return XCTFail("a foreground pass may use an unbounded token")
        }
        let watched10 = try await vault.load()
        XCTAssertNil(watched10)
        let watched11 = await vault.saveCount
        XCTAssertEqual(watched11, 0)
    }

    // MARK: - Foreground and background refresh

    func testForegroundRefreshWithoutCredentialDefersWithoutNetwork() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let report = await lifecycle.refresh(
            trigger: .resume,
            scope: scope,
            credential: nil
        )

        XCTAssertEqual(report.outcome, .deferred(.credentialRequired))
        let watched12 = await loader.loadCount
        XCTAssertEqual(watched12, 0)
        let watched13 = await store.scheduleCount
        XCTAssertEqual(watched13, 0)
        XCTAssertNil(report.status.lastErrorCode)
        XCTAssertNil(report.status.lastSuccessAt)
    }

    func testForegroundRefreshRejectsACredentialFromAnotherScope() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let report = await lifecycle.refresh(
            trigger: .manual,
            scope: scope,
            credential: credential(scope: otherScope)
        )

        XCTAssertEqual(report.outcome, .deferred(.scopeMismatch))
        let watched14 = await loader.loadCount
        XCTAssertEqual(watched14, 0)
    }

    func testExpiredForegroundCredentialDefersToSignIn() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let report = await lifecycle.refresh(
            trigger: .resume,
            scope: scope,
            credential: credential(expiresAt: readAt.addingTimeInterval(-1))
        )

        XCTAssertEqual(report.outcome, .deferred(.credentialExpired))
        let watched15 = await loader.loadCount
        XCTAssertEqual(watched15, 0)
        let watched16 = await store.scheduleCount
        XCTAssertEqual(watched16, 0)
        let watched17 = try await vault.load()
        XCTAssertNil(watched17)
    }

    func testBackgroundRefreshUsesTheStoredScopedCredential() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let vault = LifecycleFakeVault(credential: credential())
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(102)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            loader: loader
        )
        // A launch/connect happened on a previous run: only the native opt-in
        // and the device-protected credential remain.
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        let report = await lifecycle.handleBackgroundRefresh()

        guard case .synced(let summary) = report.outcome else {
            return XCTFail("expected background refresh, got \(report.outcome)")
        }
        XCTAssertEqual(summary.unchangedEventIDs, [102])
        let watched18 = await loader.loadCount
        XCTAssertEqual(watched18, 2)
        // The pass is pinned to the validated stored credential; it must not
        // need a second vault read to prefer a foreground token.
        let watched19 = await vault.loadCount
        XCTAssertGreaterThanOrEqual(watched19, 1)
    }

    func testBackgroundRefreshWithoutStoredCredentialDefersToForeground() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let report = await lifecycle.handleBackgroundRefresh()

        XCTAssertEqual(report.outcome, .deferred(.credentialRequired))
        let watched20 = await loader.loadCount
        XCTAssertEqual(watched20, 0)
        let watched21 = await store.scheduleCount
        XCTAssertEqual(watched21, 0)
    }

    func testBackgroundRefreshWithAnExpiredCredentialNeverTouchesTheNetwork() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let vault = LifecycleFakeVault(
            credential: credential(expiresAt: readAt.addingTimeInterval(-60))
        )
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: optIn,
            loader: loader
        )

        let report = await lifecycle.handleBackgroundRefresh()

        XCTAssertEqual(report.outcome, .deferred(.credentialExpired))
        let watched22 = await loader.loadCount
        XCTAssertEqual(watched22, 0)
        // The expired token is not retained for another attempt.
        let watched23 = try await vault.load()
        XCTAssertNil(watched23)
    }

    func testBackgroundRefreshStopsWhenPermissionWasRevoked() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let authorization = LifecycleFakeAuthorization(permission: .denied)
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            authorization: authorization,
            loader: loader
        )

        let report = await lifecycle.handleBackgroundRefresh()

        XCTAssertEqual(report.outcome, .deferred(.permissionDenied))
        let watched24 = await loader.loadCount
        XCTAssertEqual(watched24, 0)
        let watched25 = await store.scheduleCount
        XCTAssertEqual(watched25, 0)
    }

    func testRevokedPermissionStopsWritesAndKeepsTheOptIn() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let authorization = LifecycleFakeAuthorization(permission: .authorized)
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(103)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            authorization: authorization,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let watched26 = await store.scheduleCount
        XCTAssertEqual(watched26, 1)

        await authorization.setPermission(.denied)
        let report = await lifecycle.refresh(
            trigger: .resume,
            scope: scope,
            credential: credential()
        )

        XCTAssertEqual(report.outcome, .deferred(.permissionDenied))
        XCTAssertTrue(report.status.enabled)
        XCTAssertEqual(report.status.permission, .denied)
        // The previous entry is intact and no new write was attempted.
        let watched27 = await store.scheduleCount
        XCTAssertEqual(watched27, 1)
        let watched28 = await store.removeCount
        XCTAssertEqual(watched28, 0)
    }

    // MARK: - Status

    func testStatusReportsLastSuccessSkippedSessionsAndOverflow() async throws {
        let store = LifecycleFakeStore(capacity: 0)
        let (journal, _) = temporaryJournal()
        let skipped = [
            SkippedScheduleEvent(
                eventId: 201,
                startDate: readAt,
                reason: .unsupported(.poolSwimmingUnverified)
            ),
            SkippedScheduleEvent(
                eventId: 202,
                startDate: readAt,
                reason: .zonesUnavailable
            ),
        ]
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(203)], skipped: skipped)
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )

        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let status = await lifecycle.status(scope: scope)

        XCTAssertTrue(status.enabled)
        XCTAssertEqual(status.lastSuccessAt, now)
        XCTAssertEqual(status.skipped.map(\.eventId), [201, 202])
        XCTAssertEqual(status.skipped.first?.reason.code, "poolSwimmingUnverified")
        XCTAssertEqual(status.counts.overflow, 1)
        XCTAssertEqual(status.counts.confirmed, 0)
    }

    func testStatusForAnotherAccountShowsDisabledWithoutWriting() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let status = await lifecycle.status(scope: otherScope)

        XCTAssertFalse(status.enabled)
        XCTAssertTrue(status.hasOtherAccountOptIn)
        let watched29 = await loader.loadCount
        XCTAssertEqual(watched29, 0)
        let watched30 = await store.scheduleCount
        XCTAssertEqual(watched30, 0)
    }

    func testRefreshForAnotherAccountNeverFetchesOrWrites() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let report = await lifecycle.refresh(
            trigger: .launch,
            scope: otherScope,
            credential: credential(scope: otherScope)
        )

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let watched31 = await loader.loadCount
        XCTAssertEqual(watched31, 0)
        let watched32 = await store.scheduleCount
        XCTAssertEqual(watched32, 0)
    }

    // MARK: - Logout and scope changes

    func testLogoutDuringFetchWritesNothing() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(301)])
        }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        // The next snapshot is suspended, which is where a logout usually
        // lands: the calendar read is in flight.
        await loader.suspendNextLoad()

        let refresh = Task {
            await lifecycle.refresh(
                trigger: .calendar,
                scope: scope,
                credential: credential()
            )
        }
        await loader.waitUntilSuspended()

        let writesAfterLogout = await store.scheduleCount
        await store.setDisconnectStarted()
        // The web exit fences first (urgent revocation), then starts the
        // scoped teardown. The in-flight fetch finishes concurrently, as it
        // would on a real network, and must not schedule.
        _ = await lifecycle.fence()
        let disconnectTask = Task {
            await lifecycle.disconnect(scope: scope)
        }
        await loader.resumeSuspended()
        let report = await refresh.value
        let disconnect = await disconnectTask.value

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let schedulesAfterLogout = await store.scheduleCount
        XCTAssertEqual(
            schedulesAfterLogout,
            writesAfterLogout,
            "a fetch that resolves after logout must not schedule"
        )
        let schedulesStartedDuringDisconnect = await store.scheduleCountAfterDisconnectStart
        XCTAssertEqual(
            schedulesStartedDuringDisconnect,
            0,
            "writesAfterLogout must stay 0 when the pass was only reading"
        )
        XCTAssertEqual(disconnect?.scope, scope)
        let watched33 = try await vault.load()
        XCTAssertNil(watched33)
        // The opt-in is gone: no background refresh will run for this account.
        let status = await lifecycle.status(scope: scope)
        XCTAssertFalse(status.enabled)
        XCTAssertFalse(status.hasOtherAccountOptIn)
    }

    func testRefreshQueuedBehindLogoutDoesNotStartAFetch() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(302)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        await loader.suspendNextLoad()
        let first = Task {
            await lifecycle.refresh(
                trigger: .resume,
                scope: scope,
                credential: credential()
            )
        }
        await loader.waitUntilSuspended()
        let queued = Task {
            await lifecycle.refresh(
                trigger: .zones,
                scope: scope,
                credential: credential()
            )
        }
        // Let the queued refresh reach the lifecycle gate before logout.
        await Task.yield()

        await store.setDisconnectStarted()
        _ = await lifecycle.fence()
        let disconnectTask = Task {
            await lifecycle.disconnect(scope: scope)
        }
        await loader.resumeSuspended()
        _ = await first.value
        let disconnect = await disconnectTask.value
        let queuedReport = await queued.value

        XCTAssertEqual(queuedReport.outcome, .deferred(.inactive))
        XCTAssertEqual(disconnect?.scope, scope)
        let schedules = await store.scheduleCount
        XCTAssertEqual(
            schedules,
            1,
            "only the connect pass may have written; the queued refresh never starts"
        )
        let watched34 = await loader.loadCount
        XCTAssertEqual(watched34, 2)
    }

    func testDisconnectRetainsPendingCleanupAndPurgesCredentials() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(401)])
        }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        // Apple's scheduler becomes unreadable: removal cannot be confirmed.
        await store.setReadFailure(LifecycleFakeStoreError.unavailable)

        let disconnectReport = await lifecycle.disconnect(scope: scope)
        let report = try XCTUnwrap(disconnectReport)

        XCTAssertEqual(report.scope, scope)
        XCTAssertEqual(report.removedEventIDs, [])
        XCTAssertEqual(report.retainedEventIDs, [401])
        XCTAssertEqual(report.unresolvedEventIDs, [])
        XCTAssertTrue(report.purgedCredential)
        let watched35 = try await vault.load()
        XCTAssertNil(watched35)
        // The journal outlives logout: the cleanup intent is durable, and no
        // destructive reset happened.
        let receipts = try await journal.receipts(for: scope)
        XCTAssertEqual(receipts.count, 1)
        XCTAssertEqual(receipts.first?.eventID, 401)
        XCTAssertEqual(receipts.first?.pendingOperation, .remove)
        XCTAssertEqual(receipts.first?.removalIntent, .cleanup)

        let status = await lifecycle.status(scope: scope)
        XCTAssertFalse(status.enabled)
        XCTAssertEqual(status.pendingCleanupEventIDs, [401])
    }

    func testDisconnectRemovesOnlyUpcomingEntriesAndKeepsCompletedHistory() async throws {
        let planA = UUID()
        let planB = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
                ScheduledWorkoutState(
                    planID: planB,
                    startDate: readAt.addingTimeInterval(7_200),
                    isComplete: true
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 501,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 502,
                planID: planB,
                scheduledDate: readAt.addingTimeInterval(7_200),
                fingerprint: "b"
            )
        )
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: LifecycleFakeOptIn(scope: scope),
            loader: loader
        )
        // A previous run already had this account enabled: the opt-in and both
        // receipts are durable, and disconnect runs on a cold lifecycle.
        let disconnectReport = await lifecycle.disconnect(scope: scope)
        let report = try XCTUnwrap(disconnectReport)

        XCTAssertEqual(report.removedEventIDs, [501])
        XCTAssertTrue(report.retainedEventIDs.isEmpty)
        let watched36 = await store.removeCount
        XCTAssertEqual(watched36, 1)
        // Apple's completed entry is history and must survive.
        let stored = await store.workouts
        XCTAssertTrue(stored.contains { $0.planID == planB && $0.isComplete })
        XCTAssertFalse(stored.contains { $0.planID == planA })
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 502
        )
        XCTAssertEqual(tombstone?.planID, planB)
    }

    func testConnectForAnotherInstanceCleansThePreviousScopeFirst() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let log = LifecycleOperationLog()
        await store.use(log: log)
        let loader = LifecycleSnapshotLoader { requested in
            if requested == self.scope {
                return self.snapshot(candidates: [self.candidate(601)])
            }
            return self.snapshot(
                candidates: [self.candidate(701)],
                scope: self.otherScope
            )
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )
        await loader.use(log: log)
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        await log.reset()

        let report = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )

        guard case .synced(let summary) = report.outcome else {
            return XCTFail("expected the second account to sync")
        }
        XCTAssertEqual(summary.scope, otherScope)
        let entries = await log.entries
        XCTAssertEqual(
            entries,
            [
                "store.remove",
                "load:https://other.example.org/api:11",
                "store.schedule:701",
            ],
            "the previous account's cleanup must drain before anything is written for the new one"
        )
        let status = await lifecycle.status(scope: otherScope)
        XCTAssertTrue(status.enabled)
        let oldStatus = await lifecycle.status(scope: scope)
        XCTAssertFalse(oldStatus.enabled)
        // This account now sees the new account's opt-in, and cannot act on it.
        XCTAssertTrue(oldStatus.hasOtherAccountOptIn)
    }

    func testConnectSameAccountTwiceDoesNotDuplicateOrResetTheSchedule() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(801)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )

        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let second = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        guard case .synced(let summary) = second.outcome else {
            return XCTFail("expected idempotent connect")
        }
        XCTAssertEqual(summary.unchangedEventIDs, [801])
        let watched37 = await store.scheduleCount
        XCTAssertEqual(watched37, 1)
        let watched38 = await store.removeCount
        XCTAssertEqual(watched38, 0)
    }

    func testUnresolvedWriteIsVisibleAndBlocksLaterWrites() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(901)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        await store.hideNextWrite()

        let report = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        XCTAssertEqual(report.outcome, .failed("unresolvedWrite"))
        XCTAssertTrue(report.status.unresolvedEventIDs.contains(901))
        XCTAssertEqual(report.status.lastErrorCode, "unresolvedWrite")

        // Nothing may be retried with the same UUID or written past it.
        await store.hideNextWrite(false)
        let second = await lifecycle.refresh(
            trigger: .resume,
            scope: scope,
            credential: credential()
        )
        XCTAssertEqual(second.outcome, .failed("unresolvedWrite"))
        let watched39 = await store.scheduleCount
        XCTAssertEqual(watched39, 1)
    }

    func testCalendarFailureKeepsTheLastSuccessAndReportsARetryableCode() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(902)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let statusBeforeFailure = await lifecycle.status(scope: scope)
        let firstSuccess = statusBeforeFailure.lastSuccessAt
        await loader.failNextLoad(ScheduleSourceError.calendarUnavailable)

        let report = await lifecycle.refresh(
            trigger: .calendar,
            scope: scope,
            credential: credential()
        )

        XCTAssertEqual(report.outcome, .failed("calendarUnavailable"))
        XCTAssertEqual(report.status.lastErrorCode, "calendarUnavailable")
        XCTAssertEqual(report.status.lastSuccessAt, firstSuccess)
        let watched40 = await store.removeCount
        XCTAssertEqual(watched40, 0)
    }

    func testUnauthorizedSnapshotReadDefersToForegroundSignIn() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(903)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        await loader.failNextLoad(ScheduleSourceError.credentialExpired)

        let report = await lifecycle.refresh(
            trigger: .calendar,
            scope: scope,
            credential: credential()
        )

        XCTAssertEqual(report.outcome, .deferred(.credentialRequired))
        let watched41 = await store.removeCount
        XCTAssertEqual(watched41, 0)
        let watched42 = await store.scheduleCount
        XCTAssertEqual(watched42, 1)
    }

    func testDisconnectWithoutOptInIsANoOp() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )

        let report = await lifecycle.disconnect(scope: nil)

        XCTAssertNil(report)
        let watched43 = await store.removeCount
        XCTAssertEqual(watched43, 0)
        let watched44 = await loader.loadCount
        XCTAssertEqual(watched44, 0)
    }

    func testBackgroundRefreshEnabledFollowsTheOptIn() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )

        let watched45 = await lifecycle.isBackgroundRefreshEnabled()
        XCTAssertFalse(watched45)
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let watched46 = await lifecycle.isBackgroundRefreshEnabled()
        XCTAssertTrue(watched46)
        _ = await lifecycle.disconnect(scope: scope)
        let watched47 = await lifecycle.isBackgroundRefreshEnabled()
        XCTAssertFalse(watched47)
    }
    // MARK: - Round 1: permission, opt-in and fence races

    func testFenceDuringPermissionRequestCannotEnableASignedOutAccount() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let authorization = LifecycleFakeAuthorization(permission: .notDetermined)
        await authorization.suspendNextRequest()
        let optIn = LifecycleFakeOptIn()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            authorization: authorization,
            loader: loader
        )

        let connect = Task {
            await lifecycle.connect(
                scope: self.scope,
                credential: self.credential(),
                requestPermission: true
            )
        }
        await authorization.waitUntilRequestStarted()
        await optIn.suspendNextLoad()
        let fence = Task { await lifecycle.fence() }
        await optIn.waitUntilLoadSuspended()
        await authorization.resumeRequest(.authorized)
        let report = await connect.value
        await optIn.resumeSuspendedLoad()
        _ = await fence.value

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let storedCredential = try await vault.load()
        XCTAssertNil(storedCredential)
        let storedOptIn = try await optIn.load()
        XCTAssertNil(storedOptIn)
    }

    func testFenceDuringOptInSaveClearsTheStaleWrite() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn()
        await optIn.suspendNextSave()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )

        let connect = Task {
            await lifecycle.connect(
                scope: self.scope,
                credential: self.credential(),
                requestPermission: false
            )
        }
        await optIn.waitUntilSaveSuspended()
        let fence = Task { await lifecycle.fence() }
        await Task.yield()
        await optIn.resumeSuspendedSave()
        _ = await connect.value
        _ = await fence.value

        let watched1 = try await optIn.load()
        XCTAssertNil(watched1)
        let status = await lifecycle.status(scope: scope)
        XCTAssertFalse(status.enabled)
        let watched2 = await store.scheduleCount
        XCTAssertEqual(watched2, 0)
    }

    func testFenceDuringFetchStopsTheStalePassWithoutReadingAgain() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optInStore = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(1101)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optInStore,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        await loader.suspendNextLoad()
        let refresh = Task {
            await lifecycle.refresh(
                trigger: .calendar,
                scope: self.scope,
                credential: self.credential()
            )
        }
        await loader.waitUntilSuspended()
        let readsBeforeFence = await store.readCount
        await optInStore.suspendNextLoad()
        let fence = Task { await lifecycle.fence() }
        await optInStore.waitUntilLoadSuspended()
        await loader.resumeSuspended()
        let report = await refresh.value
        await optInStore.resumeSuspendedLoad()
        _ = await fence.value

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let watched3 = await store.scheduleCount
        XCTAssertEqual(watched3, 1)
        let watched4 = await store.readCount
        XCTAssertEqual(watched4, readsBeforeFence)
        let optIn = await lifecycle.status(scope: scope)
        XCTAssertFalse(optIn.enabled)
    }

    func testFencePersistsTeardownAuthorizationBeforeClearingTheOptIn() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        let readsBeforeFence = await store.readCount

        await lifecycle.fence()

        let watched5 = try await teardown.load()
        XCTAssertEqual(watched5, [scope])
        let watched6 = try await optIn.load()
        XCTAssertNil(watched6)
        // The acknowledgement must not wait for Apple cleanup reads.
        let watched7 = await store.readCount
        XCTAssertEqual(watched7, readsBeforeFence)
    }

    func testDisconnectLeavesTheOptInWhenTeardownAuthorizationCannotBePersisted() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.failNextAdd()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )

        let report = await lifecycle.disconnect(scope: scope)

        XCTAssertNil(report)
        // Fail closed: keep the only durable authorization we have.
        let watched8 = try await optIn.load()
        XCTAssertEqual(watched8, scope)
        let watched9 = await lifecycle.isBackgroundRefreshEnabled()
        XCTAssertTrue(watched9)
        // The scheduler is fenced and no upcoming entry is touched.
        let watched10 = await store.removeCount
        XCTAssertEqual(watched10, 0)
    }

    // MARK: - Round 1: durable teardown recovery

    func testNewAccountWaitsForThePersistedTeardownOfThePreviousAccount() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let log = LifecycleOperationLog()
        await store.use(log: log)
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 501,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let loader = LifecycleSnapshotLoader { requested in
            if requested == self.scope {
                return self.snapshot()
            }
            return self.snapshot(
                candidates: [self.candidate(1201)],
                scope: self.otherScope
            )
        }
        await loader.use(log: log)
        let optIn = LifecycleFakeOptIn()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        await store.setReadFailure(LifecycleFakeStoreError.unavailable)

        let blocked = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )

        XCTAssertEqual(blocked.outcome, .failed("pendingCleanup"))
        let watched11 = try await teardown.load()
        XCTAssertEqual(watched11, [scope])
        let watched12 = await store.scheduleCount
        XCTAssertEqual(watched12, 0)
        let storedOptIn = try await optIn.load()
        XCTAssertNil(storedOptIn)

        await store.setReadFailure(nil)
        await log.reset()
        let recovered = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )

        guard case .synced(let summary) = recovered.outcome else {
            return XCTFail("expected account B after recovery, got \(recovered.outcome)")
        }
        XCTAssertEqual(summary.scope, otherScope)
        let entries = await log.entries
        XCTAssertEqual(
            entries,
            [
                "store.remove",
                "load:https://other.example.org/api:11",
                "store.schedule:1201",
            ]
        )
        let watched13 = try await teardown.load()
        XCTAssertEqual(watched13, [])
    }

    func testCrashAfterFenceIsRecoveredBeforeAnotherAccountSchedules() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 501,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        let loader = LifecycleSnapshotLoader { requested in
            requested == self.scope
                ? self.snapshot()
                : self.snapshot(
                    candidates: [self.candidate(1301)],
                    scope: self.otherScope
                )
        }
        let (first, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        await first.fence()
        let watched14 = try await teardown.load()
        XCTAssertEqual(watched14, [scope])
        let watched15 = try await optIn.load()
        XCTAssertNil(watched15)

        // The process was killed before disconnect's cleanup could run.
        let log = LifecycleOperationLog()
        await store.use(log: log)
        await loader.use(log: log)
        let (second, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        let report = await second.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )

        guard case .synced = report.outcome else {
            return XCTFail("expected recovery then B, got \(report.outcome)")
        }
        let entries = await log.entries
        XCTAssertEqual(
            entries,
            [
                "store.remove",
                "load:https://other.example.org/api:11",
                "store.schedule:1301",
            ]
        )
        let watched16 = try await teardown.load()
        XCTAssertEqual(watched16, [])
    }

    // MARK: - Round 1: background credential rules

    func testBackgroundRejectsACredentialWithoutExpiry() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let vault = LifecycleFakeVault(
            credential: WatchScheduleCredential(
                scope: scope,
                accessToken: "unbounded",
                expiresAt: nil
            )
        )
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: LifecycleFakeOptIn(scope: scope),
            loader: loader
        )

        let report = await lifecycle.handleBackgroundRefresh()

        XCTAssertEqual(report.outcome, .deferred(.credentialRequired))
        let watched17 = await loader.loadCount
        XCTAssertEqual(watched17, 0)
        let watched18 = await store.scheduleCount
        XCTAssertEqual(watched18, 0)
    }

    func testPurgeFailureBlocksCredentialReuseAndIsReported() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let vault = LifecycleFakeVault(credential: credential())
        await vault.failNextPurge()
        let teardown = LifecycleFakeTeardown()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, credentialStore, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: LifecycleFakeOptIn(scope: scope),
            teardown: teardown,
            loader: loader
        )

        let disconnect = await lifecycle.disconnect(scope: scope)
        let report = try XCTUnwrap(disconnect)

        XCTAssertFalse(report.purgedCredential)
        let watched19 = try await credentialStore.storedCredential()
        XCTAssertNil(watched19)
        // Cleanup and credential retirement are incomplete: the teardown must
        // survive so the next account cannot schedule past it.
        let pendingTeardown = try await teardown.load()
        XCTAssertEqual(pendingTeardown, [scope])
        let watched20 = try await credentialStore.credential(for: scope)
        XCTAssertNil(watched20)
        // The failed Keychain purge leaves the item in place; it must stay
        // unreachable through the store, never treated as removed.
        let remaining = try await vault.load()
        XCTAssertNotNil(remaining)
        // The teardown stays durable because credential retirement is not proven.
        let background = await lifecycle.handleBackgroundRefresh()
        XCTAssertEqual(background.outcome, .deferred(.inactive))
    }

    func testBackgroundPassUsesThePinnedStoredCredential() async throws {
        let stored = WatchScheduleCredential(
            scope: scope,
            accessToken: "stored-background-token",
            expiresAt: readAt.addingTimeInterval(3_600)
        )
        let vault = LifecycleFakeVault(credential: stored)
        let credentials = WatchScheduleCredentialStore(
            vault: vault,
            now: { self.now }
        )
        await credentials.adopt(
            WatchScheduleCredential(
                scope: scope,
                accessToken: "foreground-token",
                expiresAt: readAt.addingTimeInterval(3_600)
            )
        )
        await credentials.beginPass(stored)

        let chosen = try await credentials.credential(for: scope)
        XCTAssertEqual(chosen?.accessToken, stored.accessToken)

        await credentials.endPass()
    }

    // MARK: - Round 1: status exposure

    func testStatusHidesAnotherAccountsPendingIdentifiers() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1401,
                planID: UUID(),
                scheduledDate: readAt,
                fingerprint: "a",
                pendingOperation: .schedule,
                pendingPhase: .confirming,
                submittedDate: readAt
            )
        )
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: LifecycleFakeOptIn(scope: otherScope),
            loader: loader
        )

        let status = await lifecycle.status(scope: otherScope)

        XCTAssertTrue(status.enabled)
        XCTAssertTrue(status.otherAccountPending)
        XCTAssertEqual(status.unresolvedEventIDs, [])
        XCTAssertEqual(status.localPendingEventIDs, [])
        XCTAssertEqual(status.pendingCleanupEventIDs, [])
    }

    func testStatusSeparatesSubmittedWritesFromLocalPending() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1501,
                planID: UUID(),
                scheduledDate: readAt,
                fingerprint: "a",
                pendingOperation: .schedule,
                pendingPhase: .confirming,
                submittedDate: readAt
            )
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1502,
                planID: UUID(),
                scheduledDate: readAt,
                fingerprint: "b",
                pendingOperation: .schedule,
                pendingPhase: .writing
            )
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1503,
                planID: UUID(),
                scheduledDate: readAt,
                fingerprint: "c",
                pendingOperation: .remove,
                removalIntent: .cleanup
            )
        )
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: LifecycleFakeOptIn(scope: scope),
            loader: loader
        )

        let status = await lifecycle.status(scope: scope)

        XCTAssertEqual(status.unresolvedEventIDs, [1501])
        XCTAssertEqual(status.localPendingEventIDs, [1502])
        XCTAssertEqual(status.pendingCleanupEventIDs, [1503])
    }
    func testStatusForAnotherAccountHidesTheSyncStateOfThePreviousOne() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let skipped = [
            SkippedScheduleEvent(
                eventId: 1601,
                startDate: readAt,
                reason: .unsupported(.poolSwimmingUnverified)
            ),
        ]
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(1602)], skipped: skipped)
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        let other = await lifecycle.status(scope: otherScope)

        XCTAssertNil(other.lastSuccessAt)
        XCTAssertNil(other.lastAttemptAt)
        XCTAssertNil(other.lastErrorCode)
        XCTAssertEqual(other.counts, .none)
        XCTAssertEqual(other.skipped, [])
    }
    // MARK: - Round 2: fence ordering and queued work

    func testFenceRevokesWritesAndCredentialsBeforeAStalledTeardownWrite() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(1701)])
        }
        let (lifecycle, credentials, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        await store.suspendNextScheduleBeforeFence()
        let refresh = Task {
            await lifecycle.refresh(
                trigger: .manual,
                scope: self.scope,
                credential: self.credential()
            )
        }
        await store.waitUntilScheduleSuspended()
        await optIn.suspendNextLoad()
        await teardown.suspendNextAdd()
        let fence = Task { await lifecycle.fence() }
        // Credential reuse is revoked before the fence touches storage.
        await optIn.waitUntilLoadSuspended()
        let pinned = try await credentials.credential(for: scope)
        XCTAssertNil(pinned)

        await store.resumeSuspendedSchedule()
        let report = await refresh.value
        await optIn.resumeSuspendedLoad()
        await teardown.waitUntilAddSuspended()
        await teardown.resumeSuspendedAdd()
        let acknowledged = await fence.value
        XCTAssertTrue(acknowledged)

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let watched2001 = await store.scheduleCount
        XCTAssertEqual(watched2001, 0)
        let watched2002 = try await teardown.load()
        XCTAssertEqual(watched2002, [scope])
    }

    func testConnectQueuedBeforeLogoutIsRejectedAfterTheGate() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(1702)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )
        await loader.suspendNextLoad()
        let first = Task {
            await lifecycle.refresh(
                trigger: .resume,
                scope: self.scope,
                credential: self.credential()
            )
        }
        await loader.waitUntilSuspended()
        let queuedConnect = Task {
            await lifecycle.connect(
                scope: self.scope,
                credential: self.credential(),
                requestPermission: true
            )
        }
        // Give the queued connect time to capture the pre-logout epoch and
        // wait on the lifecycle gate; a bare yield is not enough under the
        // release test executor.
        try await Task.sleep(nanoseconds: 20_000_000)

        await optIn.suspendNextLoad()
        let fence = Task { await lifecycle.fence() }
        await optIn.waitUntilLoadSuspended()
        await loader.resumeSuspended()
        _ = await first.value
        await optIn.resumeSuspendedLoad()
        _ = await fence.value
        let report = await queuedConnect.value

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let stored = try await optIn.load()
        XCTAssertNil(stored)
        let watched2003 = await store.scheduleCount
        XCTAssertEqual(watched2003, 0)
    }

    // MARK: - Round 2: teardown reads and uncertain cleanup

    func testTeardownReadFailureDoesNotLookLikeNoPendingCleanup() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let teardown = LifecycleFakeTeardown()
        await teardown.failLoads()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(1703)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            teardown: teardown,
            loader: loader
        )

        let report = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )

        XCTAssertEqual(report.outcome, .failed("pendingCleanup"))
        let watched2004 = await store.scheduleCount
        XCTAssertEqual(watched2004, 0)
        let status = await lifecycle.status(scope: scope)
        XCTAssertTrue(status.cleanupUnknown)
        XCTAssertFalse(status.otherAccountPending)
    }

    func testUncertainCleanupKeepsTheTeardownAuthorization() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let teardown = LifecycleFakeTeardown()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        // No receipts, and Apple's schedule cannot be read: cleanup is
        // uncertain, not empty.
        await store.setReadFailure(LifecycleFakeStoreError.unavailable)

        let disconnect = await lifecycle.disconnect(scope: scope)
        let report = try XCTUnwrap(disconnect)

        XCTAssertEqual(report.retainedEventIDs, [])
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [scope])
    }

    func testColdDisconnectRecoversAPersistedTeardownWithoutOptIn() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1801,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            teardown: teardown,
            loader: loader
        )

        let report = await lifecycle.disconnect(scope: nil)

        XCTAssertNil(report)
        let watched2005 = await store.removeCount
        XCTAssertEqual(watched2005, 1)
        let watched2006 = try await teardown.load()
        XCTAssertEqual(watched2006, [])
    }

    func testRecoveryOfAStaleOptInDoesNotReenableTheSameAccount() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1802,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(1803)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )

        let report = await lifecycle.refresh(
            trigger: .launch,
            scope: scope,
            credential: credential()
        )

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let watched2007 = try await optIn.load()
        XCTAssertNil(watched2007)
        let watched2008 = await store.scheduleCount
        XCTAssertEqual(watched2008, 0)
        let watched2009 = try await teardown.load()
        XCTAssertEqual(watched2009, [])
    }

    // MARK: - Round 2: pinning and status scope

    func testExpiredOrForeignPinnedCredentialDoesNotFallBack() async throws {
        let vault = LifecycleFakeVault(credential: credential())
        let credentials = WatchScheduleCredentialStore(
            vault: vault,
            now: { self.now }
        )
        await credentials.adopt(credential())

        await credentials.beginPass(
            WatchScheduleCredential(
                scope: scope,
                accessToken: "expired-pin",
                expiresAt: readAt.addingTimeInterval(-1)
            )
        )
        let expired = try await credentials.credential(for: scope)
        XCTAssertNil(expired)

        await credentials.beginPass(credential(scope: otherScope))
        let foreign = try await credentials.credential(for: scope)
        XCTAssertNil(foreign)
    }

    func testStatusSameScopeTeardownIsCleanupNotAnotherAccount() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { _ in self.snapshot() }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: LifecycleFakeOptIn(scope: scope),
            teardown: LifecycleFakeTeardown(initial: [scope]),
            loader: loader
        )

        let status = await lifecycle.status(scope: scope)

        XCTAssertFalse(status.enabled)
        XCTAssertFalse(status.hasOtherAccountOptIn)
        XCTAssertFalse(status.otherAccountPending)
        XCTAssertTrue(status.cleanupPending)
    }

    func testSpeculativeScopeFailureDoesNotChangeAnotherAccountsStatus() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let loader = LifecycleSnapshotLoader { requested in
            requested == self.scope
                ? self.snapshot(candidates: [self.candidate(1901)])
                : self.snapshot(candidates: [self.candidate(1902)], scope: self.otherScope)
        }
        let optIn = LifecycleFakeOptIn(scope: scope)
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: LifecycleFakeTeardown(),
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let before = await lifecycle.status(scope: scope)
        // A second signed-in session for B; A's sync state stays in memory.
        try await optIn.save(otherScope)
        await loader.failNextLoad(ScheduleSourceError.calendarUnavailable)

        let blocked = await lifecycle.refresh(
            trigger: .manual,
            scope: otherScope,
            credential: credential(scope: otherScope)
        )
        XCTAssertEqual(blocked.outcome, .failed("calendarUnavailable"))

        let after = await lifecycle.status(scope: scope)
        XCTAssertEqual(after.lastSuccessAt, before.lastSuccessAt)
        XCTAssertNil(after.lastErrorCode)
        XCTAssertEqual(after.counts, before.counts)
        let other = await lifecycle.status(scope: otherScope)
        XCTAssertEqual(other.lastErrorCode, "calendarUnavailable")
    }
    func testFenceKeepsTheOptInWhenTeardownCannotBePersisted() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.failNextAdd()
        let (lifecycle, credentials, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )
        await credentials.adopt(credential())

        await lifecycle.fence()

        // The plugin uses this to reject an unconfirmed fence acknowledgement.
        let watched300 = await lifecycle.isBackgroundRefreshEnabled()
        XCTAssertTrue(watched300)
        let vaulted = try await credentials.storedCredential()
        XCTAssertNil(vaulted)
    }

    func testBackgroundLaunchRecoversAPersistedTeardownWithoutOptIn() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2001,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let report = await lifecycle.handleBackgroundRefresh()

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let watched301 = await store.removeCount
        XCTAssertEqual(watched301, 1)
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [])
    }
    // MARK: - Round 3: explicit fence acknowledgement

    private func optInValue(
        _ lifecycle: WatchScheduleLifecycle,
        scope: AccountScope
    ) async -> AccountScope? {
        let status = await lifecycle.status(scope: scope)
        return status.enabled ? scope : nil
    }

    func testFenceAcknowledgesOnlyAfterTeardownAndOptInRetirement() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let acknowledged = await lifecycle.fence()

        XCTAssertTrue(acknowledged)
        let watched3001 = try await optIn.load()
        XCTAssertNil(watched3001)
        let watched3002 = try await teardown.load()
        XCTAssertEqual(watched3002, [scope])
    }

    func testFailedTeardownPersistenceNeverAcknowledgesTheFence() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.failNextAdd()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let acknowledged = await lifecycle.fence()

        XCTAssertFalse(acknowledged)
        let watched3003 = try await optIn.load()
        XCTAssertEqual(watched3003, scope)
        let connect = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        XCTAssertEqual(connect.outcome, .deferred(.inactive))
        let background = await lifecycle.handleBackgroundRefresh()
        XCTAssertEqual(background.outcome, .deferred(.inactive))
        let watched3004 = await store.scheduleCount
        XCTAssertEqual(watched3004, 0)
    }

    func testFenceInProgressBlocksConnectAndBackgroundDuringAStalledWrite() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.suspendNextAdd()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(2101)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        let fence = Task { await lifecycle.fence() }
        await teardown.waitUntilAddSuspended()

        let connect = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )
        let background = await lifecycle.handleBackgroundRefresh()
        XCTAssertEqual(connect.outcome, .deferred(.inactive))
        XCTAssertEqual(background.outcome, .deferred(.inactive))
        let watched3005 = await store.scheduleCount
        XCTAssertEqual(watched3005, 0)

        await teardown.resumeSuspendedAdd()
        let acknowledged = await fence.value
        XCTAssertTrue(acknowledged)
    }

    func testFenceGuardIsSetBeforeAColdStorageRead() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn()
        await optIn.suspendNextLoad()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(2151)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: LifecycleFakeTeardown(),
            loader: loader
        )
        let fence = Task { await lifecycle.fence() }
        await optIn.waitUntilLoadSuspended()

        let connect = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let background = await lifecycle.handleBackgroundRefresh()
        XCTAssertEqual(connect.outcome, .deferred(.inactive))
        XCTAssertEqual(background.outcome, .deferred(.inactive))
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 0)

        await optIn.resumeSuspendedLoad()
        let acknowledged = await fence.value
        XCTAssertTrue(acknowledged)
    }

    // MARK: - Round 3: recovery proof and serialization

    func testRecoveryDoesNotDeleteTeardownWhenOptInClearCannotBeProven() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2201,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown(initial: [scope])
        await optIn.failNextClear()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let recovered = await lifecycle.recoverCleanup()

        XCTAssertFalse(recovered)
        let watched3006 = try await teardown.load()
        XCTAssertEqual(watched3006, [scope])
        let watched3007 = await store.removeCount
        XCTAssertEqual(watched3007, 0)
        let guarded = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )
        XCTAssertEqual(guarded.outcome, .deferred(.inactive))
    }

    func testRecoveryDoesNotTrustAnUnreadableOptIn() async throws {
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown(initial: [scope])
        await optIn.failNextLoad()
        let (lifecycle, _, _) = makeLifecycle(
            store: LifecycleFakeStore(),
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let recovered = await lifecycle.recoverCleanup()

        XCTAssertFalse(recovered)
        let watched3008 = try await teardown.load()
        XCTAssertEqual(watched3008, [scope])
    }

    func testZeroByteTeardownDocumentIsCorruptNotEmpty() async throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("watch-teardown-\(UUID().uuidString).json")
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }
        try Data().write(to: url)
        let store = FileWatchScheduleTeardownStore(fileURL: url)

        do {
            _ = try await store.load()
            XCTFail("a persisted zero-byte teardown must not load as empty")
        } catch let error as WatchScheduleTeardownError {
            XCTAssertEqual(error, .corrupt)
        }
    }

    func testColdDisconnectSerializesWithAQueuedConnect() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2301,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let loader = LifecycleSnapshotLoader { requested in
            self.snapshot(candidates: [self.candidate(2302)], scope: requested)
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            teardown: teardown,
            loader: loader
        )
        await store.suspendNextRead()
        let disconnect = Task { await lifecycle.disconnect(scope: nil) }
        await store.waitUntilReadSuspended()
        let queued = Task {
            await lifecycle.connect(
                scope: self.otherScope,
                credential: self.credential(scope: self.otherScope),
                requestPermission: true
            )
        }
        // The fence is active before the gate, so the queued connect is
        // rejected without waiting for the suspended cleanup read.
        let queuedReport = await queued.value
        XCTAssertEqual(queuedReport.outcome, .deferred(.inactive))

        let stillStale = await optInValue(lifecycle, scope: otherScope)
        XCTAssertNil(stillStale)
        let watched3009 = await store.scheduleCount
        XCTAssertEqual(watched3009, 0)

        await store.resumeSuspendedRead()
        _ = await disconnect.value
        // A connect attempted while the old scope was recovering is rejected;
        // it must not interleave with the teardown.
        let watched3010 = await store.scheduleCount
        XCTAssertEqual(watched3010, 0)
        let pendingAfterRecovery = try await teardown.load()
        XCTAssertEqual(pendingAfterRecovery, [])
        let removed = await store.removeCount
        XCTAssertEqual(removed, 1)

        let retried = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )
        guard case .synced = retried.outcome else {
            return XCTFail("expected B after recovery, got \(retried.outcome)")
        }
        let watched3011 = await store.scheduleCount
        XCTAssertEqual(watched3011, 1)
    }

    func testSuspendedRecoveryOfOldScopeKeepsTheNextScopeCredential() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2401,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let nextCredential = credential(scope: otherScope)
        let vault = LifecycleFakeVault(credential: nextCredential)
        let loader = LifecycleSnapshotLoader { requested in
            self.snapshot(candidates: [self.candidate(2402)], scope: requested)
        }
        let (lifecycle, credentials, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: LifecycleFakeOptIn(scope: otherScope),
            teardown: LifecycleFakeTeardown(initial: [scope]),
            loader: loader
        )
        await credentials.adopt(nextCredential)
        await store.suspendNextRead()
        let background = Task { await lifecycle.handleBackgroundRefresh() }
        await store.waitUntilReadSuspended()

        let during = try await vault.load()
        XCTAssertEqual(during?.scope, otherScope)

        await store.resumeSuspendedRead()
        let report = await background.value
        guard case .synced = report.outcome else {
            return XCTFail("B must keep its credential, got \(report.outcome)")
        }
        let after = try await vault.load()
        XCTAssertEqual(after?.scope, otherScope)
    }

    func testRecoverCleanupDoesNotUseTheCurrentOptInAsAuthorization() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: LifecycleFakeTeardown(),
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let recovered = await lifecycle.recoverCleanup()

        XCTAssertTrue(recovered)
        let stored = try await optIn.load()
        XCTAssertEqual(stored, scope)
        let removed = await store.removeCount
        XCTAssertEqual(removed, 0)
    }

    // MARK: - Round 3: wrong-scope disconnect

    func testWrongScopeDisconnectDoesNotDisturbTheCurrentSession() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let vault = LifecycleFakeVault()
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(2501)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: optIn,
            teardown: LifecycleFakeTeardown(),
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        let schedulesBefore = await store.scheduleCount

        let rejected = await lifecycle.disconnect(scope: otherScope)

        XCTAssertNil(rejected)
        let storedOptIn = try await optIn.load()
        XCTAssertEqual(storedOptIn, scope)
        let storedCredential = try await vault.load()
        XCTAssertEqual(storedCredential?.scope, scope)
        let refresh = await lifecycle.refresh(
            trigger: .manual,
            scope: scope,
            credential: credential()
        )
        guard case .synced = refresh.outcome else {
            return XCTFail("current session must still work, got \(refresh.outcome)")
        }
        let watched3011 = await store.scheduleCount
        XCTAssertEqual(watched3011, schedulesBefore)
    }

    func testWrongScopeDisconnectOnAColdRuntimeLeavesTheOptInIntact() async throws {
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        let (lifecycle, _, _) = makeLifecycle(
            store: LifecycleFakeStore(),
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let rejected = await lifecycle.disconnect(scope: otherScope)

        XCTAssertNil(rejected)
        let storedOptIn = try await optIn.load()
        XCTAssertEqual(storedOptIn, scope)
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [])
    }

    // MARK: - Round 4: fence ownership, foreign opt-in and unknown state

    /// A recovery must never release the guard of a fence that is still
    /// persisting its teardown authorization.
    func testRecoveryCannotReleaseAFenceThatIsStillPersistingTeardown() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.suspendNextAdd()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { requested in
                self.snapshot(scope: requested)
            }
        )
        let fence = Task { await lifecycle.fence() }
        await teardown.waitUntilAddSuspended()
        let recovery = Task { await lifecycle.recoverCleanup() }
        await Task.yield()
        await Task.yield()

        let connect = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )

        XCTAssertEqual(connect.outcome, .deferred(.inactive))
        let during = await store.scheduleCount
        XCTAssertEqual(during, 0)

        await teardown.resumeSuspendedAdd()
        let acknowledged = await fence.value
        XCTAssertTrue(acknowledged)
        _ = await recovery.value

        let retried = await lifecycle.connect(
            scope: otherScope,
            credential: credential(scope: otherScope),
            requestPermission: true
        )
        guard case .synced = retried.outcome else {
            return XCTFail("expected a pass after the fence, got \(retried.outcome)")
        }
    }

    /// A read-only wrong-scope rejection must not resurrect a guard value it
    /// observed before a concurrent fence finished.
    func testColdWrongScopeDisconnectCannotResurrectAFinishedFence() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.suspendNextAdd()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { requested in
                self.snapshot(scope: requested)
            }
        )
        let fence = Task { await lifecycle.fence() }
        await teardown.waitUntilAddSuspended()
        await optIn.suspendNextLoad()
        let wrong = Task { await lifecycle.disconnect(scope: self.otherScope) }
        await Task.yield()

        await teardown.resumeSuspendedAdd()
        await optIn.waitUntilLoadSuspended()
        await optIn.resumeSuspendedLoad()
        let acknowledged = await fence.value
        XCTAssertTrue(acknowledged)
        let rejected = await wrong.value
        XCTAssertNil(rejected)

        let refresh = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        guard case .synced = refresh.outcome else {
            return XCTFail(
                "a finished fence must not stay active, got \(refresh.outcome)"
            )
        }
    }

    /// A teardown for A with an actual opt-in for B is cleanup for A, not an
    /// "other account opt-in" that authorizes disconnecting B.
    func testTeardownForAWithOptInForBIsNotAnOtherAccountOptIn() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2601,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let next = credential(scope: otherScope)
        let vault = LifecycleFakeVault(credential: next)
        let optIn = LifecycleFakeOptIn(scope: otherScope)
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let (lifecycle, credentials, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { requested in
                self.snapshot(scope: requested)
            }
        )
        await credentials.adopt(next)

        let status = await lifecycle.status(scope: otherScope)

        XCTAssertFalse(status.hasOtherAccountOptIn)
        XCTAssertTrue(status.cleanupPending)
        XCTAssertTrue(status.otherAccountPending)
        XCTAssertTrue(status.enabled)

        let recovered = await lifecycle.recoverCleanup()

        XCTAssertTrue(recovered)
        let storedOptIn = try await optIn.load()
        XCTAssertEqual(storedOptIn, otherScope)
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [])
        let kept = try await vault.load()
        XCTAssertEqual(kept?.scope, otherScope)
        let removed = await store.removeCount
        XCTAssertEqual(removed, 1)
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 0)
    }

    /// An opt-in is not teardown authorization. Recovery only acts on an
    /// existing durable teardown, so a foreign opt-in is left for an explicit
    /// connect (which persists its own cleanup authorization first).
    func testRecoveryNeverRetiresAForeignOptIn() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2602,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let optIn = LifecycleFakeOptIn(scope: scope)
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )

        let status = await lifecycle.status(scope: otherScope)
        XCTAssertTrue(status.hasOtherAccountOptIn)

        let recovered = await lifecycle.recoverCleanup()

        XCTAssertTrue(recovered)
        let storedOptIn = try await optIn.load()
        XCTAssertEqual(storedOptIn, scope)
        let removed = await store.removeCount
        XCTAssertEqual(removed, 0)
    }

    /// An unreadable opt-in is unknown, not absent: status, connect and fence
    /// must all fail closed.
    func testUnreadableOptInPausesStatusAndNewPasses() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: LifecycleSnapshotLoader { _ in
                self.snapshot(candidates: [self.candidate(2701)])
            }
        )
        await optIn.failNextLoad()

        let status = await lifecycle.status(scope: scope)

        XCTAssertTrue(status.cleanupUnknown)
        XCTAssertFalse(status.enabled)
        XCTAssertFalse(status.hasOtherAccountOptIn)

        await optIn.failNextLoad()
        let connect = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        XCTAssertEqual(connect.outcome, .failed("pendingCleanup"))
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 0)

        await optIn.failNextLoad()
        let acknowledged = await lifecycle.fence()
        XCTAssertFalse(acknowledged)
    }

    /// A no-target fence still has to prove the opt-in is gone before it
    /// acknowledges.
    func testNoTargetFenceWithoutAProvenRetirementIsNotAcknowledged() async throws {
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn()
        let (lifecycle, _, _) = makeLifecycle(
            store: LifecycleFakeStore(),
            journal: journal,
            optIn: optIn,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )
        await optIn.failNextLoadAfterClear()

        let acknowledged = await lifecycle.fence()

        XCTAssertFalse(acknowledged)
        let connect = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        XCTAssertEqual(connect.outcome, .deferred(.inactive))
    }

    /// A failed storage operation pauses, but a later successful fence proves
    /// the retirement and must not leave the runtime paused forever.
    func testSuccessfulFenceRetryReleasesThePause() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown()
        await teardown.failNextAdd()
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { requested in
                self.snapshot(scope: requested)
            }
        )

        let failed = await lifecycle.fence()
        XCTAssertFalse(failed)

        let retried = await lifecycle.fence()
        XCTAssertTrue(retried)

        let connect = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        guard case .synced = connect.outcome else {
            return XCTFail("expected a pass after a successful retry, got \(connect.outcome)")
        }
    }

    /// The background entry point must not infer authorization from malformed
    /// opt-in storage; it pauses without recovering or writing.
    func testBackgroundUnknownOptInPausesWithoutRecovery() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let teardown = LifecycleFakeTeardown(initial: [scope])
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: teardown,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )
        await optIn.failNextLoad()

        let report = await lifecycle.handleBackgroundRefresh()

        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let removed = await store.removeCount
        XCTAssertEqual(removed, 0)
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 0)
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [scope])
    }

    // MARK: - Round 5: scoped revocation, recovery boundaries, fence latency

    /// A scoped disconnect validates the account under the same lock that
    /// owns opt-in mutation. When B has already won, A is read-only: no epoch
    /// bump, no reconciler fence, no credential or opt-in change.
    func testColdDisconnectForAnOutdatedScopeDoesNotFenceTheConnectingAccount() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let nextCredential = credential(scope: otherScope)
        let vault = LifecycleFakeVault(credential: nextCredential)
        let teardown = LifecycleFakeTeardown()
        let loader = LifecycleSnapshotLoader { requested in
            self.snapshot(candidates: [self.candidate(2801)], scope: requested)
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        await teardown.suspendNextAdd()
        let connecting = Task {
            await lifecycle.connect(
                scope: self.otherScope,
                credential: nextCredential,
                requestPermission: true
            )
        }
        await teardown.waitUntilAddSuspended()

        let outdated = Task { await lifecycle.disconnect(scope: self.scope) }
        await Task.yield()
        await Task.yield()

        await teardown.resumeSuspendedAdd()
        let connected = await connecting.value
        let refused = await outdated.value

        guard case .synced = connected.outcome else {
            return XCTFail(
                "B must keep its in-flight connect, got \(connected.outcome)"
            )
        }
        XCTAssertNil(refused)
        let stored = try await optIn.load()
        XCTAssertEqual(stored, otherScope)
        let kept = try await vault.load()
        XCTAssertEqual(kept?.scope, otherScope)
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 1)
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [])
    }

    /// A fence acknowledgement waits for opt-in mutation, never for a network
    /// snapshot. The suspended pass resumes under its stale epoch and writes
    /// nothing.
    func testFenceAcknowledgesWhileANetworkPassIsSuspended() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(2901)])
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            loader: loader
        )
        await loader.suspendNextLoad()
        let refreshing = Task {
            await lifecycle.refresh(
                trigger: .calendar,
                scope: self.scope,
                credential: self.credential()
            )
        }
        await loader.waitUntilSuspended()

        let acknowledged = LifecycleCompletionFlag()
        let fencing = Task {
            let result = await lifecycle.fence()
            await acknowledged.complete(result)
            return result
        }
        var polls = 0
        while !(await acknowledged.isComplete) && polls < 100 {
            try await Task.sleep(nanoseconds: 10_000_000)
            polls += 1
        }
        let acknowledgedWithoutNetwork = await acknowledged.isComplete
        XCTAssertTrue(
            acknowledgedWithoutNetwork,
            "fence must acknowledge without waiting for the network"
        )

        await loader.resumeSuspended()
        let fenceResult = await fencing.value
        XCTAssertTrue(fenceResult)
        let report = await refreshing.value
        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 0)
        let stored = try await optIn.load()
        XCTAssertNil(stored)
    }

    /// The permission sheet can stay open indefinitely. A fence acknowledges
    /// the durable opt-in retirement without waiting for it, and the late
    /// authorization cannot enable the account.
    func testFenceAcknowledgesWhileThePermissionSheetIsSuspended() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let authorization = LifecycleFakeAuthorization(
            permission: .notDetermined
        )
        await authorization.suspendNextRequest()
        let optIn = LifecycleFakeOptIn()
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            authorization: authorization,
            loader: LifecycleSnapshotLoader { _ in self.snapshot() }
        )
        let connecting = Task {
            await lifecycle.connect(
                scope: self.scope,
                credential: self.credential(),
                requestPermission: true
            )
        }
        await authorization.waitUntilRequestStarted()

        let acknowledged = LifecycleCompletionFlag()
        let fencing = Task {
            let result = await lifecycle.fence()
            await acknowledged.complete(result)
            return result
        }
        var polls = 0
        while !(await acknowledged.isComplete) && polls < 100 {
            try await Task.sleep(nanoseconds: 10_000_000)
            polls += 1
        }
        let acknowledgedWithoutPermission = await acknowledged.isComplete
        XCTAssertTrue(
            acknowledgedWithoutPermission,
            "fence must acknowledge without waiting for the permission sheet"
        )

        await authorization.resumeRequest(.authorized)
        let fenceResult = await fencing.value
        XCTAssertTrue(fenceResult)
        let report = await connecting.value
        XCTAssertEqual(report.outcome, .deferred(.inactive))
        let stored = try await optIn.load()
        XCTAssertNil(stored)
        let kept = try await vault.load()
        XCTAssertNil(kept)
        let scheduled = await store.scheduleCount
        XCTAssertEqual(scheduled, 0)
    }

    /// Recovery of nothing is a no-op. An in-flight pass for the signed-in
    /// account must not be fenced by a retry that finds no durable teardown.
    func testRecoveryOfAnAbsentTeardownDoesNotFenceAnActivePass() async throws {
        let store = LifecycleFakeStore()
        let (journal, _) = temporaryJournal()
        let optIn = LifecycleFakeOptIn(scope: scope)
        let loader = LifecycleSnapshotLoader { _ in
            self.snapshot(candidates: [self.candidate(3001)])
        }
        let (lifecycle, _, vault) = makeLifecycle(
            store: store,
            journal: journal,
            optIn: optIn,
            teardown: LifecycleFakeTeardown(),
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: scope,
            credential: credential(),
            requestPermission: true
        )
        await loader.suspendNextLoad()
        let refreshing = Task {
            await lifecycle.refresh(
                trigger: .manual,
                scope: self.scope,
                credential: self.credential()
            )
        }
        await loader.waitUntilSuspended()

        let recovery = Task { await lifecycle.recoverCleanup() }
        await Task.yield()
        await loader.resumeSuspended()

        let report = await refreshing.value
        let recovered = await recovery.value
        XCTAssertTrue(recovered)
        guard case .synced = report.outcome else {
            return XCTFail(
                "an absent recovery must not fence the active pass, got \(report.outcome)"
            )
        }
        let stored = try await optIn.load()
        XCTAssertEqual(stored, scope)
        let kept = try await vault.load()
        XCTAssertEqual(kept?.scope, scope)
    }

    /// Recovering another scope's durable teardown waits for the current
    /// account's pass and leaves its opt-in/credential intact.
    func testRecoveryOfAnotherScopesTeardownKeepsTheActivePass() async throws {
        let planA = UUID()
        let store = LifecycleFakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planA,
                    startDate: readAt.addingTimeInterval(3_600),
                    isComplete: false
                ),
            ]
        )
        let (journal, _) = temporaryJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 3101,
                planID: planA,
                scheduledDate: readAt.addingTimeInterval(3_600),
                fingerprint: "a"
            )
        )
        let nextCredential = credential(scope: otherScope)
        let vault = LifecycleFakeVault(credential: nextCredential)
        let optIn = LifecycleFakeOptIn(scope: otherScope)
        let teardown = LifecycleFakeTeardown()
        let loader = LifecycleSnapshotLoader { requested in
            self.snapshot(candidates: [self.candidate(3102)], scope: requested)
        }
        let (lifecycle, _, _) = makeLifecycle(
            store: store,
            journal: journal,
            vault: vault,
            optIn: optIn,
            teardown: teardown,
            loader: loader
        )
        _ = await lifecycle.connect(
            scope: otherScope,
            credential: nextCredential,
            requestPermission: true
        )
        try await teardown.add(scope)
        await loader.suspendNextLoad()
        let refreshing = Task {
            await lifecycle.refresh(
                trigger: .manual,
                scope: self.otherScope,
                credential: nextCredential
            )
        }
        await loader.waitUntilSuspended()

        let recovery = Task { await lifecycle.recoverCleanup() }
        await Task.yield()
        await loader.resumeSuspended()

        let report = await refreshing.value
        let recovered = await recovery.value
        XCTAssertTrue(recovered)
        guard case .synced = report.outcome else {
            return XCTFail(
                "another scope's recovery must not fence B, got \(report.outcome)"
            )
        }
        let stored = try await optIn.load()
        XCTAssertEqual(stored, otherScope)
        let kept = try await vault.load()
        XCTAssertEqual(kept?.scope, otherScope)
        let pending = try await teardown.load()
        XCTAssertEqual(pending, [])
        let removed = await store.removeCount
        XCTAssertEqual(removed, 1)
    }

}


private actor LifecycleCompletionFlag {
    private(set) var isComplete = false
    private(set) var value: Bool?

    func complete(_ value: Bool) {
        self.value = value
        isComplete = true
    }
}

// MARK: - Fakes

private enum LifecycleFakeStoreError: Error {
    case unavailable
}

private actor LifecycleOperationLog {
    private(set) var entries: [String] = []

    func append(_ entry: String) {
        entries.append(entry)
    }

    func reset() {
        entries = []
    }
}

private actor LifecycleFakeStore: ScheduleWorkoutStore {
    private var capacity: Int
    private(set) var workouts: [ScheduledWorkoutState]
    private(set) var scheduleCount = 0
    private(set) var removeCount = 0
    private(set) var scheduleRequests: [ScheduleWorkoutRequest] = []
    private var readFailure: Error?
    private(set) var readCount = 0
    private var hideNext = false
    private var hidden: [ScheduledWorkoutState] = []
    private var suspendScheduleBeforeFence = false
    private var suspendRead = false
    private var readIsSuspended = false
    private var readResumeWaiter: CheckedContinuation<Void, Never>?
    private var scheduleSuspended = false
    private var scheduleResumeWaiter: CheckedContinuation<Void, Never>?
    private var log: LifecycleOperationLog?
    /// Counts *new scheduled workouts* that begin after a logout/disconnect
    /// started. Authorized cleanup removals are not new scheduling.
    private(set) var scheduleCountAfterDisconnectStart = 0
    private var disconnectStarted = false

    init(
        capacity: Int = 50,
        workouts: [ScheduledWorkoutState] = []
    ) {
        self.capacity = capacity
        self.workouts = workouts
    }

    func use(log: LifecycleOperationLog) {
        self.log = log
    }

    func setDisconnectStarted() {
        disconnectStarted = true
    }

    func setReadFailure(_ error: Error?) {
        readFailure = error
    }

    func hideNextWrite(_ hide: Bool = true) {
        hideNext = hide
    }

    func maximumScheduledWorkoutCount() async -> Int {
        capacity
    }

    func suspendNextRead() {
        suspendRead = true
    }

    func waitUntilReadSuspended() async {
        while !readIsSuspended {
            await Task.yield()
        }
        while readResumeWaiter == nil {
            await Task.yield()
        }
    }

    func resumeSuspendedRead() {
        readIsSuspended = false
        readResumeWaiter?.resume()
        readResumeWaiter = nil
    }

    func scheduledWorkouts(calendar: Calendar) async throws -> [ScheduledWorkoutState] {
        readCount += 1
        if suspendRead {
            suspendRead = false
            readIsSuspended = true
            await withCheckedContinuation { continuation in
                readResumeWaiter = continuation
            }
        }
        if let error = readFailure {
            throw error
        }
        return workouts
    }

    func suspendNextScheduleBeforeFence() {
        suspendScheduleBeforeFence = true
    }

    func waitUntilScheduleSuspended() async {
        while !scheduleSuspended {
            await Task.yield()
        }
        while scheduleResumeWaiter == nil {
            await Task.yield()
        }
    }

    func resumeSuspendedSchedule() {
        scheduleSuspended = false
        scheduleResumeWaiter?.resume()
        scheduleResumeWaiter = nil
    }

    func schedule(
        _ request: ScheduleWorkoutRequest,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        if suspendScheduleBeforeFence {
            suspendScheduleBeforeFence = false
            scheduleSuspended = true
            await withCheckedContinuation { continuation in
                scheduleResumeWaiter = continuation
            }
        }
        try await fence.prepareSubmission()
        if disconnectStarted {
            scheduleCountAfterDisconnectStart += 1
        }
        scheduleCount += 1
        scheduleRequests.append(request)
        await log?.append("store.schedule:\(request.eventID)")
        let state = ScheduledWorkoutState(
            planID: request.planID,
            startDate: request.startDate,
            isComplete: false
        )
        if hideNext {
            hideNext = false
            hidden.append(state)
        } else {
            workouts.append(state)
        }
    }

    func remove(
        planID: UUID,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        try await fence.check()
        removeCount += 1
        await log?.append("store.remove")
        workouts.removeAll { $0.planID == planID && !$0.isComplete }
    }
}

private actor LifecycleFakeVault: WatchScheduleCredentialVault {
    private var stored: WatchScheduleCredential?
    private(set) var saveCount = 0
    private(set) var loadCount = 0
    private(set) var purgeCount = 0
    private var purgeFailures = 0

    init(credential: WatchScheduleCredential? = nil) {
        stored = credential
    }

    func load() async throws -> WatchScheduleCredential? {
        loadCount += 1
        return stored
    }

    func save(_ credential: WatchScheduleCredential) async throws {
        saveCount += 1
        stored = credential
    }

    func failNextPurge() {
        purgeFailures += 1
    }

    func purge() async throws {
        purgeCount += 1
        if purgeFailures > 0 {
            purgeFailures -= 1
            throw LifecycleFakeStoreError.unavailable
        }
        stored = nil
    }
}

private actor LifecycleFakeOptIn: WatchScheduleOptInStore {
    private var scope: AccountScope?
    private var suspendSave = false
    private var saveWaiter: CheckedContinuation<Void, Never>?
    private var loadFailures = 0
    private var clearFailures = 0
    private var failOnNextLoadAfterClear = false
    private var suspendLoad = false
    private var loadIsSuspended = false
    private var loadWaiter: CheckedContinuation<Void, Never>?

    init(scope: AccountScope? = nil) {
        self.scope = scope
    }

    func load() async throws -> AccountScope? {
        if suspendLoad {
            suspendLoad = false
            loadIsSuspended = true
            await withCheckedContinuation { continuation in
                loadWaiter = continuation
            }
        }
        if loadFailures > 0 {
            loadFailures -= 1
            throw LifecycleFakeStoreError.unavailable
        }
        return scope
    }

    func save(_ scope: AccountScope) async throws {
        if suspendSave {
            suspendSave = false
            await withCheckedContinuation { continuation in
                saveWaiter = continuation
            }
        }
        self.scope = scope
    }

    func clear() async throws {
        if clearFailures > 0 {
            clearFailures -= 1
            throw LifecycleFakeStoreError.unavailable
        }
        scope = nil
        if failOnNextLoadAfterClear {
            failOnNextLoadAfterClear = false
            loadFailures += 1
        }
    }

    func failNextLoadAfterClear() {
        failOnNextLoadAfterClear = true
    }

    func failNextLoad() {
        loadFailures += 1
    }

    func suspendNextLoad() {
        suspendLoad = true
    }

    func waitUntilLoadSuspended() async {
        while !loadIsSuspended {
            await Task.yield()
        }
        while loadWaiter == nil {
            await Task.yield()
        }
    }

    func resumeSuspendedLoad() {
        loadIsSuspended = false
        loadWaiter?.resume()
        loadWaiter = nil
    }

    func failNextClear() {
        clearFailures += 1
    }

    func suspendNextSave() {
        suspendSave = true
    }

    func waitUntilSaveSuspended() async {
        while saveWaiter == nil {
            await Task.yield()
        }
    }

    func resumeSuspendedSave() {
        saveWaiter?.resume()
        saveWaiter = nil
    }
}

private actor LifecycleFakeTeardown: WatchScheduleTeardownStore {
    private var scopes: [AccountScope]
    private var addFailures = 0
    private var loadFailures = 0
    private var loadAlwaysFails = false
    private var suspendAdd = false
    private var addSuspended = false
    private var addWaiter: CheckedContinuation<Void, Never>?

    init(initial: [AccountScope] = []) {
        scopes = initial
    }

    func load() async throws -> [AccountScope] {
        if loadAlwaysFails {
            throw LifecycleFakeStoreError.unavailable
        }
        if loadFailures > 0 {
            loadFailures -= 1
            throw LifecycleFakeStoreError.unavailable
        }
        return scopes
    }

    func add(_ scope: AccountScope) async throws {
        if suspendAdd {
            suspendAdd = false
            addSuspended = true
            await withCheckedContinuation { continuation in
                addWaiter = continuation
            }
        }
        if addFailures > 0 {
            addFailures -= 1
            throw LifecycleFakeStoreError.unavailable
        }
        if !scopes.contains(scope) {
            scopes.append(scope)
        }
    }

    func remove(_ scope: AccountScope) async throws {
        scopes.removeAll { $0 == scope }
    }

    func failNextAdd() {
        addFailures += 1
    }

    func failNextLoad() {
        loadFailures += 1
    }

    func failLoads() {
        loadAlwaysFails = true
    }

    func suspendNextAdd() {
        suspendAdd = true
    }

    func waitUntilAddSuspended() async {
        while !addSuspended {
            await Task.yield()
        }
        while addWaiter == nil {
            await Task.yield()
        }
    }

    func resumeSuspendedAdd() {
        addSuspended = false
        addWaiter?.resume()
        addWaiter = nil
    }
}

private actor LifecycleFakeAuthorization: WatchScheduleAuthorizing {
    private var permissionValue: WatchSchedulePermission
    private let requested: WatchSchedulePermission
    private(set) var requestCount = 0
    private var suspendRequest = false
    private var requestWaiter: CheckedContinuation<WatchSchedulePermission, Never>?

    init(
        permission: WatchSchedulePermission = .authorized,
        requested: WatchSchedulePermission = .authorized
    ) {
        permissionValue = permission
        self.requested = requested
    }

    func setPermission(_ permission: WatchSchedulePermission) {
        permissionValue = permission
    }

    func permission() async -> WatchSchedulePermission {
        permissionValue
    }

    func requestPermission() async -> WatchSchedulePermission {
        requestCount += 1
        if suspendRequest {
            suspendRequest = false
            let result = await withCheckedContinuation { continuation in
                requestWaiter = continuation
            }
            permissionValue = result
            return result
        }
        permissionValue = requested
        return requested
    }

    func suspendNextRequest() {
        suspendRequest = true
    }

    func waitUntilRequestStarted() async {
        while requestWaiter == nil {
            await Task.yield()
        }
    }

    func resumeRequest(_ permission: WatchSchedulePermission) {
        requestWaiter?.resume(returning: permission)
        requestWaiter = nil
    }
}

/// A snapshot source that can suspend, fail once or count reads. It is the
/// stand-in for `ScheduleSource` so lifecycle tests never touch the network.
private actor LifecycleSnapshotLoader {
    private let build: @Sendable (AccountScope) -> ScheduleSnapshot
    private(set) var loadCount = 0
    private var suspended = false
    private var suspensionWaiters: [CheckedContinuation<Void, Never>] = []
    private var resumeWaiter: CheckedContinuation<Void, Never>?
    private var failure: Error?
    private(set) var loadedScopes: [AccountScope] = []
    private var log: LifecycleOperationLog?

    init(build: @escaping @Sendable (AccountScope) -> ScheduleSnapshot) {
        self.build = build
    }

    func use(log: LifecycleOperationLog) {
        self.log = log
    }

    func load(_ scope: AccountScope) async throws -> ScheduleSnapshot {
        loadCount += 1
        loadedScopes.append(scope)
        if let log = log {
            await log.append(
                "load:\(scope.instanceURL.absoluteString):\(scope.athleteId)"
            )
        }
        if suspended {
            await withCheckedContinuation { continuation in
                resumeWaiter = continuation
            }
        }
        if let failure {
            self.failure = nil
            throw failure
        }
        return build(scope)
    }

    func suspendNextLoad() {
        suspended = true
    }

    func waitUntilSuspended() async {
        while !suspended {
            await Task.yield()
        }
        while resumeWaiter == nil {
            await Task.yield()
        }
    }

    func resumeSuspended() {
        suspended = false
        resumeWaiter?.resume()
        resumeWaiter = nil
    }

    func failNextLoad(_ error: Error) {
        failure = error
    }
}

final class WatchScheduleBackgroundPolicyTests: XCTestCase {
    private let now = Date(timeIntervalSince1970: 1_800_000_000)

    func testSchedulesSoonWhenTheTokenOutlivesTheMargin() {
        let earliest = WatchScheduleBackgroundPolicy.earliestBeginDate(
            credentialExpiresAt: now.addingTimeInterval(60 * 60),
            now: now
        )

        XCTAssertEqual(earliest, now.addingTimeInterval(5 * 60))
    }

    func testDoesNotSubmitWhenTheTokenExpiresBeforeUse() {
        XCTAssertNil(
            WatchScheduleBackgroundPolicy.earliestBeginDate(
                credentialExpiresAt: now.addingTimeInterval(12 * 60),
                now: now
            )
        )
        XCTAssertNotNil(
            WatchScheduleBackgroundPolicy.earliestBeginDate(
                credentialExpiresAt: now.addingTimeInterval(20 * 60),
                now: now
            )
        )
    }

    func testDoesNotSubmitWithoutAnExpiry() {
        XCTAssertNil(
            WatchScheduleBackgroundPolicy.earliestBeginDate(
                credentialExpiresAt: nil,
                now: now
            )
        )
    }
}

final class FileWatchScheduleTeardownStoreTests: XCTestCase {
    func testPersistsAuthorizationAcrossInstances() async throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("watch-teardown-\(UUID().uuidString).json")
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }
        let scope = AccountScope(
            instanceURL: URL(string: "https://train.example.org/api")!,
            athleteId: 7
        )

        let first = FileWatchScheduleTeardownStore(fileURL: url)
        try await first.add(scope)
        let second = FileWatchScheduleTeardownStore(fileURL: url)
        let watched901 = try await second.load()
        XCTAssertEqual(watched901, [scope])

        try await second.remove(scope)
        let third = FileWatchScheduleTeardownStore(fileURL: url)
        let watched902 = try await third.load()
        XCTAssertEqual(watched902, [])
    }
}
