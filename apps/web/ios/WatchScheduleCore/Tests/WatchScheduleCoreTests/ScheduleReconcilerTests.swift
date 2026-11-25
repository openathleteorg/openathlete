import XCTest

@testable import WatchScheduleCore

final class ScheduleReconcilerTests: XCTestCase {
    private let scope = AccountScope(
        instanceURL: URL(string: "https://train.example.org/api")!,
        athleteId: 7
    )
    private let otherScope = AccountScope(
        instanceURL: URL(string: "https://train.example.org/api")!,
        athleteId: 99
    )

    private var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        calendar.locale = Locale(identifier: "en_US_POSIX")
        return calendar
    }

    // MARK: - Fixtures

    private func date(_ iso: String) throws -> Date {
        try Date(
            iso,
            strategy: Date.ISO8601FormatStyle(includingFractionalSeconds: true)
        )
    }

    private func candidate(
        _ eventId: Int,
        start: String,
        title: String = "Session",
        power: ClosedRange<Double>? = nil,
        zoneId: Int = 42
    ) throws -> ScheduleCandidate {
        let target = power.map {
            PlannedTarget(
                metric: .power,
                lowerBound: $0.lowerBound,
                upperBound: $0.upperBound,
                zoneId: zoneId
            )
        }
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
                            target: target
                        ),
                    ]
                ),
            ],
            cooldown: nil
        )
        return ScheduleCandidate(
            eventId: eventId,
            startDate: try date(start),
            plan: plan
        )
    }

    private func snapshot(
        candidates: [ScheduleCandidate],
        completed: [Int] = [],
        skipped: [SkippedScheduleEvent] = [],
        owned: [Int]? = nil,
        readAt: String = "2026-06-01T12:00:00.000Z",
        scope: AccountScope? = nil
    ) throws -> ScheduleSnapshot {
        let ownedIds = owned
            ?? Array(
                Set(
                    candidates.map(\.eventId)
                        + completed
                        + skipped.map(\.eventId)
                )
            ).sorted()
        return ScheduleSnapshot(
            scope: scope ?? self.scope,
            window: DateInterval(
                start: try date("2026-06-01T04:00:00.000Z"),
                end: try date("2026-06-09T04:00:00.000Z")
            ),
            readAt: try date(readAt),
            ownedEventIds: ownedIds,
            completedEventIds: completed,
            candidates: candidates,
            skipped: skipped
        )
    }

    private func makeReconciler(
        store: FakeStore,
        journal: FakeJournal,
        generation: UInt64 = 1,
        scope: AccountScope? = nil
    ) async -> ScheduleReconciler {
        let reconciler = ScheduleReconciler(
            store: store,
            journal: journal,
            calendar: calendar
        )
        await reconciler.activate(
            generation: generation,
            for: scope ?? self.scope
        )
        return reconciler
    }

    private func count(
        eventId: Int,
        store: FakeStore,
        journal: FakeJournal
    ) async throws -> Int {
        let receipt = try await journal.receipt(
            scope: scope,
            eventID: eventId
        )
        guard let receipt else {
            return 0
        }
        let workouts = try await store.scheduledWorkouts(calendar: calendar)
        return workouts.filter { $0.planID == receipt.planID }.count
    }

    // MARK: - Initial schedule

    func testInitialSyncSchedulesByDayAndTimeAndPersistsBeforeWriting() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let log = OperationLog()
        await store.use(log: log)
        await journal.use(log: log)
        let reconciler = await makeReconciler(store: store, journal: journal)

        let snapshot = try snapshot(
            candidates: [
                try candidate(13, start: "2026-06-03T13:00:00.000Z"),
                try candidate(12, start: "2026-06-01T13:00:00.000Z"),
                try candidate(11, start: "2026-06-01T12:00:00.000Z"),
            ]
        )

        let summary = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.scheduledEventIDs, [11, 12, 13])
        XCTAssertEqual(summary.confirmedEventIDs, [11, 12, 13])
        XCTAssertEqual(summary.pendingConfirmationEventIDs, [])
        XCTAssertEqual(summary.overflowEventIDs, [])
        XCTAssertEqual(summary.failedEventIDs, [])

        let requests = await store.scheduleRequests
        XCTAssertEqual(requests.map(\.eventID), [11, 12, 13])

        for eventId in [11, 12, 13] {
            let receiptValue = try await journal.receipt(scope: scope, eventID: eventId)
            let receipt = try XCTUnwrap(receiptValue)
            XCTAssertEqual(receipt.scope, scope)
            XCTAssertEqual(receipt.eventID, eventId)
            XCTAssertNil(receipt.pendingOperation)
            XCTAssertFalse(receipt.fingerprint.isEmpty)
            XCTAssertEqual(
                receipt.scheduledDate,
                requests.first { $0.eventID == eventId }?.startDate
            )
            let counted = try await count(eventId: eventId, store: store, journal: journal)
                XCTAssertEqual(counted, 1)
            XCTAssertEqual(
                requests.first { $0.eventID == eventId }?.planID,
                receipt.planID
            )
        }

        let entries = await log.entries
        let savedSnapshots = await journal.savedSnapshots
        for eventId in [11, 12, 13] {
            let save = try XCTUnwrap(
                entries.firstIndex(of: "journal.save:\(eventId)")
            )
            let write = try XCTUnwrap(
                entries.firstIndex(of: "store.schedule:\(eventId)")
            )
            XCTAssertLessThan(save, write)

            let firstSave = try XCTUnwrap(
                savedSnapshots.first { $0.eventID == eventId }
            )
            XCTAssertEqual(firstSave.pendingOperation, .schedule)
            XCTAssertEqual(
                firstSave.planID,
                requests.first { $0.eventID == eventId }?.planID
            )
        }
    }

    func testSameStartTimeIsOrderedByEventID() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(173, start: "2026-06-02T12:00:00.000Z"),
                    try candidate(171, start: "2026-06-02T12:00:00.000Z"),
                    try candidate(172, start: "2026-06-02T12:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.scheduledEventIDs, [171, 172, 173])
        let requests = await store.scheduleRequests
        XCTAssertEqual(requests.map(\.eventID), [171, 172, 173])
    }

    func testRerunUnchangedKeepsOneEntryAndWritesNothing() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(21, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        let writesAfterFirst = await store.scheduleRequests.count
        let removesAfterFirst = await store.removeRequests.count

        let summary = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.unchangedEventIDs, [21])
        XCTAssertEqual(summary.scheduledEventIDs, [])
        let writesAfterRerun = await store.scheduleRequests.count
        let removesAfterRerun = await store.removeRequests.count
        let entriesAfterRerun = try await count(
            eventId: 21,
            store: store,
            journal: journal
        )
        XCTAssertEqual(writesAfterRerun, writesAfterFirst)
        XCTAssertEqual(removesAfterRerun, removesAfterFirst)
        XCTAssertEqual(entriesAfterRerun, 1)
    }

    func testEditReplacesOneEntryAndKeepsTheStablePlanID() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        31,
                        start: "2026-06-02T12:00:00.000Z",
                        power: 200...230
                    ),
                ]
            ),
            scope: scope,
            generation: 1
        )
        let originalValue = try await journal.receipt(scope: scope, eventID: 31)
        let original = try XCTUnwrap(originalValue)

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        31,
                        start: "2026-06-02T12:00:00.000Z",
                        power: 240...270
                    ),
                ]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.replacedEventIDs, [31])
        XCTAssertEqual(summary.scheduledEventIDs, [])
        let counted = try await count(eventId: 31, store: store, journal: journal)
        XCTAssertEqual(counted, 1)
        let updatedValue = try await journal.receipt(scope: scope, eventID: 31)
        let updated = try XCTUnwrap(updatedValue)
        XCTAssertEqual(updated.planID, original.planID)
        XCTAssertNotEqual(updated.fingerprint, original.fingerprint)
        XCTAssertNil(updated.pendingOperation)

        let saves = await journal.savedSnapshots
        let replacement = try XCTUnwrap(
            saves.first {
                $0.eventID == 31 && $0.pendingOperation == .replace
            }
        )
        XCTAssertEqual(
            replacement.pendingPreviousDate,
            try date("2026-06-02T12:00:00.000Z")
        )
    }

    func testChangedZoneBoundsCauseReplacement() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        32,
                        start: "2026-06-02T12:00:00.000Z",
                        power: 210...245,
                        zoneId: 42
                    ),
                ]
            ),
            scope: scope,
            generation: 1
        )
        let firstValue = try await journal.receipt(scope: scope, eventID: 32)
        let first = try XCTUnwrap(firstValue)

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        32,
                        start: "2026-06-02T12:00:00.000Z",
                        power: 230...260,
                        zoneId: 43
                    ),
                ]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.replacedEventIDs, [32])
        let counted = try await count(eventId: 32, store: store, journal: journal)
        XCTAssertEqual(counted, 1)
        let secondValue = try await journal.receipt(scope: scope, eventID: 32)
        let second = try XCTUnwrap(secondValue)
        XCTAssertEqual(second.planID, first.planID)
        XCTAssertNotEqual(second.fingerprint, first.fingerprint)
    }

    func testMoveRemovesTheOldDateAndSchedulesTheNewOne() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(41, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        let oldReceiptValue = try await journal.receipt(scope: scope, eventID: 41)
        let oldReceipt = try XCTUnwrap(oldReceiptValue)

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(41, start: "2026-06-04T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.replacedEventIDs, [41])
        let workouts = await store.workouts
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(workouts.first?.planID, oldReceipt.planID)
        XCTAssertEqual(
            workouts.first?.startDate,
            try date("2026-06-04T12:00:00.000Z")
        )
        let newReceiptValue = try await journal.receipt(scope: scope, eventID: 41)
        let newReceipt = try XCTUnwrap(newReceiptValue)
        XCTAssertEqual(
            newReceipt.scheduledDate,
            try date("2026-06-04T12:00:00.000Z")
        )
        XCTAssertNil(newReceipt.pendingOperation)
    }

    // MARK: - Interrupted work

    func testCrashBeforeTheMoveWriteIsRetriedWithoutDuplicates() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(51, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        await store.failNextScheduleBeforeWrite()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(51, start: "2026-06-05T12:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("An unconfirmed write must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let workoutsAfterFailure = await store.workouts
        XCTAssertEqual(workoutsAfterFailure.count, 0)
        let pendingValue = try await journal.receipt(scope: scope, eventID: 51)
        let pending = try XCTUnwrap(pendingValue)
        XCTAssertEqual(pending.pendingOperation, .replace)
        XCTAssertEqual(pending.pendingPhase, .writing)
        XCTAssertEqual(
            pending.pendingPreviousDate,
            try date("2026-06-02T12:00:00.000Z")
        )
        XCTAssertEqual(
            pending.scheduledDate,
            try date("2026-06-05T12:00:00.000Z")
        )

        // A fresh reconciler simulates the app relaunching after the crash.
        let relaunched = await makeReconciler(store: store, journal: journal)
        let recovered = try await relaunched.reconcile(
            try snapshot(
                candidates: [try candidate(51, start: "2026-06-05T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(recovered.scheduledEventIDs, [51])
        let recoveredWorkouts = await store.workouts
        XCTAssertEqual(recoveredWorkouts.count, 1)
        XCTAssertEqual(
            recoveredWorkouts.first?.startDate,
            try date("2026-06-05T12:00:00.000Z")
        )
        let recoveredCount = try await count(
            eventId: 51,
            store: store,
            journal: journal
        )
        XCTAssertEqual(recoveredCount, 1)
        let recoveredReceiptValue = try await journal.receipt(scope: scope, eventID: 51)
        let recoveredReceipt = try XCTUnwrap(recoveredReceiptValue)
        XCTAssertNil(recoveredReceipt.pendingOperation)
    }

    func testCrashAfterTheWriteButBeforeTheJournalUpdateDoesNotDuplicate() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(52, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        await store.failNextScheduleAfterWrite()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(52, start: "2026-06-06T12:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("An unconfirmed write must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 52)
            )
        }
        let interruptedWorkouts = await store.workouts
        XCTAssertEqual(interruptedWorkouts.count, 1)
        let schedulesAfterInterruption = await store.scheduleRequests.count

        let relaunched = await makeReconciler(store: store, journal: journal)
        let recovered = try await relaunched.reconcile(
            try snapshot(
                candidates: [try candidate(52, start: "2026-06-06T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        let deduplicatedCount = try await count(
            eventId: 52,
            store: store,
            journal: journal
        )
        let schedulesAfterRecovery = await store.scheduleRequests.count
        XCTAssertEqual(recovered.scheduledEventIDs, [])
        XCTAssertEqual(deduplicatedCount, 1)
        XCTAssertEqual(schedulesAfterRecovery, schedulesAfterInterruption)
        let receiptValue = try await journal.receipt(scope: scope, eventID: 52)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertNil(receipt.pendingOperation)
        XCTAssertNil(receipt.pendingPhase)
    }

    func testDuplicateAppleEntriesForOnePlanCollapseToOne() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(53, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(snapshot, scope: scope, generation: 1)
        let receiptValue = try await journal.receipt(scope: scope, eventID: 53)
        let receipt = try XCTUnwrap(receiptValue)
        await store.seed(
            ScheduledWorkoutState(
                planID: receipt.planID,
                startDate: try date("2026-06-02T12:00:00.000Z"),
                isComplete: false
            )
        )
        let seededWorkouts = await store.workouts
        XCTAssertEqual(seededWorkouts.count, 2)

        _ = try await reconciler.reconcile(snapshot, scope: scope, generation: 1)

        let collapsedCount = try await count(
            eventId: 53,
            store: store,
            journal: journal
        )
        XCTAssertEqual(collapsedCount, 1)
    }

    // MARK: - Filters and Apple state

    func testCancelledEventIsRemovedAndAbsent() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(61, start: "2026-06-02T12:00:00.000Z"),
                    try candidate(62, start: "2026-06-02T13:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 1
        )

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(61, start: "2026-06-02T12:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.removedEventIDs, [62])
        let remainingWorkouts = await store.workouts
        XCTAssertEqual(remainingWorkouts.count, 1)
        let cancelledReceipt = try await journal.receipt(
            scope: scope,
            eventID: 62
        )
        XCTAssertNil(cancelledReceipt)
    }

    func testAppleCompletedEntryIsNotRescheduled() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(71, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(snapshot, scope: scope, generation: 1)
        let receiptValue = try await journal.receipt(scope: scope, eventID: 71)
        let receipt = try XCTUnwrap(receiptValue)
        await store.markComplete(planID: receipt.planID)
        let scheduleCount = await store.scheduleRequests.count

        let summary = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.completedEventIDs, [71])
        let schedulesAfterCompletion = await store.scheduleRequests.count
        let completedWorkouts = await store.workouts
        XCTAssertEqual(schedulesAfterCompletion, scheduleCount)
        XCTAssertEqual(completedWorkouts.count, 1)
        XCTAssertEqual(completedWorkouts.first?.isComplete, true)
    }

    func testPendingRemovalDoesNotDuplicateACompletedAppleEntry() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(72, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(snapshot, scope: scope, generation: 1)
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 72
        )
        let receipt = try XCTUnwrap(receiptValue)
        await store.markComplete(planID: receipt.planID)
        try await journal.save(
            ScheduleReceipt(
                scope: receipt.scope,
                eventID: receipt.eventID,
                planID: receipt.planID,
                scheduledDate: receipt.scheduledDate,
                fingerprint: receipt.fingerprint,
                pendingOperation: .remove
            )
        )
        let scheduleCount = await store.scheduleRequests.count

        let summary = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.completedEventIDs, [72])
        let schedulesAfter = await store.scheduleRequests.count
        let workouts = await store.workouts
        XCTAssertEqual(schedulesAfter, scheduleCount)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(workouts.first?.isComplete, true)
    }

    func testRetryableReadFailuresKeepPriorEntries() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(81, start: "2026-06-02T12:00:00.000Z"),
                    try candidate(82, start: "2026-06-02T13:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 1
        )
        let removeCount = await store.removeRequests.count

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                skipped: [
                    SkippedScheduleEvent(
                        eventId: 81,
                        startDate: try date("2026-06-02T12:00:00.000Z"),
                        reason: .detailUnavailable
                    ),
                    SkippedScheduleEvent(
                        eventId: 82,
                        startDate: try date("2026-06-02T13:00:00.000Z"),
                        reason: .zonesUnavailable
                    ),
                ]
            ),
            scope: scope,
            generation: 1
        )

        let removesAfterRetry = await store.removeRequests.count
        let retainedWorkouts = await store.workouts
        let firstReceipt = try await journal.receipt(scope: scope, eventID: 81)
        let secondReceipt = try await journal.receipt(scope: scope, eventID: 82)
        XCTAssertEqual(summary.retainedEventIDs, [81, 82])
        XCTAssertEqual(removesAfterRetry, removeCount)
        XCTAssertEqual(retainedWorkouts.count, 2)
        XCTAssertNotNil(firstReceipt)
        XCTAssertNotNil(secondReceipt)
    }

    func testConfirmedUnsupportedChangeRemovesThePriorEntry() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(83, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                skipped: [
                    SkippedScheduleEvent(
                        eventId: 83,
                        startDate: try date("2026-06-02T12:00:00.000Z"),
                        reason: .unsupported(.unsupportedSport)
                    ),
                ]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.removedEventIDs, [83])
        let remainingWorkouts = await store.workouts
        XCTAssertEqual(remainingWorkouts.count, 0)
        let unsupportedReceipt = try await journal.receipt(
            scope: scope,
            eventID: 83
        )
        XCTAssertNil(unsupportedReceipt)
    }

    func testForeignAppleEntriesAreNeverTouched() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let foreign = ScheduledWorkoutState(
            planID: UUID(),
            startDate: try date("2026-06-02T06:00:00.000Z"),
            isComplete: false
        )
        await store.seed(foreign)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(91, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        let removeRequests = await store.removeRequests
        XCTAssertTrue(workouts.contains(foreign))
        XCTAssertEqual(workouts.count, 2)
        XCTAssertFalse(removeRequests.contains(foreign.planID))
    }

    // MARK: - Capacity and order

    func testOverflowBecomesSchedulableOnALaterPass() async throws {
        let store = FakeStore(capacity: 2)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [
                try candidate(103, start: "2026-06-03T12:00:00.000Z"),
                try candidate(101, start: "2026-06-01T12:00:00.000Z"),
                try candidate(102, start: "2026-06-02T12:00:00.000Z"),
            ]
        )

        let first = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(first.scheduledEventIDs, [101, 102])
        XCTAssertEqual(first.overflowEventIDs, [103])
        let firstWorkouts = await store.workouts
        XCTAssertEqual(firstWorkouts.count, 2)

        await store.setCapacity(5)
        let second = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(second.scheduledEventIDs, [103])
        XCTAssertEqual(second.overflowEventIDs, [])
        let overflowCount = try await count(
            eventId: 103,
            store: store,
            journal: journal
        )
        let allWorkouts = await store.workouts
        XCTAssertEqual(overflowCount, 1)
        XCTAssertEqual(allWorkouts.count, 3)
    }

    func testForeignEntriesCountAgainstAppleCapacity() async throws {
        let store = FakeStore(capacity: 2)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let foreign = ScheduledWorkoutState(
            planID: UUID(),
            startDate: try date("2026-06-01T06:00:00.000Z"),
            isComplete: false
        )
        await store.seed(foreign)
        let snapshot = try snapshot(
            candidates: [
                try candidate(104, start: "2026-06-01T12:00:00.000Z"),
                try candidate(105, start: "2026-06-02T12:00:00.000Z"),
            ]
        )

        let first = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(first.scheduledEventIDs, [104])
        XCTAssertEqual(first.overflowEventIDs, [105])
        let firstWorkouts = await store.workouts
        XCTAssertTrue(firstWorkouts.contains(foreign))

        await store.setCapacity(3)
        let second = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        XCTAssertEqual(second.scheduledEventIDs, [105])
        let secondWorkouts = await store.workouts
        XCTAssertEqual(secondWorkouts.count, 3)
    }

    // MARK: - Safety gates

    func testStaleGenerationBlocksEveryWrite() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(111, start: "2026-06-02T12:00:00.000Z")]
        )

        do {
            _ = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 2
            )
            XCTFail("A stale generation must not write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }

        await reconciler.invalidate()
        do {
            _ = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
            XCTFail("An invalidated account must not write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }

        let staleWrites = await store.scheduleRequests
        let staleReceipts = try await journal.allReceipts()
        XCTAssertEqual(staleWrites.count, 0)
        XCTAssertTrue(staleReceipts.isEmpty)
    }

    func testStoreReadFailureDoesNotReconcile() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        await store.failNextRead()
        let reconciler = await makeReconciler(store: store, journal: journal)

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(121, start: "2026-06-02T12:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("An unreadable Apple schedule is not a reconciliation")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let readFailureWrites = await store.scheduleRequests
        let readFailureReceipts = try await journal.allReceipts()
        XCTAssertEqual(readFailureWrites.count, 0)
        XCTAssertTrue(readFailureReceipts.isEmpty)
    }

    func testDeniedPermissionStopsReconciliation() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        await store.failNextRead(with: .unauthorized)
        let reconciler = await makeReconciler(store: store, journal: journal)

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(122, start: "2026-06-02T12:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("A revoked permission is not a reconciliation")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .schedulingDenied)
        }

        let writes = await store.scheduleRequests
        let receipts = try await journal.allReceipts()
        XCTAssertEqual(writes.count, 0)
        XCTAssertTrue(receipts.isEmpty)
    }

    func testRevokedPermissionDuringWritesStopsTheRemainingEvents() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        await store.failNextSchedule(with: .unauthorized)
        let reconciler = await makeReconciler(store: store, journal: journal)

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(123, start: "2026-06-02T12:00:00.000Z"),
                        try candidate(124, start: "2026-06-02T13:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("Revocation in the middle of a pass must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .schedulingDenied)
        }

        let writes = await store.scheduleRequests
        let workouts = await store.workouts
        let firstReceipt = try await journal.receipt(scope: scope, eventID: 123)
        let secondReceipt = try await journal.receipt(scope: scope, eventID: 124)
        XCTAssertEqual(writes.count, 0)
        XCTAssertEqual(workouts.count, 0)
        XCTAssertEqual(firstReceipt?.pendingOperation, .schedule)
        XCTAssertEqual(firstReceipt?.pendingPhase, .writing)
        XCTAssertNil(secondReceipt)
    }

    func testInvalidOrMismatchedSnapshotWritesNothing() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let malformed = ScheduleSnapshot(
            scope: scope,
            window: DateInterval(
                start: try date("2026-06-01T04:00:00.000Z"),
                end: try date("2026-06-09T04:00:00.000Z")
            ),
            readAt: try date("2026-06-01T12:00:00.000Z"),
            ownedEventIds: [1, 1],
            completedEventIds: [],
            candidates: [
                try candidate(1, start: "2026-06-02T12:00:00.000Z"),
            ],
            skipped: []
        )

        do {
            _ = try await reconciler.reconcile(
                malformed,
                scope: scope,
                generation: 1
            )
            XCTFail("A malformed snapshot must not reconcile")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .invalidSnapshot)
        }

        let mismatched = try snapshot(
            candidates: [try candidate(2, start: "2026-06-02T12:00:00.000Z")]
        )
        do {
            _ = try await reconciler.reconcile(
                mismatched,
                scope: otherScope,
                generation: 1
            )
            XCTFail("A snapshot for another account must not reconcile")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .scopeMismatch)
        }

        let invalidWrites = await store.scheduleRequests
        let invalidReceipts = try await journal.allReceipts()
        XCTAssertEqual(invalidWrites.count, 0)
        XCTAssertTrue(invalidReceipts.isEmpty)
    }

    // MARK: - Cleanup interface

    func testPendingCleanupForAnotherAccountRunsBeforeNewScheduling() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let log = OperationLog()
        await store.use(log: log)
        await journal.use(log: log)
        let oldPlanID = UUID()
        let oldState = ScheduledWorkoutState(
            planID: oldPlanID,
            startDate: try date("2026-06-02T09:00:00.000Z"),
            isComplete: false
        )
        await store.seed(oldState)
        try await journal.save(
            ScheduleReceipt(
                scope: otherScope,
                eventID: 130,
                planID: oldPlanID,
                scheduledDate: oldState.startDate,
                fingerprint: "old",
                pendingOperation: .remove,
                pendingPreviousDate: nil,
                removalIntent: .cleanup
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(131, start: "2026-06-03T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        let cleanedWorkouts = await store.workouts
        let oldReceipt = try await journal.receipt(
            scope: otherScope,
            eventID: 130
        )
        XCTAssertFalse(cleanedWorkouts.contains(oldState))
        XCTAssertEqual(cleanedWorkouts.count, 1)
        XCTAssertNil(oldReceipt)
        let entries = await log.entries
        let remove = try XCTUnwrap(entries.firstIndex(of: "store.remove:\(oldPlanID)"))
        let write = try XCTUnwrap(entries.firstIndex(of: "store.schedule:131"))
        XCTAssertLessThan(remove, write)
    }

    func testUnfinishedCleanupForAnotherAccountBlocksNewScheduling() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let oldPlanID = UUID()
        let oldState = ScheduledWorkoutState(
            planID: oldPlanID,
            startDate: try date("2026-06-02T09:00:00.000Z"),
            isComplete: false
        )
        await store.seed(oldState)
        try await journal.save(
            ScheduleReceipt(
                scope: otherScope,
                eventID: 129,
                planID: oldPlanID,
                scheduledDate: oldState.startDate,
                fingerprint: "old",
                pendingOperation: .remove,
                removalIntent: .cleanup
            )
        )
        await store.failNextRemove()
        let reconciler = await makeReconciler(store: store, journal: journal)

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(128, start: "2026-06-03T12:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("The previous account's entry must be removed first")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .pendingCleanup(scope: otherScope, eventID: 129)
            )
        }

        let blockedSchedules = await store.scheduleRequests
        let blockedWorkouts = await store.workouts
        XCTAssertEqual(blockedSchedules.count, 0)
        XCTAssertTrue(blockedWorkouts.contains(oldState))
    }

    func testCleanupRemovesOnlyThisScopesUpcomingEntries() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let foreign = ScheduledWorkoutState(
            planID: UUID(),
            startDate: try date("2026-06-02T06:00:00.000Z"),
            isComplete: false
        )
        await store.seed(foreign)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(141, start: "2026-06-02T12:00:00.000Z"),
                    try candidate(142, start: "2026-06-02T13:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 1
        )
        let receiptValue = try await journal.receipt(scope: scope, eventID: 142)
        let receipt = try XCTUnwrap(receiptValue)
        await store.markComplete(planID: receipt.planID)

        let summary = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.removedEventIDs, [141])
        XCTAssertEqual(summary.retainedEventIDs, [])
        let cleanupWorkouts = await store.workouts
        let remainingReceipts = try await journal.receipts(for: scope)
        XCTAssertTrue(cleanupWorkouts.contains(foreign))
        XCTAssertTrue(
            cleanupWorkouts.contains {
                $0.planID == receipt.planID && $0.isComplete
            }
        )
        XCTAssertEqual(cleanupWorkouts.count, 2)
        XCTAssertTrue(remainingReceipts.isEmpty)
    }

    func testFailedCleanupKeepsThePendingRemovalForRetry() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(151, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        await store.failNextRemove()

        let summary = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.retainedEventIDs, [151])
        let pendingValue = try await journal.receipt(scope: scope, eventID: 151)
        let pending = try XCTUnwrap(pendingValue)
        XCTAssertEqual(pending.pendingOperation, .remove)
        let workoutsAfterFailure = await store.workouts
        XCTAssertEqual(workoutsAfterFailure.count, 1)

        let retry = try await reconciler.cleanup(scope: scope, generation: 1)
        XCTAssertEqual(retry.removedEventIDs, [151])
        let retriedReceipt = try await journal.receipt(
            scope: scope,
            eventID: 151
        )
        let workoutsAfterRetry = await store.workouts
        XCTAssertNil(retriedReceipt)
        XCTAssertEqual(workoutsAfterRetry.count, 0)
    }

    func testCleanupRejectsAStaleGeneration() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(152, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        await reconciler.activate(generation: 2, for: scope)

        do {
            _ = try await reconciler.cleanup(scope: scope, generation: 1)
            XCTFail("Cleanup must not run for an old generation")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }

        let workouts = await store.workouts
        XCTAssertEqual(workouts.count, 1)
    }

    // MARK: - Fix round 1: serialization, freshness and replay safety

    func testConcurrentPassesAreSerializedToOneWrite() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(201, start: "2026-06-02T12:00:00.000Z")]
        )
        await store.suspendNextWrite()

        let first = Task {
            try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
        }
        await store.waitUntilWriteIsSuspended()
        let second = Task {
            try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
        }
        // Give the second pass (or a gate waiter) time to run while the first
        // write is suspended.
        for _ in 0..<200 {
            await Task.yield()
        }
        await store.resumeSuspendedWrite()

        _ = try await first.value
        _ = try await second.value

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        XCTAssertEqual(requests.count, 1)
        XCTAssertEqual(workouts.count, 1)
    }

    func testInvalidationDrainsAStartedWriteWithoutConfirmingIt() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(202, start: "2026-06-02T12:00:00.000Z")]
        )
        await store.suspendNextWrite()

        let pass = Task {
            try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
        }
        await store.waitUntilWriteIsSuspended()
        let invalidation = Task {
            await reconciler.invalidate()
        }
        for _ in 0..<100 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                break
            }
            await Task.yield()
        }
        await store.resumeSuspendedWrite()

        do {
            _ = try await pass.value
            XCTFail("A late write must not confirm after invalidation")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }
        await invalidation.value

        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(scope: scope, eventID: 202)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(receipt.pendingOperation, .schedule)
        XCTAssertEqual(receipt.pendingPhase, .confirming)
    }

    func testInvalidationDuringPreflightSubmitsNothing() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(401, start: "2026-06-02T12:00:00.000Z")]
        )
        await store.suspendBeforeFence()

        let pass = Task {
            try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
        }
        await store.waitUntilWriteIsSuspended()
        let invalidation = Task {
            await reconciler.invalidate()
        }
        for _ in 0..<100 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                break
            }
            await Task.yield()
        }
        await store.resumeSuspendedWrite()

        do {
            _ = try await pass.value
            XCTFail("A fenced preflight must not submit")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }
        await invalidation.value

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(scope: scope, eventID: 401)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertTrue(requests.isEmpty)
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertEqual(receipt.pendingOperation, .schedule)
        XCTAssertEqual(receipt.pendingPhase, .writing)
    }

    func testInvalidationDuringRemovalPreflightDoesNotRemove() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(402, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        await store.suspendRemoveBeforeFence()
        let snapshot = try snapshot(
            candidates: [],
            readAt: "2026-06-01T13:00:00.000Z"
        )
        let pass = Task {
            try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
        }
        await store.waitUntilWriteIsSuspended()
        let invalidation = Task {
            await reconciler.invalidate()
        }
        for _ in 0..<100 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                break
            }
            await Task.yield()
        }
        await store.resumeSuspendedWrite()

        do {
            _ = try await pass.value
            XCTFail("A fenced removal must not run")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }
        await invalidation.value

        let removes = await store.removeRequests
        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(scope: scope, eventID: 402)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertTrue(removes.isEmpty)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(receipt.pendingOperation, .remove)
        XCTAssertEqual(receipt.removalIntent, .calendar)
    }

    func testCleanupWaitsForAnInFlightWriteBeforeRemoving() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(208, start: "2026-06-02T12:00:00.000Z")]
        )
        await store.suspendNextWrite()

        let pass = Task {
            try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
        }
        await store.waitUntilWriteIsSuspended()
        let cleanup = Task {
            try await reconciler.cleanup(scope: scope, generation: 1)
        }
        for _ in 0..<200 {
            await Task.yield()
        }
        await store.resumeSuspendedWrite()

        _ = try await pass.value
        let summary = try await cleanup.value
        let workouts = await store.workouts
        let receipt = try await journal.receipt(scope: scope, eventID: 208)
        XCTAssertEqual(summary.removedEventIDs, [208])
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertNil(receipt)
    }

    func testOlderSameGenerationSnapshotIsRejectedBeforeMutation() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(203, start: "2026-06-02T12:00:00.000Z")],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [],
                    completed: [203],
                    readAt: "2026-06-01T12:00:00.000Z"
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("An older same-generation snapshot must not mutate")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleSnapshot)
        }

        let workouts = await store.workouts
        let removes = await store.removeRequests
        XCTAssertEqual(workouts.count, 1)
        XCTAssertTrue(removes.isEmpty)
    }

    func testOwnedEventWithoutADispositionIsInvalid() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let malformed = ScheduleSnapshot(
            scope: scope,
            window: DateInterval(
                start: try date("2026-06-01T04:00:00.000Z"),
                end: try date("2026-06-09T04:00:00.000Z")
            ),
            readAt: try date("2026-06-01T12:00:00.000Z"),
            ownedEventIds: [204],
            completedEventIds: [],
            candidates: [],
            skipped: []
        )

        do {
            _ = try await reconciler.reconcile(
                malformed,
                scope: scope,
                generation: 1
            )
            XCTFail("Every owned ID needs exactly one disposition")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .invalidSnapshot)
        }

        let writes = await store.scheduleRequests
        XCTAssertTrue(writes.isEmpty)
    }

    func testCompletionTombstoneBlocksACancelledThenRecurringEvent() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(205, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(snapshot, scope: scope, generation: 1)
        let receiptValue = try await journal.receipt(scope: scope, eventID: 205)
        let receipt = try XCTUnwrap(receiptValue)
        await store.markComplete(planID: receipt.planID)

        let completed = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        XCTAssertEqual(completed.completedEventIDs, [205])
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 205
        )
        XCTAssertNotNil(tombstone)

        await store.forget(planID: receipt.planID)
        let schedulesAfterCompletion = await store.scheduleRequests.count
        let recurring = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        let schedulesAfterRecurrence = await store.scheduleRequests.count
        XCTAssertEqual(recurring.completedEventIDs, [205])
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertEqual(schedulesAfterRecurrence, schedulesAfterCompletion)
    }

    func testCompletionDuringRemovalPersistsATombstone() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let scheduledSnapshot = try snapshot(
            candidates: [try candidate(206, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(
            scheduledSnapshot,
            scope: scope,
            generation: 1
        )
        await store.completeInsteadOfNextRemove()
        let cancelled = try await reconciler.reconcile(
            try snapshot(candidates: []),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(cancelled.completedEventIDs, [206])
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 206
        )
        XCTAssertNotNil(tombstone)

        let schedulesBefore = await store.scheduleRequests.count
        let recurring = try await reconciler.reconcile(
            scheduledSnapshot,
            scope: scope,
            generation: 1
        )
        let schedulesAfter = await store.scheduleRequests.count
        XCTAssertEqual(recurring.completedEventIDs, [206])
        XCTAssertEqual(schedulesAfter, schedulesBefore)
    }

    func testRetryableSkipStillPersistsAKnownAppleCompletion() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let scheduled = try snapshot(
            candidates: [try candidate(207, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(scheduled, scope: scope, generation: 1)
        let receiptValue = try await journal.receipt(scope: scope, eventID: 207)
        let receipt = try XCTUnwrap(receiptValue)
        await store.markComplete(planID: receipt.planID)
        var pending = receipt
        pending.pendingOperation = .remove
        pending.removalIntent = .calendar
        try await journal.save(pending)

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                skipped: [
                    SkippedScheduleEvent(
                        eventId: 207,
                        startDate: try date("2026-06-02T12:00:00.000Z"),
                        reason: .detailUnavailable
                    ),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 207
        )
        let workouts = await store.workouts
        XCTAssertEqual(summary.completedEventIDs, [207])
        XCTAssertNotNil(tombstone)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(workouts.first?.isComplete, true)
    }

    func testReadBackFailureStopsBeforeTheNextCandidate() async throws {
        let store = FakeStore(capacity: 2)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [
                try candidate(211, start: "2026-06-02T12:00:00.000Z"),
                try candidate(212, start: "2026-06-02T13:00:00.000Z"),
            ]
        )
        await store.failNextReadAfterSchedule()

        do {
            _ = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
            XCTFail("A failed read-back must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let secondReceipt = try await journal.receipt(
            scope: scope,
            eventID: 212
        )
        let firstReceiptValue = try await journal.receipt(
            scope: scope,
            eventID: 211
        )
        let firstReceipt = try XCTUnwrap(firstReceiptValue)
        XCTAssertEqual(requests.map(\.eventID), [211])
        XCTAssertEqual(workouts.count, 1)
        XCTAssertNil(secondReceipt)
        XCTAssertEqual(firstReceipt.pendingOperation, .schedule)
        XCTAssertEqual(firstReceipt.pendingPhase, .confirming)

        let retry = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        let requestsAfterRetry = await store.scheduleRequests
        XCTAssertEqual(retry.scheduledEventIDs, [212])
        XCTAssertEqual(requestsAfterRetry.map(\.eventID), [211, 212])
        let firstCount = try await count(
            eventId: 211,
            store: store,
            journal: journal
        )
        XCTAssertEqual(firstCount, 1)
    }

    func testCancellationAfterAWriteKeepsTheIntentWithoutDuplicating() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(213, start: "2026-06-02T12:00:00.000Z")]
        )
        await store.cancelNextWriteAfterItLands()

        do {
            _ = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
            XCTFail("Cancellation must not look like success")
        } catch is CancellationError {
            // Expected: the intent is still journaled.
        }

        let workoutsAfterCancellation = await store.workouts
        let receiptValue = try await journal.receipt(scope: scope, eventID: 213)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(workoutsAfterCancellation.count, 1)
        XCTAssertEqual(receipt.pendingOperation, .schedule)
        XCTAssertEqual(receipt.pendingPhase, .confirming)

        let retry = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        let schedulesAfterRetry = await store.scheduleRequests.count
        XCTAssertEqual(retry.scheduledEventIDs, [])
        XCTAssertEqual(schedulesAfterRetry, 1)
        let retryCount = try await count(
            eventId: 213,
            store: store,
            journal: journal
        )
        XCTAssertEqual(retryCount, 1)
    }

    func testPendingCalendarRemovalWaitsForACompleteRead() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let scheduledSnapshot = try snapshot(
            candidates: [try candidate(221, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(
            scheduledSnapshot,
            scope: scope,
            generation: 1
        )
        let receiptValue = try await journal.receipt(scope: scope, eventID: 221)
        var receipt = try XCTUnwrap(receiptValue)
        receipt.pendingOperation = .remove
        receipt.removalIntent = .calendar
        try await journal.save(receipt)

        let retained = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                skipped: [
                    SkippedScheduleEvent(
                        eventId: 221,
                        startDate: try date("2026-06-02T12:00:00.000Z"),
                        reason: .detailUnavailable
                    ),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let workoutsAfterRetain = await store.workouts
        XCTAssertEqual(retained.retainedEventIDs, [221])
        XCTAssertEqual(workoutsAfterRetain.count, 1)

        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let workoutsAfterCleanup = await store.workouts
        XCTAssertEqual(cleanup.removedEventIDs, [221])
        XCTAssertTrue(workoutsAfterCleanup.isEmpty)
    }

    func testCleanupRejectsAnotherAccount() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(222, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        do {
            _ = try await reconciler.cleanup(
                scope: otherScope,
                generation: 1
            )
            XCTFail("Cleanup must belong to the active account")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .scopeMismatch)
        }

        let workouts = await store.workouts
        XCTAssertEqual(workouts.count, 1)
    }

    func testCrossAccountReplayRequiresCleanupIntent() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let oldPlanID = UUID()
        let oldState = ScheduledWorkoutState(
            planID: oldPlanID,
            startDate: try date("2026-06-02T09:00:00.000Z"),
            isComplete: false
        )
        await store.seed(oldState)
        try await journal.save(
            ScheduleReceipt(
                scope: otherScope,
                eventID: 223,
                planID: oldPlanID,
                scheduledDate: oldState.startDate,
                fingerprint: "old",
                pendingOperation: .remove,
                removalIntent: .calendar
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(224, start: "2026-06-03T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        XCTAssertTrue(workouts.contains(oldState))
    }

    func testInterruptedReplacementConfirmationReplaysWithoutMutations() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(231, start: "2026-06-02T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        await store.failNextReadAfterSchedule()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(231, start: "2026-06-05T12:00:00.000Z"),
                    ],
                    readAt: "2026-06-01T13:00:00.000Z"
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("The interrupted confirmation must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let receiptValue = try await journal.receipt(scope: scope, eventID: 231)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(receipt.pendingOperation, .replace)
        XCTAssertEqual(receipt.pendingPhase, .confirming)
        let schedulesBefore = await store.scheduleRequests.count
        let removesBefore = await store.removeRequests.count

        let retry = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(231, start: "2026-06-05T12:00:00.000Z"),
                ],
                readAt: "2026-06-01T14:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let schedulesAfter = await store.scheduleRequests.count
        let removesAfter = await store.removeRequests.count
        let workouts = await store.workouts
        let clearedValue = try await journal.receipt(scope: scope, eventID: 231)
        let cleared = try XCTUnwrap(clearedValue)
        XCTAssertEqual(retry.scheduledEventIDs, [])
        XCTAssertEqual(schedulesAfter, schedulesBefore)
        XCTAssertEqual(removesAfter, removesBefore)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertNil(cleared.pendingOperation)
        XCTAssertNil(cleared.pendingPhase)
    }

    func testNewEditWhileAConfirmationIsPendingReplacesStaleContent() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let start = "2026-06-02T12:00:00.000Z"

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [try candidate(251, start: start, power: 200...230)]),
            scope: scope,
            generation: 1
        )
        await store.failNextReadAfterSchedule()
        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(251, start: start, power: 240...270),
                    ],
                    readAt: "2026-06-01T13:00:00.000Z"
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("The first confirmation must be interrupted")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }
        let pendingValue = try await journal.receipt(scope: scope, eventID: 251)
        let pending = try XCTUnwrap(pendingValue)
        XCTAssertEqual(pending.pendingPhase, .confirming)
        let schedulesBefore = await store.scheduleRequests.count
        let removesBefore = await store.removeRequests.count

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(251, start: start, power: 260...290),
                ],
                readAt: "2026-06-01T14:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let schedulesAfter = await store.scheduleRequests.count
        let removesAfter = await store.removeRequests.count
        let clearedValue = try await journal.receipt(scope: scope, eventID: 251)
        let cleared = try XCTUnwrap(clearedValue)
        XCTAssertEqual(summary.replacedEventIDs, [251])
        XCTAssertEqual(schedulesAfter, schedulesBefore + 1)
        XCTAssertEqual(removesAfter, removesBefore + 1)
        XCTAssertNil(cleared.pendingOperation)
        let finalCount = try await count(
            eventId: 251,
            store: store,
            journal: journal
        )
        XCTAssertEqual(finalCount, 1)
    }

    func testInvisibleAcceptedWriteBlocksRetriesAndResolvesOnVisibility() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let start = "2026-06-02T12:00:00.000Z"
        let original = try snapshot(
            candidates: [try candidate(501, start: start)]
        )

        await store.acceptButHideNextWrite()
        do {
            _ = try await reconciler.reconcile(
                original,
                scope: scope,
                generation: 1
            )
            XCTFail("An invisible accepted write is unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 501)
            )
        }
        let firstRequests = await store.scheduleRequests
        let firstWorkouts = await store.workouts
        let hiddenAfterFirst = await store.hiddenWorkoutCount()
        let firstReceiptValue = try await journal.receipt(
            scope: scope,
            eventID: 501
        )
        let firstReceipt = try XCTUnwrap(firstReceiptValue)
        XCTAssertEqual(firstRequests.count, 1)
        XCTAssertTrue(firstWorkouts.isEmpty)
        XCTAssertEqual(hiddenAfterFirst, 1)
        XCTAssertEqual(firstReceipt.pendingPhase, .confirming)

        // Same snapshot: still no same-UUID retry.
        do {
            _ = try await reconciler.reconcile(
                original,
                scope: scope,
                generation: 1
            )
            XCTFail("A hidden write must stay unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 501)
            )
        }

        // Edited event plus an earlier new candidate must not bypass it.
        let edited = try snapshot(
            candidates: [
                try candidate(500, start: "2026-06-01T12:00:00.000Z"),
                try candidate(
                    501,
                    start: "2026-06-03T12:00:00.000Z",
                    power: 240...270
                ),
            ],
            readAt: "2026-06-01T13:00:00.000Z"
        )
        do {
            _ = try await reconciler.reconcile(
                edited,
                scope: scope,
                generation: 1
            )
            XCTFail("A newer candidate must not overtake a hidden write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 501)
            )
        }

        // Cancellation records a durable removal intent without losing the
        // unresolved write.
        let cancelled = try snapshot(
            candidates: [],
            readAt: "2026-06-01T14:00:00.000Z"
        )
        do {
            _ = try await reconciler.reconcile(
                cancelled,
                scope: scope,
                generation: 1
            )
            XCTFail("Cancellation must not drop a hidden write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 501)
            )
        }
        let cancelledReceiptValue = try await journal.receipt(
            scope: scope,
            eventID: 501
        )
        let cancelledReceipt = try XCTUnwrap(cancelledReceiptValue)
        XCTAssertEqual(cancelledReceipt.pendingPhase, .confirming)
        XCTAssertEqual(cancelledReceipt.removalIntent, .calendar)

        // A transient detail failure must not drop the unresolved receipt.
        let transient = try snapshot(
            candidates: [],
            skipped: [
                SkippedScheduleEvent(
                    eventId: 501,
                    startDate: try date(start),
                    reason: .detailUnavailable
                ),
            ],
            readAt: "2026-06-01T15:00:00.000Z"
        )
        do {
            _ = try await reconciler.reconcile(
                transient,
                scope: scope,
                generation: 1
            )
            XCTFail("A transient skip must not hide an unresolved write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 501)
            )
        }
        let requestsAfterRetries = await store.scheduleRequests
        XCTAssertEqual(requestsAfterRetries.count, 1)

        // Explicit cleanup while hidden records durable cleanup intent.
        let hiddenCleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let hiddenReceiptValue = try await journal.receipt(
            scope: scope,
            eventID: 501
        )
        let hiddenReceipt = try XCTUnwrap(hiddenReceiptValue)
        XCTAssertEqual(hiddenCleanup.retainedEventIDs, [501])
        XCTAssertEqual(hiddenReceipt.pendingPhase, .confirming)
        XCTAssertEqual(hiddenReceipt.removalIntent, .cleanup)

        // Eventual visibility resolves the same receipt without a duplicate.
        await store.revealHiddenWorkouts()
        let visibleCleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let workoutsAfterCleanup = await store.workouts
        let requestsAfterCleanup = await store.scheduleRequests
        let receiptAfterCleanup = try await journal.receipt(
            scope: scope,
            eventID: 501
        )
        XCTAssertEqual(visibleCleanup.removedEventIDs, [501])
        XCTAssertTrue(workoutsAfterCleanup.isEmpty)
        XCTAssertEqual(requestsAfterCleanup.count, 1)
        XCTAssertNil(receiptAfterCleanup)
    }

    func testVisibleHiddenWriteConfirmsWithoutDuplicate() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(505, start: "2026-06-02T12:00:00.000Z")]
        )

        await store.acceptButHideNextWrite()
        do {
            _ = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: 1
            )
            XCTFail("Hidden write is unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 505)
            )
        }
        await store.revealHiddenWorkouts()

        let summary = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(scope: scope, eventID: 505)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(summary.confirmedEventIDs, [505])
        XCTAssertEqual(summary.scheduledEventIDs, [])
        XCTAssertEqual(requests.count, 1)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertNil(receipt.pendingOperation)
        XCTAssertNil(receipt.pendingPhase)
    }

    func testInvisibleWriteRecordsUnsupportedRemovalIntent() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let start = "2026-06-02T12:00:00.000Z"
        await store.acceptButHideNextWrite()
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [try candidate(502, start: start)]),
                scope: scope,
                generation: 1
            )
            XCTFail("Hidden write is unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 502)
            )
        }

        let cancelled = try snapshot(
            candidates: [],
            readAt: "2026-06-01T13:00:00.000Z"
        )
        do {
            _ = try await reconciler.reconcile(
                cancelled,
                scope: scope,
                generation: 1
            )
            XCTFail("Cancellation must not drop a hidden write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 502)
            )
        }

        let unsupported = try snapshot(
            candidates: [],
            skipped: [
                SkippedScheduleEvent(
                    eventId: 502,
                    startDate: try date(start),
                    reason: .unsupported(.unsupportedSport)
                ),
            ],
            readAt: "2026-06-01T14:00:00.000Z"
        )
        do {
            _ = try await reconciler.reconcile(
                unsupported,
                scope: scope,
                generation: 1
            )
            XCTFail("The hidden write still blocks the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 502)
            )
        }
        let pendingValue = try await journal.receipt(scope: scope, eventID: 502)
        let pending = try XCTUnwrap(pendingValue)
        XCTAssertEqual(pending.pendingOperation, .schedule)
        XCTAssertEqual(pending.pendingPhase, .confirming)
        XCTAssertEqual(pending.removalIntent, .calendar)

        await store.revealHiddenWorkouts()
        let removed = try await reconciler.reconcile(
            unsupported,
            scope: scope,
            generation: 1
        )
        let workouts = await store.workouts
        let receipt = try await journal.receipt(scope: scope, eventID: 502)
        XCTAssertEqual(removed.removedEventIDs, [502])
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertNil(receipt)
    }

    func testMixedCompletedAndIncompleteCopiesRetainReceiptUntilRemoved() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let planID = UUID()
        let start = try date("2026-06-02T12:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 503,
                planID: planID,
                scheduledDate: start,
                fingerprint: "mixed"
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: start,
                isComplete: true
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: start,
                isComplete: false
            )
        )

        let summary = try await reconciler.reconcile(
            try snapshot(candidates: [try candidate(503, start: "2026-06-02T12:00:00.000Z")]),
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        let receipt = try await journal.receipt(scope: scope, eventID: 503)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 503
        )
        XCTAssertEqual(summary.completedEventIDs, [503])
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(workouts.first?.isComplete, true)
        XCTAssertNil(receipt)
        XCTAssertNotNil(tombstone)
    }

    func testCompletionSurvivesAFailedRemovalAndLaterHistoryLoss() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let planID = UUID()
        let start = try date("2026-06-02T12:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 504,
                planID: planID,
                scheduledDate: start,
                fingerprint: "mixed"
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: start,
                isComplete: true
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: start,
                isComplete: false
            )
        )
        await store.failNextRemove()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: []),
                scope: scope,
                generation: 1
            )
            XCTFail("The failed removal must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let tombstoneAfterFailure = try await journal.completionTombstone(
            scope: scope,
            eventID: 504
        )
        let receiptAfterFailure = try await journal.receipt(
            scope: scope,
            eventID: 504
        )
        let workoutsAfterFailure = await store.workouts
        XCTAssertNotNil(tombstoneAfterFailure)
        XCTAssertNotNil(receiptAfterFailure)
        XCTAssertEqual(workoutsAfterFailure.count, 2)

        await store.forget(planID: planID)
        let schedulesBefore = await store.scheduleRequests.count
        let recurring = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(504, start: "2026-06-02T12:00:00.000Z")],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let schedulesAfter = await store.scheduleRequests.count
        let workoutsAfterLoss = await store.workouts
        let receiptAfterLoss = try await journal.receipt(
            scope: scope,
            eventID: 504
        )
        XCTAssertEqual(recurring.completedEventIDs, [504])
        XCTAssertEqual(schedulesAfter, schedulesBefore)
        XCTAssertTrue(workoutsAfterLoss.isEmpty)
        XCTAssertNil(receiptAfterLoss)
    }

    func testEpochPrecisionKeepsRepeatedFallBackInstantsDistinct() throws {
        var newYork = Calendar(identifier: .gregorian)
        newYork.timeZone = TimeZone(identifier: "America/New_York")!
        newYork.locale = Locale(identifier: "en_US_POSIX")

        // US fall-back on 2026-11-01: both instants are 01:30 local.
        let first = try date("2026-11-01T05:30:00.750Z")
        let second = try date("2026-11-01T06:30:00.750Z")
        XCTAssertEqual(
            ScheduleDate.normalized(first),
            try date("2026-11-01T05:30:00.000Z")
        )
        XCTAssertEqual(
            ScheduleDate.normalized(second),
            try date("2026-11-01T06:30:00.000Z")
        )
        XCTAssertNotEqual(
            ScheduleDate.normalized(first),
            ScheduleDate.normalized(second)
        )
    }

    func testHiddenCleanupForAccountABlocksBUntilVisible() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let aStart = "2026-06-02T12:00:00.000Z"

        await store.acceptButHideNextWrite()
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [try candidate(701, start: aStart)]),
                scope: scope,
                generation: 1
            )
            XCTFail("A hidden write is unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 701)
            )
        }
        let cleanupA = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        XCTAssertEqual(cleanupA.retainedEventIDs, [701])
        let aReceiptValue = try await journal.receipt(scope: scope, eventID: 701)
        let aReceipt = try XCTUnwrap(aReceiptValue)
        XCTAssertEqual(aReceipt.pendingPhase, .confirming)
        XCTAssertEqual(aReceipt.removalIntent, .cleanup)

        await reconciler.activate(generation: 2, for: otherScope)
        let bSnapshot = try snapshot(
            candidates: [try candidate(702, start: "2026-06-03T12:00:00.000Z")],
            scope: otherScope
        )
        do {
            _ = try await reconciler.reconcile(
                bSnapshot,
                scope: otherScope,
                generation: 2
            )
            XCTFail("Account B must wait for account A's unresolved cleanup")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 701)
            )
        }
        let requestsWhileBlocked = await store.scheduleRequests
        let aReceiptWhileBlockedValue = try await journal.receipt(scope: scope, eventID: 701)
        let aReceiptWhileBlocked = try XCTUnwrap(aReceiptWhileBlockedValue)
        XCTAssertEqual(requestsWhileBlocked.count, 1)
        XCTAssertEqual(aReceiptWhileBlocked.removalIntent, .cleanup)

        await store.revealHiddenWorkouts()
        _ = try await reconciler.reconcile(
            bSnapshot,
            scope: otherScope,
            generation: 2
        )

        let requestsAfter = await store.scheduleRequests
        let workoutsAfter = await store.workouts
        let aReceiptAfter = try await journal.receipt(
            scope: scope,
            eventID: 701
        )
        let bReceipt = try await journal.receipt(
            scope: otherScope,
            eventID: 702
        )
        XCTAssertEqual(requestsAfter.count, 2)
        XCTAssertEqual(workoutsAfter.count, 1)
        XCTAssertNil(aReceiptAfter)
        XCTAssertNotNil(bReceipt)
    }

    func testStaleSameUUIDDateCannotConfirmHiddenTarget() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let planID = UUID()
        let oldDate = try date("2026-06-02T12:00:00.000Z")
        let newDate = try date("2026-06-03T12:00:00.000Z")
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: oldDate,
                isComplete: false
            )
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 703,
                planID: planID,
                scheduledDate: newDate,
                fingerprint: "new",
                pendingOperation: .schedule,
                pendingPhase: .confirming,
                submittedDate: newDate
            )
        )

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [try candidate(703, start: "2026-06-03T12:00:00.000Z")]
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("A same-UUID old date is not proof of the new write")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 703)
            )
        }
        let afterReconcileValue = try await journal.receipt(scope: scope, eventID: 703)
        let afterReconcile = try XCTUnwrap(afterReconcileValue)
        XCTAssertEqual(afterReconcile.pendingPhase, .confirming)
        XCTAssertEqual(afterReconcile.submittedDate, newDate)

        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let afterCleanupValue = try await journal.receipt(scope: scope, eventID: 703)
        let afterCleanup = try XCTUnwrap(afterCleanupValue)
        XCTAssertEqual(cleanup.retainedEventIDs, [703])
        XCTAssertEqual(afterCleanup.pendingPhase, .confirming)

        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: newDate,
                isComplete: false
            )
        )
        let visibleCleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let workouts = await store.workouts
        let afterVisibleCleanup = try await journal.receipt(
            scope: scope,
            eventID: 703
        )
        XCTAssertEqual(visibleCleanup.removedEventIDs, [703])
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertNil(afterVisibleCleanup)
    }

    func testInvalidationDuringSubmissionJournalSaveSubmitsNothing() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        await journal.suspendNextConfirmingSave()
        let pass = Task {
            try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(801, start: "2026-06-02T12:00:00.000Z"),
                    ]
                ),
                scope: scope,
                generation: 1
            )
        }
        await journal.waitUntilSaveIsSuspended()
        let invalidation = Task {
            await reconciler.invalidate()
        }
        for _ in 0..<100 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                break
            }
            await Task.yield()
        }
        await journal.resumeSuspendedSave()

        do {
            _ = try await pass.value
            XCTFail("Fenced submission must not reach Apple")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .staleGeneration)
        }
        await invalidation.value

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(scope: scope, eventID: 801)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertTrue(requests.isEmpty)
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertEqual(receipt.pendingOperation, .schedule)
        XCTAssertEqual(receipt.pendingPhase, .writing)
        XCTAssertNil(receipt.submittedDate)
    }

    func testCompletionObservedDuringMixedRemovalPersistsBeforeRemainingGuard() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let scheduledSnapshot = try snapshot(
            candidates: [try candidate(901, start: "2026-06-02T12:00:00.000Z")]
        )

        _ = try await reconciler.reconcile(
            scheduledSnapshot,
            scope: scope,
            generation: 1
        )
        let receiptValue = try await journal.receipt(scope: scope, eventID: 901)
        let receipt = try XCTUnwrap(receiptValue)
        await store.completeAndLeaveIncompleteOnNextRemove()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: []),
                scope: scope,
                generation: 1
            )
            XCTFail("Remaining incomplete copies must fail the removal")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 901
        )
        let retainedReceipt = try await journal.receipt(
            scope: scope,
            eventID: 901
        )
        let workoutsAfterFailure = await store.workouts
        XCTAssertNotNil(tombstone)
        XCTAssertNotNil(retainedReceipt)
        XCTAssertEqual(workoutsAfterFailure.count, 2)

        await store.forget(planID: receipt.planID)
        let schedulesBefore = await store.scheduleRequests.count
        let recurring = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(901, start: "2026-06-02T12:00:00.000Z")],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let schedulesAfter = await store.scheduleRequests.count
        let workoutsAfterLoss = await store.workouts
        let receiptAfterLoss = try await journal.receipt(
            scope: scope,
            eventID: 901
        )
        XCTAssertEqual(recurring.completedEventIDs, [901])
        XCTAssertEqual(schedulesAfter, schedulesBefore)
        XCTAssertTrue(workoutsAfterLoss.isEmpty)
        XCTAssertNil(receiptAfterLoss)
    }

    func testVisibleDeferredCalendarRemovalHonorsTransientSkip() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let start = "2026-06-02T12:00:00.000Z"

        await store.acceptButHideNextWrite()
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [try candidate(1001, start: start)]),
                scope: scope,
                generation: 1
            )
            XCTFail("Hidden write is unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 1001)
            )
        }
        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [],
                    readAt: "2026-06-01T13:00:00.000Z"
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("Cancellation records a deferred removal")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 1001)
            )
        }
        await store.revealHiddenWorkouts()

        let transient = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                skipped: [
                    SkippedScheduleEvent(
                        eventId: 1001,
                        startDate: try date(start),
                        reason: .detailUnavailable
                    ),
                ],
                readAt: "2026-06-01T14:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let workoutsAfterTransient = await store.workouts
        let receiptAfterTransientValue = try await journal.receipt(scope: scope, eventID: 1001)
        let receiptAfterTransient = try XCTUnwrap(receiptAfterTransientValue)
        XCTAssertEqual(transient.retainedEventIDs, [1001])
        XCTAssertEqual(workoutsAfterTransient.count, 1)
        XCTAssertNil(receiptAfterTransient.pendingOperation)
        XCTAssertEqual(receiptAfterTransient.removalIntent, .calendar)

        let removed = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                readAt: "2026-06-01T15:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let workoutsAfterRemoval = await store.workouts
        let receiptAfterRemoval = try await journal.receipt(
            scope: scope,
            eventID: 1001
        )
        XCTAssertEqual(removed.removedEventIDs, [1001])
        XCTAssertTrue(workoutsAfterRemoval.isEmpty)
        XCTAssertNil(receiptAfterRemoval)
    }

    func testFractionalStartIsNormalizedForWriteAndReceipt() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let snapshot = try snapshot(
            candidates: [try candidate(241, start: "2026-06-02T12:00:00.500Z")]
        )

        _ = try await reconciler.reconcile(snapshot, scope: scope, generation: 1)
        let requests = await store.scheduleRequests
        let receiptValue = try await journal.receipt(scope: scope, eventID: 241)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(
            requests.first?.startDate,
            try date("2026-06-02T12:00:00.000Z")
        )
        XCTAssertEqual(
            receipt.scheduledDate,
            try date("2026-06-02T12:00:00.000Z")
        )

        let rerun = try await reconciler.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )
        let requestsAfter = await store.scheduleRequests
        XCTAssertEqual(rerun.unchangedEventIDs, [241])
        XCTAssertEqual(requestsAfter.count, 1)
    }

    // MARK: - Durability

    func testFileJournalKeepsReceiptsAcrossReconcilerInstances() async throws {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        defer {
            try? FileManager.default.removeItem(at: directory)
        }
        let fileURL = directory.appendingPathComponent("receipts.json")
        let store = FakeStore()
        let snapshot = try snapshot(
            candidates: [try candidate(161, start: "2026-06-02T12:00:00.000Z")]
        )

        let first = ScheduleReconciler(
            store: store,
            journal: FileScheduleJournal(fileURL: fileURL),
            calendar: calendar
        )
        await first.activate(generation: 1, for: scope)
        _ = try await first.reconcile(snapshot, scope: scope, generation: 1)

        let second = ScheduleReconciler(
            store: store,
            journal: FileScheduleJournal(fileURL: fileURL),
            calendar: calendar
        )
        await second.activate(generation: 1, for: scope)
        let summary = try await second.reconcile(
            snapshot,
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.unchangedEventIDs, [161])
        let durableWrites = await store.scheduleRequests
        let persisted = try await FileScheduleJournal(fileURL: fileURL)
            .receipt(scope: scope, eventID: 161)
        XCTAssertEqual(durableWrites.count, 1)
        XCTAssertNotNil(persisted)
    }
}

