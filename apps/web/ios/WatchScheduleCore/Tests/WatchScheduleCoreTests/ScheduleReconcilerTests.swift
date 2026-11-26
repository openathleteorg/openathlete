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
        zoneId: Int = 42,
        sport: PlanSport = .running
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
            sport: sport,
            location: sport == .swimming ? .pool : .unspecified,
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
        windowStart: String = "2026-06-01T04:00:00.000Z",
        windowEnd: String = "2026-06-09T04:00:00.000Z",
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
                start: try date(windowStart),
                end: try date(windowEnd)
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
        var fenced = false
        for _ in 0..<200 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                fenced = true
                break
            }
            try await Task.sleep(nanoseconds: 1_000_000)
        }
        XCTAssertTrue(fenced, "invalidation must fence before the write resumes")
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
        var fenced = false
        for _ in 0..<200 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                fenced = true
                break
            }
            try await Task.sleep(nanoseconds: 1_000_000)
        }
        XCTAssertTrue(fenced, "invalidation must fence before the write resumes")
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
        var fenced = false
        for _ in 0..<200 {
            if await reconciler.isActive(generation: 1, for: scope) == false {
                fenced = true
                break
            }
            try await Task.sleep(nanoseconds: 1_000_000)
        }
        XCTAssertTrue(fenced, "invalidation must fence before the write resumes")
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

    func testRepeatedFallBackHourIsRejectedBeforeNativeSubmission() async throws {
        var newYork = Calendar(identifier: .gregorian)
        newYork.timeZone = TimeZone(identifier: "America/New_York")!
        newYork.locale = Locale(identifier: "en_US_POSIX")

        // Both 05:30Z and 06:30Z render as 01:30 on the fall-back day. Native
        // DateComponents cannot say which instant is meant.
        XCTAssertFalse(
            ScheduleDate.isUnambiguous(
                try date("2026-11-01T05:30:00.000Z"),
                calendar: newYork
            )
        )
        XCTAssertFalse(
            ScheduleDate.isUnambiguous(
                try date("2026-11-01T06:30:00.000Z"),
                calendar: newYork
            )
        )
        let summer = try date("2026-06-02T12:00:00.000Z")
        XCTAssertTrue(ScheduleDate.isUnambiguous(summer, calendar: newYork))
        let components = try ScheduleDate.components(
            for: summer,
            calendar: newYork
        )
        XCTAssertEqual(components.hour, 8)
        XCTAssertEqual(components.timeZone, newYork.timeZone)
        XCTAssertEqual(
            newYork.date(from: components),
            ScheduleDate.normalized(summer)
        )

        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(851, start: "2026-11-01T05:30:00.000Z"),
                ],
                readAt: "2026-11-01T00:00:00.000Z",
                windowStart: "2026-10-31T04:00:00.000Z",
                windowEnd: "2026-11-08T04:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let requests = await store.scheduleRequests
        XCTAssertTrue(requests.isEmpty)
        XCTAssertEqual(
            summary.skipped.map(\.reason),
            [.ambiguousLocalTime]
        )
    }

    func testEveryPassReadsAFreshCalendar() async throws {
        let box = MutableCalendarBox(calendar: calendar)
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = ScheduleReconciler(
            store: store,
            journal: journal,
            calendarProvider: { box.calendar }
        )
        await reconciler.activate(generation: 1, for: scope)

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(861, start: "2026-06-02T12:00:00.000Z"),
            ]),
            scope: scope,
            generation: 1
        )
        // A time-zone change while the app stays alive must be used by the
        // next pass, not the calendar captured at runtime creation.
        var paris = Calendar(identifier: .gregorian)
        paris.timeZone = TimeZone(identifier: "Europe/Paris")!
        paris.locale = Locale(identifier: "en_US_POSIX")
        box.calendar = paris
        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(861, start: "2026-06-02T12:00:00.000Z"),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let used = await store.calendarsUsed
        XCTAssertTrue(used.contains("America/New_York"))
        XCTAssertTrue(used.contains("Europe/Paris"))
    }

    func testPoolGateAndNativeGoalAlertFailuresSkipOnlyTheirEvents() async throws {
        let store = FakeStore()
        await store.setUnsupportedPreflight(
            .swimming,
            reason: .poolSwimmingUnverified
        )
        await store.setUnsupportedPreflight(
            .cycling,
            reason: .nativeAlertUnsupported
        )
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(
                    871,
                    start: "2026-06-02T09:00:00.000Z",
                    sport: .swimming
                ),
                try candidate(
                    872,
                    start: "2026-06-02T10:00:00.000Z",
                    sport: .cycling
                ),
                try candidate(
                    873,
                    start: "2026-06-02T11:00:00.000Z",
                    sport: .running
                ),
            ]),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.scheduledEventIDs, [873])
        XCTAssertEqual(
            summary.skipped.map(\.eventId),
            [871, 872]
        )
        XCTAssertEqual(
            summary.skipped.map(\.reason),
            [
                .unsupported(.poolSwimmingUnverified),
                .unsupported(.nativeAlertUnsupported),
            ]
        )
        let requests = await store.scheduleRequests
        XCTAssertEqual(requests.map(\.eventID), [873])
    }

    func testCompletedAndIncompleteCopyRetainsCleanupOwnership()
        async throws
    {
        let planID = UUID()
        let start = try date("2026-06-02T12:00:00.000Z")
        let store = FakeStore(
            workouts: [
                ScheduledWorkoutState(
                    planID: planID,
                    startDate: start,
                    isComplete: true
                ),
                ScheduledWorkoutState(
                    planID: planID,
                    startDate: start,
                    isComplete: false
                ),
            ]
        )
        await store.completeAndLeaveIncompleteOnNextRemove()
        let journal = FakeJournal()
        // The receipt survived even though Apple shows both copies. Ownership
        // is what lets this pass remove the incomplete sibling.
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 881,
                planID: planID,
                scheduledDate: start,
                fingerprint: "prescription"
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        // The event receipt was lost, but Apple still shows a completed copy
        // and an incomplete sibling with the same UUID.
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [
                    try candidate(881, start: "2026-06-02T12:00:00.000Z"),
                ]),
                scope: scope,
                generation: 1
            )
            XCTFail("The incomplete sibling is not confirmed gone")
        } catch let error as ScheduleReconcileError {
            guard case .storeUnavailable = error else {
                return XCTFail("Unexpected error: \(error)")
            }
        }

        let retainedValue = try await journal.receipt(
            scope: scope,
            eventID: 881
        )
        let retained = try XCTUnwrap(retainedValue)
        XCTAssertEqual(retained.planID, planID)
        XCTAssertEqual(retained.pendingOperation, .remove)
    }

    func testNearestEligibleDisplacesOnlyAFartherConfirmedIncompleteEntry()
        async throws
    {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(891, start: "2026-06-03T12:00:00.000Z"),
            ]),
            scope: scope,
            generation: 1
        )
        let scheduledAfterFirst = await store.scheduleRequests
        XCTAssertEqual(scheduledAfterFirst.map(\.eventID), [891])

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(890, start: "2026-06-02T12:00:00.000Z"),
                    try candidate(891, start: "2026-06-03T12:00:00.000Z"),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        XCTAssertEqual(requests.map(\.eventID), [891, 890])
        XCTAssertEqual(
            workouts.map(\.startDate),
            [try date("2026-06-02T12:00:00.000Z")]
        )
        XCTAssertEqual(summary.scheduledEventIDs, [890])
        XCTAssertEqual(summary.removedEventIDs, [891])
        XCTAssertEqual(summary.overflowEventIDs, [891])
    }

    func testUnsupportedPreflightEditAtCapacityFreesRoomForALaterRun()
        async throws
    {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let obsoleteStart = "2026-06-02T12:00:00.000Z"

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(1201, start: obsoleteStart, sport: .cycling),
            ]),
            scope: scope,
            generation: 1
        )
        let obsoleteValue = try await journal.receipt(
            scope: scope,
            eventID: 1201
        )
        let obsolete = try XCTUnwrap(obsoleteValue)
        await store.setUnsupportedPreflight(
            .cycling,
            reason: .nativeAlertUnsupported
        )

        // The ride is still a snapshot candidate, but this device can no
        // longer take it. Its confirmed entry is obsolete and must not hold
        // the only capacity slot against the later valid run.
        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        1201,
                        start: obsoleteStart,
                        sport: .cycling
                    ),
                    try candidate(
                        1202,
                        start: "2026-06-03T12:00:00.000Z"
                    ),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.removedEventIDs, [1201])
        XCTAssertEqual(summary.scheduledEventIDs, [1202])
        XCTAssertEqual(summary.overflowEventIDs, [])
        XCTAssertEqual(
            summary.skipped.map(\.reason),
            [.unsupported(.nativeAlertUnsupported)]
        )
        let workouts = await store.workouts
        let obsoleteAfter = try await journal.receipt(
            scope: scope,
            eventID: 1201
        )
        let runReceipt = try await journal.receipt(
            scope: scope,
            eventID: 1202
        )
        XCTAssertEqual(workouts.count, 1)
        XCTAssertNotEqual(workouts.first?.planID, obsolete.planID)
        XCTAssertNil(obsoleteAfter)
        XCTAssertNotNil(runReceipt)
    }

    func testParisPassUsesParisForRemovalDespiteNewYorkStartup()
        async throws
    {
        let box = MutableCalendarBox(calendar: calendar)
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = ScheduleReconciler(
            store: store,
            journal: journal,
            calendarProvider: { box.calendar }
        )
        await reconciler.activate(generation: 1, for: scope)
        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(1211, start: "2026-06-02T12:00:00.000Z"),
            ]),
            scope: scope,
            generation: 1,
            calendar: calendar
        )

        var paris = Calendar(identifier: .gregorian)
        paris.timeZone = TimeZone(identifier: "Europe/Paris")!
        paris.locale = Locale(identifier: "en_US_POSIX")
        let readsBefore = await store.calendarsUsed.count

        // The provider still says New York; the pass's explicit calendar must
        // be the one used by the removal and its read-back.
        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1,
            calendar: paris
        )

        let readsDuringRemoval = Array(
            await store.calendarsUsed.dropFirst(readsBefore)
        )
        let removalCalendars = await store.removalCalendarsUsed
        XCTAssertEqual(Set(readsDuringRemoval), ["Europe/Paris"])
        XCTAssertEqual(removalCalendars, ["Europe/Paris"])
    }

    func testImmediatePostSubmitMixedCopiesRetainOwnershipUntilEvicted()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        await store.completeAndLeaveIncompleteOnNextWrite()
        await store.completeAndLeaveIncompleteOnNextRemove()
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [
                    try candidate(
                        1301,
                        start: "2026-06-02T12:00:00.000Z"
                    ),
                    try candidate(
                        1302,
                        start: "2026-06-03T12:00:00.000Z"
                    ),
                ]),
                scope: scope,
                generation: 1
            )
            XCTFail("An unconfirmed eviction must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 1301
        )
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(requests.map(\.eventID), [1301])
        XCTAssertEqual(receipt.planID, requests.first?.planID)
        XCTAssertEqual(receipt.pendingOperation, .remove)
        XCTAssertEqual(
            workouts.filter { $0.planID == receipt.planID }.count,
            2
        )
        XCTAssertFalse(requests.contains { $0.eventID == 1302 })
    }

    func testReplacementMixedCopiesRetainOwnershipAndStopBeforeWriting()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let oldStart = "2026-06-02T12:00:00.000Z"

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(1311, start: oldStart),
            ]),
            scope: scope,
            generation: 1
        )
        let originalValue = try await journal.receipt(
            scope: scope,
            eventID: 1311
        )
        let original = try XCTUnwrap(originalValue)
        let requestsBefore = await store.scheduleRequests.count
        await store.completeAndLeaveIncompleteOnNextRemove()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(
                            1311,
                            start: "2026-06-04T12:00:00.000Z",
                            power: 250...280
                        ),
                    ],
                    readAt: "2026-06-01T13:00:00.000Z"
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("An unconfirmed replacement eviction must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 1311
        )
        let receipt = try XCTUnwrap(receiptValue)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 1311
        )
        XCTAssertEqual(requests.count, requestsBefore)
        XCTAssertEqual(receipt.planID, original.planID)
        XCTAssertEqual(receipt.pendingOperation, .replace)
        XCTAssertEqual(receipt.pendingPhase, .removing)
        XCTAssertEqual(
            workouts.filter { $0.planID == original.planID }.count,
            2
        )
        XCTAssertNotNil(tombstone)
    }

    func testWrongDateVictimIsNotDisplacedAtCapacity() async throws {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let victimStart = "2026-06-03T12:00:00.000Z"

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(1401, start: victimStart),
            ]),
            scope: scope,
            generation: 1
        )
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 1401
        )
        let receipt = try XCTUnwrap(receiptValue)
        let wrongDate = try date("2026-06-04T12:00:00.000Z")
        await store.forget(planID: receipt.planID)
        await store.seed(
            ScheduledWorkoutState(
                planID: receipt.planID,
                startDate: wrongDate,
                isComplete: false
            )
        )

        // The same UUID is present, but at a different Apple date than the
        // confirmed receipt. It is not proof of a displaceable entry.
        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        1400,
                        start: "2026-06-02T12:00:00.000Z"
                    ),
                    try candidate(1401, start: victimStart),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        XCTAssertEqual(summary.overflowEventIDs, [1400])
        XCTAssertFalse(summary.removedEventIDs.contains(1401))
        XCTAssertEqual(summary.replacedEventIDs, [1401])
        let workouts = await store.workouts
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(
            workouts.first?.startDate,
            try date(victimStart)
        )
    }

    func testFailedEvictionReadBackStopsSubsequentMutations() async throws {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)

        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(1602, start: "2026-06-03T12:00:00.000Z"),
            ]),
            scope: scope,
            generation: 1
        )
        let requestsBefore = await store.scheduleRequests.map(\.eventID)
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 1602
        )
        let receipt = try XCTUnwrap(receiptValue)
        await store.failNextReadAfterRemove()

        do {
            _ = try await reconciler.reconcile(
                try snapshot(
                    candidates: [
                        try candidate(
                            1600,
                            start: "2026-06-02T12:00:00.000Z"
                        ),
                        try candidate(
                            1602,
                            start: "2026-06-03T12:00:00.000Z"
                        ),
                        try candidate(
                            1603,
                            start: "2026-06-04T12:00:00.000Z"
                        ),
                    ],
                    readAt: "2026-06-01T13:00:00.000Z"
                ),
                scope: scope,
                generation: 1
            )
            XCTFail("A failed eviction read-back must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let requestsAfter = await store.scheduleRequests.map(\.eventID)
        let workouts = await store.workouts
        let retainedValue = try await journal.receipt(
            scope: scope,
            eventID: 1602
        )
        let retained = try XCTUnwrap(retainedValue)
        XCTAssertEqual(requestsAfter, requestsBefore)
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertEqual(retained.pendingOperation, .remove)
        XCTAssertEqual(retained.planID, receipt.planID)
    }

    func testCapacityEvictionTargetsOnlyTheSelectedDateAndReplaysIt()
        async throws
    {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let planID = UUID()
        let targetStart = try date("2026-06-03T12:00:00.000Z")
        let wrongStart = try date("2026-06-04T12:00:00.000Z")
        let victim = try candidate(1801, start: "2026-06-03T12:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1801,
                planID: planID,
                scheduledDate: targetStart,
                fingerprint: PrescriptionFingerprint.make(victim.plan)
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: targetStart,
                isComplete: false
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: wrongStart,
                isComplete: false
            )
        )
        await store.failNextReadAfterRemove()
        let reconciler = await makeReconciler(store: store, journal: journal)

        // The victim has the same UUID at two dates. The capacity eviction
        // selects the target date; its interrupted read-back leaves a durable
        // date-scoped intent.
        let firstSnapshot = try snapshot(
            candidates: [
                try candidate(1800, start: "2026-06-02T12:00:00.000Z"),
                victim,
            ],
            readAt: "2026-06-01T12:00:00.000Z"
        )
        do {
            _ = try await reconciler.reconcile(
                firstSnapshot,
                scope: scope,
                generation: 1
            )
            XCTFail("A failed eviction read-back must stop the pass")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let firstWorkouts = await store.workouts
        let pendingValue = try await journal.receipt(
            scope: scope,
            eventID: 1801
        )
        let pending = try XCTUnwrap(pendingValue)
        let targets = await store.removalTargets
        XCTAssertEqual(firstWorkouts.map(\.startDate), [wrongStart])
        XCTAssertEqual(pending.pendingOperation, .remove)
        XCTAssertEqual(pending.removalTargetDate, targetStart)
        XCTAssertEqual(targets.compactMap { $0 }, [targetStart])

        // Replay the durable intent: the already-removed target is not removed
        // again, and the wrong-date sibling is never sent to the adapter.
        let removeCount = await store.removeRequests.count
        let retry = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        1800,
                        start: "2026-06-02T12:00:00.000Z"
                    ),
                    victim,
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )

        let retryWorkouts = await store.workouts
        let removeCountAfter = await store.removeRequests.count
        let schedulesAfter = await store.scheduleRequests.count
        let receiptAfter = try await journal.receipt(
            scope: scope,
            eventID: 1801
        )
        XCTAssertEqual(retryWorkouts.map(\.startDate), [wrongStart])
        XCTAssertEqual(removeCountAfter, removeCount)
        XCTAssertEqual(schedulesAfter, 0)
        XCTAssertEqual(receiptAfter?.pendingOperation, .remove)
        XCTAssertEqual(receiptAfter?.removalIntent, .cleanupOnly)
        XCTAssertNil(receiptAfter?.removalTargetDate)
        XCTAssertEqual(retry.overflowEventIDs, [1800])

        // The retained UUID receipt is what lets an explicit account cleanup
        // remove the remaining wrong-date sibling.
        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let cleanupWorkouts = await store.workouts
        let receiptAfterCleanup = try await journal.receipt(
            scope: scope,
            eventID: 1801
        )
        let cleanupTargets = await store.removalTargets
        XCTAssertEqual(cleanup.removedEventIDs, [1801])
        XCTAssertTrue(cleanupWorkouts.isEmpty)
        XCTAssertNil(receiptAfterCleanup)
        XCTAssertEqual(cleanupTargets.count, 2)
        if cleanupTargets.count == 2 {
            XCTAssertEqual(cleanupTargets[0], targetStart)
            XCTAssertNil(cleanupTargets[1])
        }
    }

    func testSuccessfulDateScopedEvictionRetainsUUIDForExplicitCleanup()
        async throws
    {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let planID = UUID()
        let targetStart = try date("2026-06-03T12:00:00.000Z")
        let wrongStart = try date("2026-06-04T12:00:00.000Z")
        let victim = try candidate(1802, start: "2026-06-03T12:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1802,
                planID: planID,
                scheduledDate: targetStart,
                fingerprint: PrescriptionFingerprint.make(victim.plan)
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: targetStart,
                isComplete: false
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: wrongStart,
                isComplete: false
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        1803,
                        start: "2026-06-02T12:00:00.000Z"
                    ),
                    victim,
                ]
            ),
            scope: scope,
            generation: 1
        )

        // The selected target is evicted, but the sibling keeps the UUID
        // receipt alive. It is not capacity-eligible, so the nearer session
        // overflows rather than displacing it.
        let workouts = await store.workouts
        let retainedValue = try await journal.receipt(
            scope: scope,
            eventID: 1802
        )
        let retained = try XCTUnwrap(retainedValue)
        let targets = await store.removalTargets
        XCTAssertEqual(summary.removedEventIDs, [1802])
        XCTAssertEqual(summary.scheduledEventIDs, [])
        XCTAssertEqual(summary.overflowEventIDs, [1803])
        XCTAssertEqual(workouts.map(\.startDate), [wrongStart])
        XCTAssertEqual(retained.pendingOperation, .remove)
        XCTAssertEqual(retained.removalIntent, .cleanupOnly)
        XCTAssertNil(retained.removalTargetDate)
        XCTAssertEqual(targets, [targetStart])

        // Even if the old target date reappears without capacity pressure, the
        // cleanup-only receipt must not replay an ordinary removal.
        await store.setCapacity(5)
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: targetStart,
                isComplete: false
            )
        )
        let removeCountBeforeReappearance = await store.removeRequests.count
        let schedulesBeforeReappearance = await store.scheduleRequests.count
        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [victim],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let reappeared = await store.workouts
        let removeCountAfterReappearance = await store.removeRequests.count
        let schedulesAfterReappearance = await store.scheduleRequests.count
        let retainedAfterReappearance = try await journal.receipt(
            scope: scope,
            eventID: 1802
        )
        XCTAssertEqual(
            Set(reappeared.map(\.startDate)),
            Set([targetStart, wrongStart])
        )
        XCTAssertEqual(
            removeCountAfterReappearance,
            removeCountBeforeReappearance
        )
        XCTAssertEqual(
            schedulesAfterReappearance,
            schedulesBeforeReappearance
        )
        XCTAssertEqual(
            retainedAfterReappearance?.removalIntent,
            .cleanupOnly
        )

        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )
        let afterCleanup = await store.workouts
        XCTAssertEqual(cleanup.removedEventIDs, [1802])
        XCTAssertTrue(afterCleanup.isEmpty)

        let later = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(
                        1803,
                        start: "2026-06-02T12:00:00.000Z"
                    ),
                ],
                readAt: "2026-06-01T14:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        XCTAssertEqual(later.scheduledEventIDs, [1803])
    }

    func testScopedReplayRecordsCompletionAtAnotherDateAndNeverReschedules()
        async throws
    {
        let store = FakeStore(capacity: 1)
        let journal = FakeJournal()
        let planID = UUID()
        let targetStart = try date("2026-06-03T12:00:00.000Z")
        let completedStart = try date("2026-06-04T12:00:00.000Z")
        let candidateValue = try candidate(
            1902,
            start: "2026-06-03T12:00:00.000Z"
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1902,
                planID: planID,
                scheduledDate: targetStart,
                fingerprint: PrescriptionFingerprint.make(candidateValue.plan),
                pendingOperation: .remove,
                removalIntent: .calendar,
                removalTargetDate: targetStart
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: completedStart,
                isComplete: true
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(candidates: [candidateValue]),
            scope: scope,
            generation: 1
        )

        let receipt = try await journal.receipt(scope: scope, eventID: 1902)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 1902
        )
        let workouts = await store.workouts
        XCTAssertEqual(summary.completedEventIDs, [1902])
        XCTAssertNil(receipt)
        XCTAssertNotNil(tombstone)
        XCTAssertEqual(workouts.map(\.startDate), [completedStart])

        // Even if Apple later loses that completed history, the durable
        // tombstone prevents the event from being scheduled again.
        await store.forget(planID: planID)
        let later = try await reconciler.reconcile(
            try snapshot(
                candidates: [candidateValue],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let schedules = await store.scheduleRequests.count
        XCTAssertEqual(later.completedEventIDs, [1902])
        XCTAssertEqual(schedules, 0)
    }

    func testScopedConfirmationRecordsCompletionSeenOnlyInRemovalReadBack()
        async throws
    {
        let store = FakeStore(capacity: 2)
        let journal = FakeJournal()
        let planID = UUID()
        let targetStart = try date("2026-06-03T12:00:00.000Z")
        let siblingStart = try date("2026-06-04T12:00:00.000Z")
        let candidateValue = try candidate(
            1903,
            start: "2026-06-03T12:00:00.000Z"
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1903,
                planID: planID,
                scheduledDate: targetStart,
                fingerprint: PrescriptionFingerprint.make(candidateValue.plan),
                pendingOperation: .remove,
                removalIntent: .calendar,
                removalTargetDate: targetStart
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: targetStart,
                isComplete: false
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: siblingStart,
                isComplete: false
            )
        )
        await store.completeSiblingsAfterNextRemove()
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(candidates: [candidateValue]),
            scope: scope,
            generation: 1
        )

        let receipt = try await journal.receipt(scope: scope, eventID: 1903)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 1903
        )
        let schedules = await store.scheduleRequests.count
        let workouts = await store.workouts
        XCTAssertEqual(summary.completedEventIDs, [1903])
        XCTAssertNil(receipt)
        XCTAssertNotNil(tombstone)
        XCTAssertEqual(schedules, 0)
        XCTAssertEqual(workouts.map(\.startDate), [siblingStart])

        await store.forget(planID: planID)
        let later = try await reconciler.reconcile(
            try snapshot(
                candidates: [candidateValue],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let schedulesAfter = await store.scheduleRequests.count
        XCTAssertEqual(later.completedEventIDs, [1903])
        XCTAssertEqual(schedulesAfter, 0)
    }

    func testPendingScopedReplayCombinesPreRemoveCompletionWhenReadBackLosesIt()
        async throws
    {
        let store = FakeStore(capacity: 2)
        let journal = FakeJournal()
        let planID = UUID()
        let targetStart = try date("2026-06-03T12:00:00.000Z")
        let siblingStart = try date("2026-06-04T12:00:00.000Z")
        let candidateValue = try candidate(
            1904,
            start: "2026-06-03T12:00:00.000Z"
        )
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1904,
                planID: planID,
                scheduledDate: targetStart,
                fingerprint: PrescriptionFingerprint.make(candidateValue.plan),
                pendingOperation: .remove,
                removalIntent: .calendar,
                removalTargetDate: targetStart
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: targetStart,
                isComplete: false
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: siblingStart,
                isComplete: false
            )
        )
        // The first list read misses the sibling completion; the pre-removal
        // read sees it; the removal read-back loses both copies.
        await store.completeSiblingsAfterNextRead(except: targetStart)
        await store.loseCompletedHistoryOnNextRemove()
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(candidates: [candidateValue]),
            scope: scope,
            generation: 1
        )

        let receipt = try await journal.receipt(scope: scope, eventID: 1904)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 1904
        )
        let workouts = await store.workouts
        let schedules = await store.scheduleRequests.count
        XCTAssertEqual(summary.completedEventIDs, [1904])
        XCTAssertEqual(summary.removedEventIDs, [1904])
        XCTAssertNil(receipt)
        XCTAssertNotNil(tombstone)
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertEqual(schedules, 0)

        let later = try await reconciler.reconcile(
            try snapshot(
                candidates: [candidateValue],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let schedulesAfter = await store.scheduleRequests.count
        XCTAssertEqual(later.completedEventIDs, [1904])
        XCTAssertEqual(schedulesAfter, 0)
    }

    func testEvictionTombstonesReadBackCompletionAndStillSchedulesNearer()
        async throws
    {
        let store = FakeStore(capacity: 2)
        let journal = FakeJournal()
        let planID = UUID()
        let targetStart = try date("2026-06-04T12:00:00.000Z")
        let siblingStart = try date("2026-06-05T12:00:00.000Z")
        let victim = try candidate(1805, start: "2026-06-04T12:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 1805,
                planID: planID,
                scheduledDate: targetStart,
                fingerprint: PrescriptionFingerprint.make(victim.plan)
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: targetStart,
                isComplete: false
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: siblingStart,
                isComplete: false
            )
        )
        await store.completeSiblingsAfterNextRemove()
        let reconciler = await makeReconciler(store: store, journal: journal)

        let summary = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(1804, start: "2026-06-03T12:00:00.000Z"),
                victim,
            ]),
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        let requests = await store.scheduleRequests
        let nearStart = try date("2026-06-03T12:00:00.000Z")
        let receipt = try await journal.receipt(scope: scope, eventID: 1805)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 1805
        )
        XCTAssertEqual(summary.scheduledEventIDs, [1804])
        XCTAssertEqual(summary.removedEventIDs, [1805])
        XCTAssertEqual(summary.completedEventIDs, [1805])
        XCTAssertEqual(requests.map(\.eventID), [1804])
        XCTAssertNil(receipt)
        XCTAssertNotNil(tombstone)
        XCTAssertEqual(workouts.count, 2)
        XCTAssertTrue(
            workouts.contains {
                $0.planID == planID
                    && $0.isComplete
                    && ScheduleDate.areEqual($0.startDate, siblingStart)
            }
        )
        XCTAssertTrue(
            workouts.contains {
                $0.planID == requests.first?.planID
                    && !$0.isComplete
                    && ScheduleDate.areEqual(
                        $0.startDate,
                        nearStart
                    )
            }
        )
    }

    func testImmediateMixedCompletionWritesTombstoneBeforeTheReceiptDowngrade()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let start = "2026-06-02T12:00:00.000Z"
        await store.completeAndLeaveIncompleteOnNextWrite()
        await journal.suspendNextRemoveSave()

        let pass = Task {
            try await reconciler.reconcile(
                try snapshot(candidates: [
                    try candidate(1901, start: start),
                ]),
                scope: scope,
                generation: 1
            )
        }
        await journal.waitUntilRemoveSaveIsSuspended()

        // The tombstone must already be durable at the ledger boundary where
        // the removal receipt drops its submitted state.
        let tombstoneAtBoundary = try await journal.completionTombstone(
            scope: scope,
            eventID: 1901
        )
        XCTAssertNotNil(tombstoneAtBoundary)
        let writesBefore = await store.scheduleRequests
        let planID = try XCTUnwrap(writesBefore.first?.planID)

        pass.cancel()
        await journal.resumeSuspendedRemoveSave()
        do {
            _ = try await pass.value
            XCTFail("The cancelled pass must not continue")
        } catch is CancellationError {
            // Expected.
        } catch {
            XCTFail("Unexpected error: \(error)")
        }

        // Apple later loses the completed history. The durable tombstone still
        // prevents a second submission.
        await store.forget(planID: planID)
        let next = try await reconciler.reconcile(
            try snapshot(
                candidates: [try candidate(1901, start: start)],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let writesAfter = await store.scheduleRequests.count
        XCTAssertEqual(next.completedEventIDs, [1901])
        XCTAssertEqual(writesAfter, writesBefore.count)
    }

    func testCleanupStopsOnUnreadableReadBackAndRetainsEveryIntent()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let first = try candidate(2001, start: "2026-06-02T12:00:00.000Z")
        let second = try candidate(2002, start: "2026-06-03T12:00:00.000Z")
        _ = try await reconciler.reconcile(
            try snapshot(candidates: [first, second]),
            scope: scope,
            generation: 1
        )
        let firstReceiptValue = try await journal.receipt(
            scope: scope,
            eventID: 2001
        )
        let firstReceipt = try XCTUnwrap(firstReceiptValue)
        let secondReceiptValue = try await journal.receipt(
            scope: scope,
            eventID: 2002
        )
        let secondReceipt = try XCTUnwrap(secondReceiptValue)
        await store.markComplete(planID: secondReceipt.planID)
        await store.failNextReadAfterRemove()

        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )

        let removeRequests = await store.removeRequests
        let workouts = await store.workouts
        let firstAfter = try await journal.receipt(
            scope: scope,
            eventID: 2001
        )
        let secondAfter = try await journal.receipt(
            scope: scope,
            eventID: 2002
        )
        let secondTombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 2002
        )
        XCTAssertEqual(cleanup.removedEventIDs, [])
        XCTAssertEqual(cleanup.retainedEventIDs, [2001, 2002])
        XCTAssertEqual(removeRequests, [firstReceipt.planID])
        XCTAssertEqual(workouts.map(\.planID), [secondReceipt.planID])
        XCTAssertEqual(firstAfter?.pendingOperation, .remove)
        XCTAssertEqual(firstAfter?.removalIntent, .cleanup)
        XCTAssertEqual(secondAfter?.pendingOperation, .remove)
        XCTAssertEqual(secondAfter?.removalIntent, .cleanup)
        XCTAssertNotNil(secondTombstone)

        // Even when Apple loses B's completed history before the retry, the
        // tombstone recorded from the initial authorized list survives.
        await store.forget(planID: secondReceipt.planID)
        let schedulesBeforeRetry = await store.scheduleRequests.count
        _ = try await reconciler.cleanup(scope: scope, generation: 1)
        let tombstoneAfterRetry = try await journal.completionTombstone(
            scope: scope,
            eventID: 2002
        )
        XCTAssertNotNil(tombstoneAfterRetry)

        let recurring = try await reconciler.reconcile(
            try snapshot(
                candidates: [second],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        let schedulesAfter = await store.scheduleRequests.count
        XCTAssertEqual(recurring.completedEventIDs, [2002])
        XCTAssertEqual(schedulesAfter, schedulesBeforeRetry)
    }

    func testCleanupContinuesWhenTheEntryIsVerifiedStillPresent()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        _ = try await reconciler.reconcile(
            try snapshot(candidates: [
                try candidate(2101, start: "2026-06-02T12:00:00.000Z"),
                try candidate(2102, start: "2026-06-03T12:00:00.000Z"),
            ]),
            scope: scope,
            generation: 1
        )
        await store.skipNextRemove()

        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        let first = try await journal.receipt(scope: scope, eventID: 2101)
        let second = try await journal.receipt(scope: scope, eventID: 2102)
        XCTAssertEqual(cleanup.removedEventIDs, [2102])
        XCTAssertEqual(cleanup.retainedEventIDs, [2101])
        XCTAssertEqual(workouts.count, 1)
        XCTAssertNotNil(first)
        XCTAssertNil(second)
    }

    func testCleanupStillRemovesEveryUUIDDateWhenSeparatelyAuthorized()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let planID = UUID()
        let firstDate = try date("2026-06-02T12:00:00.000Z")
        let secondDate = try date("2026-06-03T12:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 2201,
                planID: planID,
                scheduledDate: firstDate,
                fingerprint: "cleanup"
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: firstDate,
                isComplete: false
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: secondDate,
                isComplete: false
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        let cleanup = try await reconciler.cleanup(
            scope: scope,
            generation: 1
        )

        let workouts = await store.workouts
        let receipt = try await journal.receipt(scope: scope, eventID: 2201)
        let targets = await store.removalTargets
        XCTAssertEqual(cleanup.removedEventIDs, [2201])
        XCTAssertEqual(cleanup.retainedEventIDs, [])
        XCTAssertTrue(workouts.isEmpty)
        XCTAssertNil(receipt)
        XCTAssertEqual(targets, [nil])
    }

    func testUnsupportedPreflightDoesNotClearAnAmbiguousSubmittedWrite()
        async throws
    {
        let planID = UUID()
        let start = try date("2026-06-02T09:00:00.000Z")
        let store = FakeStore()
        await store.setUnsupportedPreflight(
            .swimming,
            reason: .poolSwimmingUnverified
        )
        let journal = FakeJournal()
        try await journal.save(
            ScheduleReceipt(
                scope: scope,
                eventID: 874,
                planID: planID,
                scheduledDate: start,
                fingerprint: "pool",
                pendingOperation: .schedule,
                pendingPhase: .confirming,
                submittedDate: start
            )
        )
        let reconciler = await makeReconciler(store: store, journal: journal)

        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [
                    try candidate(
                        874,
                        start: "2026-06-02T09:00:00.000Z",
                        sport: .swimming
                    ),
                ]),
                scope: scope,
                generation: 1
            )
            XCTFail("An invisible submitted write stays unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 874)
            )
        }
        let requests = await store.removeRequests
        XCTAssertTrue(requests.isEmpty)
        let kept = try await journal.receipt(scope: scope, eventID: 874)
        XCTAssertEqual(kept?.planID, planID)
        XCTAssertEqual(kept?.pendingPhase, .confirming)
    }

    func testCancellationDuringSubmissionJournalSaveIsRetryable()
        async throws
    {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        await journal.suspendNextConfirmingSave()
        let pass = Task {
            try await reconciler.reconcile(
                try snapshot(candidates: [
                    try candidate(901, start: "2026-06-02T12:00:00.000Z"),
                ]),
                scope: scope,
                generation: 1
            )
        }
        await journal.waitUntilSaveIsSuspended()
        pass.cancel()
        await journal.resumeSuspendedSave()

        do {
            _ = try await pass.value
            XCTFail("A cancelled background preflight must not submit")
        } catch is CancellationError {
            // Expected.
        }
        let requestsAfterCancel = await store.scheduleRequests
        XCTAssertTrue(requestsAfterCancel.isEmpty)
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 901
        )
        let receipt = try XCTUnwrap(receiptValue)
        XCTAssertEqual(receipt.pendingOperation, .schedule)
        XCTAssertEqual(receipt.pendingPhase, .writing)
        XCTAssertNil(receipt.submittedDate)

        // The next non-cancelled pass may safely retry the same receipt.
        let summary = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(901, start: "2026-06-02T12:00:00.000Z"),
                ],
                readAt: "2026-06-01T13:00:00.000Z"
            ),
            scope: scope,
            generation: 1
        )
        XCTAssertEqual(summary.scheduledEventIDs, [901])
        let requestsAfterRetry = await store.scheduleRequests
        XCTAssertEqual(requestsAfterRetry.map(\.eventID), [901])
    }

    func testPresentJournalMustDecodeOrFail() async throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("watch-journal-\(UUID().uuidString).json")
        addTeardownBlock { try? FileManager.default.removeItem(at: url) }

        let missing = FileScheduleJournal(fileURL: url)
        let missingReceipts = try await missing.allReceipts()
        XCTAssertEqual(missingReceipts, [])

        try Data().write(to: url)
        let zeroBytes = FileScheduleJournal(fileURL: url)
        do {
            _ = try await zeroBytes.allReceipts()
            XCTFail("A zero-byte journal is not an empty journal")
        } catch let error as ScheduleJournalError {
            XCTAssertEqual(error, .corrupt)
        }

        try Data("not-json".utf8).write(to: url)
        let corrupt = FileScheduleJournal(fileURL: url)
        do {
            _ = try await corrupt.allReceipts()
            XCTFail("A corrupt journal is not an empty journal")
        } catch let error as ScheduleJournalError {
            XCTAssertEqual(error, .corrupt)
        }

        // A present `{}` does not name either collection. It is as
        // untrustworthy as truncated JSON; only an explicit empty document is
        // an empty journal.
        try Data("{}".utf8).write(to: url)
        let emptyObject = FileScheduleJournal(fileURL: url)
        do {
            _ = try await emptyObject.allReceipts()
            XCTFail("A present empty object is not an empty journal")
        } catch let error as ScheduleJournalError {
            XCTAssertEqual(error, .corrupt)
        }

        try Data(#"{"receipts":[],"tombstones":[]}"#.utf8).write(to: url)
        let emptyDocument = FileScheduleJournal(fileURL: url)
        let emptyReceipts = try await emptyDocument.allReceipts()
        XCTAssertEqual(emptyReceipts, [])

        // An omitted collection remains readable for an older journal, but a
        // present `null` is a rewritten/corrupt value that must not erase it.
        try Data(#"{"receipts":[]}"#.utf8).write(to: url)
        let omittedTombstones = FileScheduleJournal(fileURL: url)
        let omittedReceipts = try await omittedTombstones.allReceipts()
        let omittedTombstoneValues = try await omittedTombstones
            .completionTombstones(for: scope)
        XCTAssertEqual(omittedReceipts, [])
        XCTAssertEqual(omittedTombstoneValues, [])

        for nullDocument in [
            #"{"receipts":null}"#,
            #"{"tombstones":null}"#,
            #"{"receipts":[],"tombstones":null}"#,
        ] {
            try Data(nullDocument.utf8).write(to: url)
            let nullCollections = FileScheduleJournal(fileURL: url)
            do {
                _ = try await nullCollections.allReceipts()
                XCTFail("A null collection is not an omitted collection")
            } catch let error as ScheduleJournalError {
                XCTAssertEqual(error, .corrupt)
            }
        }
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
            try? await Task.sleep(nanoseconds: 1_000_000)
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

    // MARK: - Fix round 4: submission identity, cleanup authorization

    func testImmediatePostSubmitReadRecordsOldCompletionWithoutClearingTarget() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let oldDate = "2026-06-02T12:00:00.000Z"
        let newDate = "2026-06-03T12:00:00.000Z"

        await store.hideNextWriteWithOldCompletion(at: try date(oldDate))
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [try candidate(1101, start: newDate)]),
                scope: scope,
                generation: 1
            )
            XCTFail("An old-date completion must not confirm the submitted target")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 1101)
            )
        }

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let hidden = await store.hiddenWorkoutCount()
        let receiptValue = try await journal.receipt(
            scope: scope,
            eventID: 1101
        )
        let receipt = try XCTUnwrap(receiptValue)
        let tombstone = try await journal.completionTombstone(
            scope: scope,
            eventID: 1101
        )
        XCTAssertEqual(requests.count, 1)
        XCTAssertEqual(hidden, 1)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertEqual(workouts.first?.isComplete, true)
        XCTAssertEqual(receipt.pendingOperation, .schedule)
        XCTAssertEqual(receipt.pendingPhase, .confirming)
        XCTAssertEqual(receipt.submittedDate, try date(newDate))
        XCTAssertNotNil(tombstone)
    }

    func testCleanupPersistsAuthorizationBeforeAFailedSchedulerRead() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let reconciler = await makeReconciler(store: store, journal: journal)
        let start = "2026-06-02T12:00:00.000Z"

        await store.acceptButHideNextWrite()
        do {
            _ = try await reconciler.reconcile(
                try snapshot(candidates: [try candidate(1102, start: start)]),
                scope: scope,
                generation: 1
            )
            XCTFail("A hidden write is unresolved")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 1102)
            )
        }
        let submittedDate = try date(start)

        await store.failNextRead()
        do {
            _ = try await reconciler.cleanup(scope: scope, generation: 1)
            XCTFail("The cleanup scheduler read must fail")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(error, .storeUnavailable)
        }

        let authorizedValue = try await journal.receipt(
            scope: scope,
            eventID: 1102
        )
        let authorized = try XCTUnwrap(authorizedValue)
        XCTAssertEqual(authorized.removalIntent, .cleanup)
        XCTAssertEqual(authorized.pendingPhase, .confirming)
        XCTAssertEqual(authorized.submittedDate, submittedDate)

        await reconciler.activate(generation: 2, for: otherScope)
        let bSnapshot = try snapshot(
            candidates: [try candidate(1103, start: "2026-06-03T12:00:00.000Z")],
            scope: otherScope
        )
        do {
            _ = try await reconciler.reconcile(
                bSnapshot,
                scope: otherScope,
                generation: 2
            )
            XCTFail("Account B must wait for account A's authorized cleanup")
        } catch let error as ScheduleReconcileError {
            XCTAssertEqual(
                error,
                .unresolvedWrite(scope: scope, eventID: 1102)
            )
        }

        await store.revealHiddenWorkouts()
        _ = try await reconciler.reconcile(
            bSnapshot,
            scope: otherScope,
            generation: 2
        )

        let requests = await store.scheduleRequests
        let workouts = await store.workouts
        let aReceipt = try await journal.receipt(scope: scope, eventID: 1102)
        let bReceipt = try await journal.receipt(
            scope: otherScope,
            eventID: 1103
        )
        XCTAssertEqual(requests.count, 2)
        XCTAssertEqual(workouts.count, 1)
        XCTAssertNil(aReceipt)
        XCTAssertNotNil(bReceipt)
    }

    func testCrossScopeCompletionPersistsBeforeHistoryLossDuringRemoval() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let planID = UUID()
        let aStart = try date("2026-06-02T09:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: otherScope,
                eventID: 1104,
                planID: planID,
                scheduledDate: aStart,
                fingerprint: "a",
                pendingOperation: .remove,
                removalIntent: .cleanup
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: aStart,
                isComplete: true
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: aStart,
                isComplete: false
            )
        )
        await store.loseCompletedHistoryOnNextRemove()
        let reconciler = await makeReconciler(
            store: store,
            journal: journal,
            generation: 2
        )

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(1105, start: "2026-06-03T12:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 2
        )

        let tombstone = try await journal.completionTombstone(
            scope: otherScope,
            eventID: 1104
        )
        let aReceipt = try await journal.receipt(
            scope: otherScope,
            eventID: 1104
        )
        let schedulesAfterB = await store.scheduleRequests.count
        let workoutsAfterB = await store.workouts
        XCTAssertNotNil(tombstone)
        XCTAssertNil(aReceipt)
        XCTAssertEqual(schedulesAfterB, 1)
        XCTAssertEqual(workoutsAfterB.count, 1)

        await reconciler.activate(generation: 3, for: otherScope)
        let recurring = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(1104, start: "2026-06-02T09:00:00.000Z"),
                ],
                readAt: "2026-06-01T14:00:00.000Z",
                scope: otherScope
            ),
            scope: otherScope,
            generation: 3
        )

        let schedulesAfterRecurrence = await store.scheduleRequests.count
        XCTAssertEqual(recurring.completedEventIDs, [1104])
        XCTAssertEqual(schedulesAfterRecurrence, schedulesAfterB)
    }

    /// Apple can drop a completed entry between the reconcile read and the
    /// cleanup read performed for another account's pending cleanup. The
    /// completion seen by the first read must already be durable when the
    /// removal deletes that other account's receipt.
    func testCrossScopeCompletionObservedBeforeCleanupRereadPersistsTombstone() async throws {
        let store = FakeStore()
        let journal = FakeJournal()
        let planID = UUID()
        let aStart = try date("2026-06-02T09:00:00.000Z")
        try await journal.save(
            ScheduleReceipt(
                scope: otherScope,
                eventID: 1106,
                planID: planID,
                scheduledDate: aStart,
                fingerprint: "a",
                pendingOperation: .remove,
                removalIntent: .cleanup
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: aStart,
                isComplete: true
            )
        )
        await store.seed(
            ScheduledWorkoutState(
                planID: planID,
                startDate: aStart,
                isComplete: false
            )
        )
        // The initial reconcile read still shows the completion; the cleanup
        // reread sees only the upcoming copy, before any removal is attempted.
        await store.loseCompletedHistoryAfterNextRead(planID: planID)
        let reconciler = await makeReconciler(
            store: store,
            journal: journal,
            generation: 2
        )

        _ = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(1107, start: "2026-06-03T12:00:00.000Z"),
                ]
            ),
            scope: scope,
            generation: 2
        )

        let tombstone = try await journal.completionTombstone(
            scope: otherScope,
            eventID: 1106
        )
        let aReceipt = try await journal.receipt(
            scope: otherScope,
            eventID: 1106
        )
        let schedulesAfterB = await store.scheduleRequests.count
        let workoutsAfterB = await store.workouts
        XCTAssertNotNil(tombstone)
        XCTAssertNil(aReceipt)
        XCTAssertEqual(schedulesAfterB, 1)
        XCTAssertEqual(workoutsAfterB.count, 1)

        await reconciler.activate(generation: 3, for: otherScope)
        let recurring = try await reconciler.reconcile(
            try snapshot(
                candidates: [
                    try candidate(1106, start: "2026-06-02T09:00:00.000Z"),
                ],
                readAt: "2026-06-01T14:00:00.000Z",
                scope: otherScope
            ),
            scope: otherScope,
            generation: 3
        )

        let schedulesAfterRecurrence = await store.scheduleRequests.count
        XCTAssertEqual(recurring.completedEventIDs, [1106])
        XCTAssertEqual(schedulesAfterRecurrence, schedulesAfterB)
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
    private(set) var removalTargets: [Date?] = []
    private(set) var calendarsUsed: [String] = []
    private(set) var removalCalendarsUsed: [String] = []
    private var unsupportedPreflight: [String: UnsupportedReason] = [:]
    private var readFailures = 0
    private var failReadsAfterNextRemove = false
    private var scheduleFailure: ScheduleFailure = .none
    private var removeFailure = false
    private var ignoreNextRemove = false
    private var scheduleStoreError: ScheduleStoreError?
    private var readStoreError: ScheduleStoreError?
    private var failReadsAfterNextSchedule = false
    private var cancelAfterNextWrite = false
    private var shouldCompleteInsteadOfNextRemove = false
    private var shouldCompleteAndLeaveIncompleteOnNextRemove = false
    private var shouldCompleteSiblingsAfterNextRemove = false
    private var shouldCompleteAndLeaveIncompleteOnNextWrite = false
    private var shouldSuspendNextWrite = false
    private var shouldSuspendBeforeFence = false
    private var shouldSuspendRemoveBeforeFence = false
    private var shouldHideNextAcceptedWrite = false
    private var oldCompletionDateOnNextWrite: Date?
    private var shouldLoseCompletedHistoryOnNextRemove = false
    private var loseCompletedHistoryAfterReadPlanID: UUID?
    private var completeSiblingsOnNextReadExcept: Date?
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

    func preflight(_ plan: PlanInput) async -> SchedulePreflight {
        if let reason = unsupportedPreflight[plan.sport.rawValue] {
            return .unsupported(reason)
        }
        return .supported
    }

    func setUnsupportedPreflight(
        _ sport: PlanSport,
        reason: UnsupportedReason
    ) {
        unsupportedPreflight[sport.rawValue] = reason
    }

    func scheduledWorkouts(calendar: Calendar) async throws -> [ScheduledWorkoutState] {
        calendarsUsed.append(calendar.timeZone.identifier)
        if let error = readStoreError {
            readStoreError = nil
            throw error
        }
        if readFailures > 0 {
            readFailures -= 1
            throw FakeStoreError.readFailed
        }
        let result = workouts
        if let planID = loseCompletedHistoryAfterReadPlanID {
            loseCompletedHistoryAfterReadPlanID = nil
            workouts.removeAll { $0.planID == planID && $0.isComplete }
        }
        if let exception = completeSiblingsOnNextReadExcept {
            completeSiblingsOnNextReadExcept = nil
            workouts = workouts.map {
                guard !$0.isComplete,
                      !ScheduleDate.areEqual($0.startDate, exception)
                else {
                    return $0
                }
                return ScheduledWorkoutState(
                    planID: $0.planID,
                    startDate: $0.startDate,
                    isComplete: true
                )
            }
        }
        return result
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
            if let oldDate = oldCompletionDateOnNextWrite {
                oldCompletionDateOnNextWrite = nil
                workouts.append(
                    ScheduledWorkoutState(
                        planID: request.planID,
                        startDate: oldDate,
                        isComplete: true
                    )
                )
            }
        } else if shouldCompleteAndLeaveIncompleteOnNextWrite {
            shouldCompleteAndLeaveIncompleteOnNextWrite = false
            workouts.append(
                ScheduledWorkoutState(
                    planID: request.planID,
                    startDate: request.startDate,
                    isComplete: true
                )
            )
            workouts.append(state)
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
        targetDate: Date?,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        if shouldSuspendRemoveBeforeFence {
            shouldSuspendRemoveBeforeFence = false
            await suspendAtFence()
        }
        try await fence.check()
        removalCalendarsUsed.append(calendar.timeZone.identifier)
        removalTargets.append(targetDate)
        removeRequests.append(planID)
        await log?.append("store.remove:\(planID)")
        if removeFailure {
            removeFailure = false
            throw FakeStoreError.writeFailed
        }
        if ignoreNextRemove {
            ignoreNextRemove = false
            return
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
        if shouldLoseCompletedHistoryOnNextRemove {
            shouldLoseCompletedHistoryOnNextRemove = false
            workouts.removeAll { $0.planID == planID }
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
        let target = targetDate.map(ScheduleDate.normalized)
        workouts.removeAll {
            $0.planID == planID
                && !$0.isComplete
                && (target == nil
                    || ScheduleDate.areEqual($0.startDate, target!))
        }
        if shouldCompleteSiblingsAfterNextRemove {
            shouldCompleteSiblingsAfterNextRemove = false
            workouts = workouts.map {
                guard $0.planID == planID, !$0.isComplete else {
                    return $0
                }
                return ScheduledWorkoutState(
                    planID: $0.planID,
                    startDate: $0.startDate,
                    isComplete: true
                )
            }
        }
        if failReadsAfterNextRemove {
            failReadsAfterNextRemove = false
            readFailures += 1
        }
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

    func skipNextRemove() {
        ignoreNextRemove = true
    }

    func failNextReadAfterRemove() {
        failReadsAfterNextRemove = true
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

    func hideNextWriteWithOldCompletion(at date: Date) {
        shouldHideNextAcceptedWrite = true
        oldCompletionDateOnNextWrite = date
    }

    func loseCompletedHistoryOnNextRemove() {
        shouldLoseCompletedHistoryOnNextRemove = true
    }

    func completeSiblingsAfterNextRead(except date: Date) {
        completeSiblingsOnNextReadExcept = date
    }

    /// Returns the current entries once, then drops the completed copy so the
    /// next scheduler read resembles Apple losing that history.
    func loseCompletedHistoryAfterNextRead(planID: UUID) {
        loseCompletedHistoryAfterReadPlanID = planID
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

    func completeAndLeaveIncompleteOnNextWrite() {
        shouldCompleteAndLeaveIncompleteOnNextWrite = true
    }

    func completeSiblingsAfterNextRemove() {
        shouldCompleteSiblingsAfterNextRemove = true
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
    private var suspendRemoveSave = false
    private var saveIsSuspended = false
    private var removeSaveIsSuspended = false
    private var saveResumeWaiters: [CheckedContinuation<Void, Never>] = []
    private var saveSuspensionObservers: [CheckedContinuation<Void, Never>] = []
    private var removeSaveResumeWaiters: [CheckedContinuation<Void, Never>] = []
    private var removeSaveSuspensionObservers: [CheckedContinuation<Void, Never>] = []
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
        if suspendRemoveSave
            && receipt.pendingOperation == .remove
            && receipt.pendingPhase == nil {
            suspendRemoveSave = false
            removeSaveIsSuspended = true
            let observers = removeSaveSuspensionObservers
            removeSaveSuspensionObservers.removeAll()
            for observer in observers {
                observer.resume()
            }
            await withCheckedContinuation { continuation in
                removeSaveResumeWaiters.append(continuation)
            }
        }
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

    func suspendNextRemoveSave() {
        suspendRemoveSave = true
    }

    func waitUntilRemoveSaveIsSuspended() async {
        if removeSaveIsSuspended {
            return
        }
        await withCheckedContinuation { continuation in
            removeSaveSuspensionObservers.append(continuation)
        }
    }

    func resumeSuspendedRemoveSave() {
        removeSaveIsSuspended = false
        let waiters = removeSaveResumeWaiters
        removeSaveResumeWaiters.removeAll()
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

/// Test-only time-zone switch while the reconciler stays alive.
private final class MutableCalendarBox: @unchecked Sendable {
    var calendar: Calendar

    init(calendar: Calendar) {
        self.calendar = calendar
    }
}
