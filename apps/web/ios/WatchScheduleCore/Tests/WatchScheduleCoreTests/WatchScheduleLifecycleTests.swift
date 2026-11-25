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
        let watched19 = await vault.loadCount
        XCTAssertGreaterThanOrEqual(watched19, 2)
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
        // Logout waits for the in-flight pass to drain; the fetch finishes
        // concurrently, as it would on a real network.
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
    private var hideNext = false
    private var hidden: [ScheduledWorkoutState] = []
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

    func scheduledWorkouts(calendar: Calendar) async throws -> [ScheduledWorkoutState] {
        if let error = readFailure {
            throw error
        }
        return workouts
    }

    func schedule(
        _ request: ScheduleWorkoutRequest,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
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

    func purge() async throws {
        purgeCount += 1
        stored = nil
    }
}

private actor LifecycleFakeOptIn: WatchScheduleOptInStore {
    private var scope: AccountScope?

    init(scope: AccountScope? = nil) {
        self.scope = scope
    }

    func load() async throws -> AccountScope? {
        scope
    }

    func save(_ scope: AccountScope) async throws {
        self.scope = scope
    }

    func clear() async throws {
        scope = nil
    }
}

private actor LifecycleFakeAuthorization: WatchScheduleAuthorizing {
    private var permissionValue: WatchSchedulePermission
    private let requested: WatchSchedulePermission
    private(set) var requestCount = 0

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
        permissionValue = requested
        return requested
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