// MARK: - Test doubles

private enum FakeStoreError: Error {
    case readFailed
    case writeFailed
}

private actor FakeStore: ScheduleWorkoutStore {
    private var capacity: Int
    private(set) var workouts: [ScheduledWorkoutState] = []
    private(set) var scheduleRequests: [ScheduleWorkoutRequest] = []
    private(set) var removeRequests: [UUID] = []
    private var readFailures = 0
    private var scheduleFailure: ScheduleFailure = .none
    private var removeFailure = false
    private var scheduleStoreError: ScheduleStoreError?
    private var readStoreError: ScheduleStoreError?
    private var failReadsAfterNextSchedule = false
    private var cancelAfterNextWrite = false
    private var shouldCompleteInsteadOfNextRemove = false
    private var shouldCompleteAndLeaveIncompleteOnNextRemove = false
    private var shouldSuspendNextWrite = false
    private var shouldSuspendBeforeFence = false
    private var shouldSuspendRemoveBeforeFence = false
    private var shouldHideNextAcceptedWrite = false
    private var hiddenWorkouts: [ScheduledWorkoutState] = []
    private var writeIsSuspended = false
    private var resumeWaiters: [CheckedContinuation<Void, Never>] = []
    private var suspensionObservers: [CheckedContinuation<Void, Never>] = []
    private var log: OperationLog?

    private enum ScheduleFailure {
        case none
        case beforeWrite
        case afterWrite
    }

    init(
        capacity: Int = 50,
        workouts: [ScheduledWorkoutState] = []
    ) {
        self.capacity = capacity
        self.workouts = workouts
    }

    func use(log: OperationLog) {
        self.log = log
    }

    func maximumScheduledWorkoutCount() async -> Int {
        capacity
    }

    func scheduledWorkouts(calendar: Calendar) async throws -> [ScheduledWorkoutState] {
        if let error = readStoreError {
            readStoreError = nil
            throw error
        }
        if readFailures > 0 {
            readFailures -= 1
            throw FakeStoreError.readFailed
        }
        return workouts
    }

    func schedule(
        _ request: ScheduleWorkoutRequest,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        if shouldSuspendBeforeFence {
            shouldSuspendBeforeFence = false
            await suspendAtFence()
        }
        // Preflight failures happen before the native submission fence.
        if let error = scheduleStoreError {
            scheduleStoreError = nil
            throw error
        }
        if case .beforeWrite = scheduleFailure {
            scheduleFailure = .none
            throw ScheduleStoreError.planNotSubmitted
        }
        try await fence.prepareSubmission()
        if shouldSuspendNextWrite {
            shouldSuspendNextWrite = false
            await suspendAtFence()
        }
        scheduleRequests.append(request)
        await log?.append("store.schedule:\(request.eventID)")
        let state = ScheduledWorkoutState(
            planID: request.planID,
            startDate: request.startDate,
            isComplete: false
        )
        if shouldHideNextAcceptedWrite {
            shouldHideNextAcceptedWrite = false
            hiddenWorkouts.append(state)
        } else {
            workouts.append(state)
        }
        if failReadsAfterNextSchedule {
            failReadsAfterNextSchedule = false
            readFailures += 1
        }
        if cancelAfterNextWrite {
            cancelAfterNextWrite = false
            throw CancellationError()
        }
        if case .afterWrite = scheduleFailure {
            scheduleFailure = .none
            throw FakeStoreError.writeFailed
        }
    }

    func remove(
        planID: UUID,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        if shouldSuspendRemoveBeforeFence {
            shouldSuspendRemoveBeforeFence = false
            await suspendAtFence()
        }
        try await fence.check()
        removeRequests.append(planID)
        await log?.append("store.remove:\(planID)")
        if removeFailure {
            removeFailure = false
            throw FakeStoreError.writeFailed
        }
        if shouldCompleteInsteadOfNextRemove {
            shouldCompleteInsteadOfNextRemove = false
            workouts = workouts.map {
                guard $0.planID == planID else {
                    return $0
                }
                return ScheduledWorkoutState(
                    planID: $0.planID,
                    startDate: $0.startDate,
                    isComplete: true
                )
            }
            return
        }
        if shouldCompleteAndLeaveIncompleteOnNextRemove {
            shouldCompleteAndLeaveIncompleteOnNextRemove = false
            let dated = workouts.first { $0.planID == planID }
                ?? ScheduledWorkoutState(
                    planID: planID,
                    startDate: Date(),
                    isComplete: false
                )
            workouts.removeAll { $0.planID == planID }
            workouts.append(
                ScheduledWorkoutState(
                    planID: planID,
                    startDate: dated.startDate,
                    isComplete: true
                )
            )
            workouts.append(
                ScheduledWorkoutState(
                    planID: planID,
                    startDate: dated.startDate,
                    isComplete: false
                )
            )
            return
        }
        workouts.removeAll { $0.planID == planID && !$0.isComplete }
    }

    private func suspendAtFence() async {
        writeIsSuspended = true
        let observers = suspensionObservers
        suspensionObservers.removeAll()
        for observer in observers {
            observer.resume()
        }
        await withCheckedContinuation { continuation in
            resumeWaiters.append(continuation)
        }
    }

    func seed(_ workout: ScheduledWorkoutState) {
        workouts.append(workout)
    }

    func setCapacity(_ capacity: Int) {
        self.capacity = capacity
    }

    func failNextRead() {
        readFailures += 1
    }

    func failNextScheduleBeforeWrite() {
        scheduleFailure = .beforeWrite
    }

    func failNextScheduleAfterWrite() {
        scheduleFailure = .afterWrite
    }

    func failNextRemove() {
        removeFailure = true
    }

    func failNextRead(with error: ScheduleStoreError) {
        readStoreError = error
    }

    func failNextSchedule(with error: ScheduleStoreError) {
        scheduleStoreError = error
    }

    func failNextReadAfterSchedule() {
        failReadsAfterNextSchedule = true
    }

    func acceptButHideNextWrite() {
        shouldHideNextAcceptedWrite = true
    }

    func revealHiddenWorkouts() {
        workouts.append(contentsOf: hiddenWorkouts)
        hiddenWorkouts.removeAll()
    }

    func hiddenWorkoutCount() -> Int {
        hiddenWorkouts.count
    }

    func suspendBeforeFence() {
        shouldSuspendBeforeFence = true
    }

    func suspendRemoveBeforeFence() {
        shouldSuspendRemoveBeforeFence = true
    }

    func cancelNextWriteAfterItLands() {
        cancelAfterNextWrite = true
    }

    func completeInsteadOfNextRemove() {
        shouldCompleteInsteadOfNextRemove = true
    }

    func completeAndLeaveIncompleteOnNextRemove() {
        shouldCompleteAndLeaveIncompleteOnNextRemove = true
    }

    func suspendNextWrite() {
        shouldSuspendNextWrite = true
    }

    func waitUntilWriteIsSuspended() async {
        if writeIsSuspended {
            return
        }
        await withCheckedContinuation { continuation in
            suspensionObservers.append(continuation)
        }
    }

    func resumeSuspendedWrite() {
        writeIsSuspended = false
        let waiters = resumeWaiters
        resumeWaiters.removeAll()
        for waiter in waiters {
            waiter.resume()
        }
    }

    func forget(planID: UUID) {
        workouts.removeAll { $0.planID == planID }
    }

    func markComplete(planID: UUID) {
        workouts = workouts.map {
            guard $0.planID == planID else {
                return $0
            }
            return ScheduledWorkoutState(
                planID: $0.planID,
                startDate: $0.startDate,
                isComplete: true
            )
        }
    }
}

