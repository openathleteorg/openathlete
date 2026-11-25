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
        owned: [Int]? = nil
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
            scope: scope,
            window: DateInterval(
                start: try date("2026-06-01T04:00:00.000Z"),
                end: try date("2026-06-09T04:00:00.000Z")
            ),
            readAt: try date("2026-06-01T12:00:00.000Z"),
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

        let failed = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(51, start: "2026-06-05T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(failed.failedEventIDs, [51])
        let workoutsAfterFailure = await store.workouts
        XCTAssertEqual(workoutsAfterFailure.count, 0)
        let pendingValue = try await journal.receipt(scope: scope, eventID: 51)
        let pending = try XCTUnwrap(pendingValue)
        XCTAssertEqual(pending.pendingOperation, .replace)
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

        let interrupted = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(52, start: "2026-06-06T12:00:00.000Z")]
            ),
            scope: scope,
            generation: 1
        )
        XCTAssertEqual(interrupted.failedEventIDs, [52])
        let interruptedWorkouts = await store.workouts
        XCTAssertEqual(interruptedWorkouts.count, 1)

        let relaunched = await makeReconciler(store: store, journal: journal)
        _ = try await relaunched.reconcile(
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
        XCTAssertEqual(deduplicatedCount, 1)
        let receiptValue = try await journal.receipt(scope: scope, eventID: 52)
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertNil(receipt.pendingOperation)
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
        XCTAssertEqual(writes.count, 1)
        XCTAssertEqual(workouts.count, 0)
        XCTAssertEqual(firstReceipt?.pendingOperation, .schedule)
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
                pendingPreviousDate: nil
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
                pendingOperation: .remove
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
        calendar: Calendar
    ) async throws {
        scheduleRequests.append(request)
        await log?.append("store.schedule:\(request.eventID)")
        if let error = scheduleStoreError {
            scheduleStoreError = nil
            throw error
        }
        if case .beforeWrite = scheduleFailure {
            scheduleFailure = .none
            throw FakeStoreError.writeFailed
        }
        workouts.append(
            ScheduledWorkoutState(
                planID: request.planID,
                startDate: request.startDate,
                isComplete: false
            )
        )
        if case .afterWrite = scheduleFailure {
            scheduleFailure = .none
            throw FakeStoreError.writeFailed
        }
    }

    func remove(planID: UUID, calendar: Calendar) async throws {
        removeRequests.append(planID)
        await log?.append("store.remove:\(planID)")
        if removeFailure {
            removeFailure = false
            throw FakeStoreError.writeFailed
        }
        workouts.removeAll { $0.planID == planID && !$0.isComplete }
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
    private(set) var savedSnapshots: [ScheduleReceipt] = []
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
        storage[receipt.scope, default: [:]][receipt.eventID] = receipt
        savedSnapshots.append(receipt)
        await log?.append("journal.save:\(receipt.eventID)")
    }

    func delete(scope: AccountScope, eventID: Int) async throws {
        storage[scope]?[eventID] = nil
        await log?.append("journal.delete:\(eventID)")
    }
}

private actor OperationLog {
    private(set) var entries: [String] = []

    func append(_ entry: String) {
        entries.append(entry)
    }
}