private actor FakeJournal: ScheduleJournal {
    private var storage: [AccountScope: [Int: ScheduleReceipt]] = [:]
    private var tombstones: [AccountScope: [Int: ScheduleCompletionTombstone]] = [:]
    private(set) var savedSnapshots: [ScheduleReceipt] = []
    private var suspendConfirmingSave = false
    private var saveIsSuspended = false
    private var saveResumeWaiters: [CheckedContinuation<Void, Never>] = []
    private var saveSuspensionObservers: [CheckedContinuation<Void, Never>] = []
    private var log: OperationLog?

    func use(log: OperationLog) {
        self.log = log
    }

    func allReceipts() async throws -> [ScheduleReceipt] {
        storage.values
            .flatMap(\.values)
            .sorted {
                if $0.scope != $1.scope {
                    return $0.scope.athleteId < $1.scope.athleteId
                }
                return $0.eventID < $1.eventID
            }
    }

    func receipts(for scope: AccountScope) async throws -> [ScheduleReceipt] {
        (storage[scope]?.values).map { Array($0) }?.sorted {
            $0.eventID < $1.eventID
        } ?? []
    }

    func receipt(
        scope: AccountScope,
        eventID: Int
    ) async throws -> ScheduleReceipt? {
        storage[scope]?[eventID]
    }

    func save(_ receipt: ScheduleReceipt) async throws {
        if suspendConfirmingSave && receipt.pendingPhase == .confirming {
            suspendConfirmingSave = false
            saveIsSuspended = true
            let observers = saveSuspensionObservers
            saveSuspensionObservers.removeAll()
            for observer in observers {
                observer.resume()
            }
            await withCheckedContinuation { continuation in
                saveResumeWaiters.append(continuation)
            }
        }
        storage[receipt.scope, default: [:]][receipt.eventID] = receipt
        savedSnapshots.append(receipt)
        await log?.append("journal.save:\(receipt.eventID)")
    }

    func suspendNextConfirmingSave() {
        suspendConfirmingSave = true
    }

    func waitUntilSaveIsSuspended() async {
        if saveIsSuspended {
            return
        }
        await withCheckedContinuation { continuation in
            saveSuspensionObservers.append(continuation)
        }
    }

    func resumeSuspendedSave() {
        saveIsSuspended = false
        let waiters = saveResumeWaiters
        saveResumeWaiters.removeAll()
        for waiter in waiters {
            waiter.resume()
        }
    }

    func delete(scope: AccountScope, eventID: Int) async throws {
        storage[scope]?[eventID] = nil
        await log?.append("journal.delete:\(eventID)")
    }

    func completionTombstones(
        for scope: AccountScope
    ) async throws -> [ScheduleCompletionTombstone] {
        (tombstones[scope]?.values).map { Array($0) }?.sorted {
            $0.eventID < $1.eventID
        } ?? []
    }

    func completionTombstone(
        scope: AccountScope,
        eventID: Int
    ) async throws -> ScheduleCompletionTombstone? {
        tombstones[scope]?[eventID]
    }

    func saveCompletionTombstone(
        _ tombstone: ScheduleCompletionTombstone
    ) async throws {
        tombstones[tombstone.scope, default: [:]][tombstone.eventID] =
            tombstone
    }
}

private actor OperationLog {
    private(set) var entries: [String] = []

    func append(_ entry: String) {
        entries.append(entry)
    }
}
