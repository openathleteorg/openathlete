import Foundation

// MARK: - Store contract

/// The actual Apple schedule for this app, reduced to the values the core can
/// reason about. The adapter in the app target maps
/// `WorkoutScheduler.shared.scheduledWorkouts` onto this type.
public struct ScheduledWorkoutState: Equatable, Sendable {
    public let planID: UUID
    public let startDate: Date
    public let isComplete: Bool

    public init(planID: UUID, startDate: Date, isComplete: Bool) {
        self.planID = planID
        self.startDate = startDate
        self.isComplete = isComplete
    }
}

/// One owned workout to write. The plan ID is the durable identity: retries and
/// replacements reuse it, so a crash between two Apple calls cannot create a
/// second entry for the same event.
public struct ScheduleWorkoutRequest: Equatable, Sendable {
    public let eventID: Int
    public let planID: UUID
    public let plan: PlanInput
    public let startDate: Date

    public init(
        eventID: Int,
        planID: UUID,
        plan: PlanInput,
        startDate: Date
    ) {
        self.eventID = eventID
        self.planID = planID
        self.plan = plan
        self.startDate = startDate
    }
}

public enum ScheduleStoreError: Error, Equatable, Sendable {
    /// `ScheduledWorkoutPlan.date` could not be resolved to a local date.
    case unreadableScheduledWorkout
    /// The device cannot schedule workouts (for example, an unsupported iPad
    /// configuration).
    case unsupportedDevice
    /// Scheduling permission is not granted. Nothing may be read or written.
    case unauthorized
}

/// The narrow WorkoutKit surface. `remove(planID:)` must never remove a
/// completed workout: Apple's completed entries are history, not ours to
/// delete.
public protocol ScheduleWorkoutStore: Sendable {
    func maximumScheduledWorkoutCount() async -> Int
    func scheduledWorkouts(calendar: Calendar) async throws -> [ScheduledWorkoutState]
    func schedule(
        _ request: ScheduleWorkoutRequest,
        calendar: Calendar
    ) async throws
    func remove(planID: UUID, calendar: Calendar) async throws
}

// MARK: - Durable journal

public enum ScheduleOperation: String, Codable, Equatable, Sendable {
    /// The target entry has not yet been confirmed in Apple's state.
    case schedule
    /// An older entry for the same plan ID must disappear before the new one
    /// is written.
    case replace
    /// The entry is being cleaned up and must not survive a crash.
    case remove
}

/// The durable association between one event and its Apple plan.
///
/// `planID` is written and stored before the first Apple call. `pendingOperation`
/// stays set until a fresh read of Apple's schedule confirms the write, so a
/// crash in the middle of a move or replacement replays that operation instead
/// of scheduling a second workout.
public struct ScheduleReceipt: Codable, Equatable, Sendable {
    public let scope: AccountScope
    public let eventID: Int
    public let planID: UUID
    public var scheduledDate: Date
    /// Stable hash of the resolved prescription, including zone bounds.
    public var fingerprint: String
    public var pendingOperation: ScheduleOperation?
    /// The date the previous entry occupied, while `pendingOperation == .replace`.
    public var pendingPreviousDate: Date?

    public init(
        scope: AccountScope,
        eventID: Int,
        planID: UUID,
        scheduledDate: Date,
        fingerprint: String,
        pendingOperation: ScheduleOperation? = nil,
        pendingPreviousDate: Date? = nil
    ) {
        self.scope = scope
        self.eventID = eventID
        self.planID = planID
        self.scheduledDate = scheduledDate
        self.fingerprint = fingerprint
        self.pendingOperation = pendingOperation
        self.pendingPreviousDate = pendingPreviousDate
    }
}

public protocol ScheduleJournal: Sendable {
    func allReceipts() async throws -> [ScheduleReceipt]
    func receipts(for scope: AccountScope) async throws -> [ScheduleReceipt]
    func receipt(scope: AccountScope, eventID: Int) async throws -> ScheduleReceipt?
    func save(_ receipt: ScheduleReceipt) async throws
    func delete(scope: AccountScope, eventID: Int) async throws
}

/// Foundation-only journal for the app. Writes are atomic, so a crash leaves
/// either the previous document or the next one, never a half-written receipt.
public actor FileScheduleJournal: ScheduleJournal {
    private struct Document: Codable {
        var receipts: [ScheduleReceipt] = []
    }

    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(fileURL: URL) {
        self.fileURL = fileURL
    }

    public func allReceipts() async throws -> [ScheduleReceipt] {
        try load().receipts.sorted {
            if $0.scope != $1.scope {
                return $0.scope.athleteId < $1.scope.athleteId
            }
            return $0.eventID < $1.eventID
        }
    }

    public func receipts(for scope: AccountScope) async throws -> [ScheduleReceipt] {
        try load().receipts
            .filter { $0.scope == scope }
            .sorted { $0.eventID < $1.eventID }
    }

    public func receipt(
        scope: AccountScope,
        eventID: Int
    ) async throws -> ScheduleReceipt? {
        try load().receipts.first {
            $0.scope == scope && $0.eventID == eventID
        }
    }

    public func save(_ receipt: ScheduleReceipt) async throws {
        var document = try load()
        if let index = document.receipts.firstIndex(where: {
            $0.scope == receipt.scope && $0.eventID == receipt.eventID
        }) {
            document.receipts[index] = receipt
        } else {
            document.receipts.append(receipt)
        }
        try write(document)
    }

    public func delete(scope: AccountScope, eventID: Int) async throws {
        var document = try load()
        document.receipts.removeAll {
            $0.scope == scope && $0.eventID == eventID
        }
        try write(document)
    }

    private func load() throws -> Document {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return Document()
        }
        let data = try Data(contentsOf: fileURL)
        guard !data.isEmpty else {
            return Document()
        }
        return try decoder.decode(Document.self, from: data)
    }

    private func write(_ document: Document) throws {
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        let data = try encoder.encode(document)
        try data.write(to: fileURL, options: .atomic)
    }
}

// MARK: - Fingerprint

/// Stable across launches and platforms: sorted JSON keys, then two FNV-1a
/// lanes. Resolved zone bounds are part of `PlanInput`, so editing a zone
/// changes the fingerprint without touching the event.
public enum PrescriptionFingerprint {
    public static func make(_ plan: PlanInput) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        guard let data = try? encoder.encode(plan) else {
            return "unencodable"
        }
        let first = fnv1a(data, seed: 0xcbf2_9ce4_8422_2325)
        let second = fnv1a(data, seed: 0x8422_2325_cbf2_9ce4)
        return "\(hex(first))\(hex(second))"
    }

    private static func fnv1a(_ data: Data, seed: UInt64) -> UInt64 {
        var hash = seed
        for byte in data {
            hash ^= UInt64(byte)
            hash = hash &* 0x100_0000_01b3
        }
        return hash
    }

    private static func hex(_ value: UInt64) -> String {
        let digits = String(value, radix: 16)
        return String(repeating: "0", count: 16 - digits.count) + digits
    }
}

// MARK: - Results

public struct SyncSummary: Equatable, Sendable {
    public let scope: AccountScope
    public let generation: UInt64
    /// Writes performed for events with no previous Apple entry in this pass.
    public let scheduledEventIDs: [Int]
    /// Writes whose result was observed in Apple's schedule.
    public let confirmedEventIDs: [Int]
    /// The phone call returned but the entry was not observed afterwards. The
    /// pending receipt is kept and rechecked, never reported as delivered.
    public let pendingConfirmationEventIDs: [Int]
    public let unchangedEventIDs: [Int]
    public let replacedEventIDs: [Int]
    public let removedEventIDs: [Int]
    public let completedEventIDs: [Int]
    /// Transient read failures: the previous entry and receipt are retained.
    public let retainedEventIDs: [Int]
    /// Beyond Apple's runtime capacity; retried on a later pass.
    public let overflowEventIDs: [Int]
    public let failedEventIDs: [Int]
    public let skipped: [SkippedScheduleEvent]
}

public struct CleanupSummary: Equatable, Sendable {
    public let scope: AccountScope
    public let generation: UInt64
    public let removedEventIDs: [Int]
    /// Removal failed; the pending receipt was kept for a later cleanup.
    public let retainedEventIDs: [Int]
}

public enum ScheduleReconcileError: Error, Equatable, Sendable {
    case staleGeneration
    case scopeMismatch
    case invalidSnapshot
    /// Apple's schedule could not be read. Nothing was written.
    case storeUnavailable
    /// Scheduling permission is denied or revoked. Stop; do not attempt the
    /// remaining events.
    case schedulingDenied
    /// The device cannot schedule workouts at all.
    case schedulingUnsupported
    /// The durable journal could not be read or written.
    case journalUnavailable
    /// An entry for another account could not be removed before scheduling.
    case pendingCleanup(scope: AccountScope, eventID: Int)
}

// MARK: - Reconciler

/// Serialized owner of scheduling writes. The actor makes concurrent foreground
/// and background refreshes queue behind each other; `generation` makes a late
/// response from a logged-out account stop before its next write.
public actor ScheduleReconciler {
    private let store: any ScheduleWorkoutStore
    private let journal: any ScheduleJournal
    private let calendar: Calendar
    private var activeGeneration: UInt64?
    private var activeScope: AccountScope?

    public init(
        store: any ScheduleWorkoutStore,
        journal: any ScheduleJournal,
        calendar: Calendar
    ) {
        self.store = store
        self.journal = journal
        self.calendar = calendar
    }

    /// Called on connect and after every successful account/instance switch.
    public func activate(generation: UInt64, for scope: AccountScope) {
        activeGeneration = generation
        activeScope = scope
    }

    /// Called on logout, disconnect or instance switch before credentials are
    /// discarded. A later reconcile for the old generation writes nothing.
    public func invalidate() {
        activeGeneration = nil
        activeScope = nil
    }

    public func isActive(generation: UInt64, for scope: AccountScope) -> Bool {
        activeGeneration == generation && activeScope == scope
    }

    public func reconcile(
        _ snapshot: ScheduleSnapshot,
        scope: AccountScope,
        generation: UInt64
    ) async throws -> SyncSummary {
        guard snapshot.scope == scope else {
            throw ScheduleReconcileError.scopeMismatch
        }
        try Self.validate(snapshot)
        try requireActive(generation, scope: scope)

        // A previous account's pending cleanup must finish before this account
        // is scheduled. Otherwise an interrupted logout could leave the old
        // account's workouts on the watch.
        try await finishPendingCleanup(except: scope, generation: generation)

        var actual = try await readActual()
        let receipts = try await readReceipts(for: scope)
        var receiptsByEvent = Dictionary(
            uniqueKeysWithValues: receipts.map { ($0.eventID, $0) }
        )
        try requireActive(generation, scope: scope)

        let retryable = Set(snapshot.retryableEventIds)
        let completed = Set(snapshot.completedEventIds)
        let candidateByEvent = Dictionary(
            uniqueKeysWithValues: snapshot.candidates.map { ($0.eventId, $0) }
        )

        var scheduled: [Int] = []
        var confirmed: [Int] = []
        var pendingConfirmation: [Int] = []
        var unchanged: [Int] = []
        var replaced: [Int] = []
        var removed: [Int] = []
        var completedEventIDs: [Int] = []
        var retained: [Int] = []
        var overflow: [Int] = []
        var failed: [Int] = []

        // Removals first: they free capacity and clean cancelled, completed or
        // newly unsupported sessions. A retryable read failure is not one of
        // these: it keeps both the receipt and the Apple entry.
        for receipt in receipts.sorted(by: { $0.eventID < $1.eventID }) {
            let eventID = receipt.eventID
            let isCandidate = candidateByEvent[eventID] != nil

            if receipt.pendingOperation == .remove {
                // A completed Apple entry is history. If the event came back
                // in the calendar, keep the receipt (and its plan ID) so the
                // scheduling pass sees the completed entry and does not write
                // a fresh duplicate.
                if isCandidate,
                   actual.contains(where: {
                       $0.planID == receipt.planID && $0.isComplete
                   }) {
                    continue
                }
                let outcome = try await removeOwnedEntry(
                    receipt,
                    actual: &actual,
                    generation: generation
                )
                if outcome.confirmed {
                    receiptsByEvent[eventID] = nil
                    if outcome.removed {
                        removed.append(eventID)
                    } else if outcome.completed {
                        completedEventIDs.append(eventID)
                    }
                } else {
                    failed.append(eventID)
                    retained.append(eventID)
                }
                continue
            }

            if isCandidate {
                continue
            }
            if retryable.contains(eventID) {
                // The snapshot could not read the detail or zones. Keep the
                // previous entry and retry; never treat it as a cancellation.
                retained.append(eventID)
                continue
            }

            // Cancelled, out of window, already completed, or a confirmed
            // unsupported prescription. Any of those supersedes the entry this
            // integration scheduled before.
            let outcome = try await removeOwnedEntry(
                receipt,
                actual: &actual,
                generation: generation
            )
            if outcome.confirmed {
                receiptsByEvent[eventID] = nil
                if outcome.removed {
                    removed.append(eventID)
                } else if outcome.completed {
                    completedEventIDs.append(eventID)
                }
            } else {
                failed.append(eventID)
                retained.append(eventID)
            }
        }

        let capacity = await store.maximumScheduledWorkoutCount()
        let ordered = snapshot.candidates.sorted {
            if $0.startDate != $1.startDate {
                return $0.startDate < $1.startDate
            }
            return $0.eventId < $1.eventId
        }

        for candidate in ordered {
            try requireActive(generation, scope: scope)
            let eventID = candidate.eventId
            if completed.contains(eventID) {
                if !completedEventIDs.contains(eventID) {
                    completedEventIDs.append(eventID)
                }
                continue
            }

            let fingerprint = PrescriptionFingerprint.make(candidate.plan)
            let existingReceipt = receiptsByEvent[eventID]
            let planID = existingReceipt?.planID ?? UUID()
            let entries = actual.filter { $0.planID == planID }

            if entries.contains(where: \.isComplete) {
                // Apple already reports this session done. Never remove or
                // reschedule it, even if the calendar has not caught up.
                if var receipt = existingReceipt {
                    if receipt.pendingOperation != nil {
                        receipt.pendingOperation = nil
                        receipt.pendingPreviousDate = nil
                        try await saveReceipt(receipt, generation: generation)
                        receiptsByEvent[eventID] = receipt
                    }
                }
                completedEventIDs.append(eventID)
                continue
            }

            let targetEntries = entries.filter {
                $0.startDate == candidate.startDate
            }
            let staleEntries = entries.filter {
                $0.startDate != candidate.startDate
            }
            let needsReplacement = existingReceipt.map {
                $0.fingerprint != fingerprint
                    || $0.scheduledDate != candidate.startDate
            } ?? false

            if let receipt = existingReceipt,
               !needsReplacement,
               receipt.pendingOperation != .replace,
               targetEntries.count == 1,
               staleEntries.isEmpty {
                if receipt.pendingOperation != nil {
                    var cleared = receipt
                    cleared.pendingOperation = nil
                    cleared.pendingPreviousDate = nil
                    try await saveReceipt(cleared, generation: generation)
                    receiptsByEvent[eventID] = cleared
                }
                unchanged.append(eventID)
                continue
            }

            let operation: ScheduleOperation
            let previousDate: Date?
            if let receipt = existingReceipt,
               receipt.pendingOperation == .replace {
                operation = .replace
                previousDate = receipt.pendingPreviousDate
                    ?? receipt.scheduledDate
            } else if needsReplacement {
                operation = .replace
                previousDate = existingReceipt?.scheduledDate
            } else {
                operation = .schedule
                previousDate = nil
            }

            let hadUsableEntry = entries.contains { !$0.isComplete }
            // Removing a stale/old entry makes room for its replacement, so
            // only a genuinely new plan competes for a free slot.
            if !hadUsableEntry && actual.count >= capacity {
                overflow.append(eventID)
                continue
            }

            var receipt = existingReceipt ?? ScheduleReceipt(
                scope: scope,
                eventID: eventID,
                planID: planID,
                scheduledDate: candidate.startDate,
                fingerprint: fingerprint
            )
            receipt.scheduledDate = candidate.startDate
            receipt.fingerprint = fingerprint
            receipt.pendingOperation = operation
            receipt.pendingPreviousDate = previousDate
            // Persist the stable plan ID and pending operation before the
            // first Apple write. A crash after this point replays the record.
            try await saveReceipt(receipt, generation: generation)
            receiptsByEvent[eventID] = receipt

            if hadUsableEntry {
                try requireActive(generation, scope: scope)
                do {
                    try await store.remove(
                        planID: planID,
                        calendar: calendar
                    )
                } catch {
                    try rethrowFatal(error)
                    failed.append(eventID)
                    continue
                }
                do {
                    actual = try await readActual()
                } catch {
                    try rethrowFatal(error)
                    failed.append(eventID)
                    continue
                }
                let remaining = actual.filter {
                    $0.planID == planID && !$0.isComplete
                }
                if !remaining.isEmpty {
                    // The old entry is still there. Do not write a second one.
                    failed.append(eventID)
                    continue
                }
            }

            try requireActive(generation, scope: scope)
            if actual.count >= capacity {
                overflow.append(eventID)
                continue
            }

            do {
                try await store.schedule(
                    ScheduleWorkoutRequest(
                        eventID: eventID,
                        planID: planID,
                        plan: candidate.plan,
                        startDate: candidate.startDate
                    ),
                    calendar: calendar
                )
            } catch {
                try rethrowFatal(error)
                failed.append(eventID)
                continue
            }

            do {
                actual = try await readActual()
            } catch {
                // Do not claim Apple accepted it. The receipt stays pending and
                // the next pass reads the real state.
                try rethrowFatal(error)
                pendingConfirmation.append(eventID)
                failed.append(eventID)
                continue
            }

            let isConfirmed = actual.contains {
                $0.planID == planID
                    && $0.startDate == candidate.startDate
                    && !$0.isComplete
            }
            guard isConfirmed else {
                pendingConfirmation.append(eventID)
                failed.append(eventID)
                continue
            }

            receipt.pendingOperation = nil
            receipt.pendingPreviousDate = nil
            try await saveReceipt(receipt, generation: generation)
            receiptsByEvent[eventID] = receipt
            if operation == .replace && hadUsableEntry {
                replaced.append(eventID)
            } else {
                scheduled.append(eventID)
            }
            confirmed.append(eventID)
        }

        // A pending receipt whose event disappeared is cleaned in the removal
        // loop above. A retryable one stays pending until the plan can be read
        // again; it is never scheduled from a fingerprint alone.

        return SyncSummary(
            scope: scope,
            generation: generation,
            scheduledEventIDs: sortedUnique(scheduled),
            confirmedEventIDs: sortedUnique(confirmed),
            pendingConfirmationEventIDs: sortedUnique(pendingConfirmation),
            unchangedEventIDs: sortedUnique(unchanged),
            replacedEventIDs: sortedUnique(replaced),
            removedEventIDs: sortedUnique(removed),
            completedEventIDs: sortedUnique(completedEventIDs),
            retainedEventIDs: sortedUnique(retained),
            overflowEventIDs: sortedUnique(overflow),
            failedEventIDs: sortedUnique(failed),
            skipped: snapshot.skipped
        )
    }

    /// Disconnect, logout and instance switch use this. Only receipts in the
    /// journal for this scope are touched: foreign app entries, completed
    /// entries and other accounts stay intact.
    public func cleanup(
        scope: AccountScope,
        generation: UInt64
    ) async throws -> CleanupSummary {
        try requireCurrentGeneration(generation)
        var actual = try await readActual()
        let receipts = try await readReceipts(for: scope)
        var removed: [Int] = []
        var retained: [Int] = []

        for receipt in receipts.sorted(by: { $0.eventID < $1.eventID }) {
            try requireCurrentGeneration(generation)
            let outcome = try await removeOwnedEntry(
                receipt,
                actual: &actual,
                generation: generation
            )
            if outcome.confirmed {
                if outcome.removed {
                    removed.append(receipt.eventID)
                }
            } else {
                retained.append(receipt.eventID)
            }
        }

        return CleanupSummary(
            scope: scope,
            generation: generation,
            removedEventIDs: sortedUnique(removed),
            retainedEventIDs: sortedUnique(retained)
        )
    }

    // MARK: - Internals

    private struct RemovalOutcome {
        let confirmed: Bool
        let removed: Bool
        let completed: Bool
    }

    private func finishPendingCleanup(
        except scope: AccountScope,
        generation: UInt64
    ) async throws {
        let all = try await readAllReceipts()
        let pending = all.filter {
            $0.scope != scope && $0.pendingOperation == .remove
        }
        guard !pending.isEmpty else {
            return
        }
        var actual = try await readActual()
        for receipt in pending.sorted(by: {
            if $0.scope != $1.scope {
                return $0.scope.athleteId < $1.scope.athleteId
            }
            return $0.eventID < $1.eventID
        }) {
            try requireCurrentGeneration(generation)
            let outcome = try await removeOwnedEntry(
                receipt,
                actual: &actual,
                generation: generation
            )
            guard outcome.confirmed else {
                throw ScheduleReconcileError.pendingCleanup(
                    scope: receipt.scope,
                    eventID: receipt.eventID
                )
            }
        }
    }

    private func removeOwnedEntry(
        _ original: ScheduleReceipt,
        actual: inout [ScheduledWorkoutState],
        generation: UInt64
    ) async throws -> RemovalOutcome {
        var receipt = original
        if receipt.pendingOperation != .remove {
            receipt.pendingOperation = .remove
            receipt.pendingPreviousDate = nil
            try await saveReceipt(receipt, generation: generation)
        }

        let entries = actual.filter { $0.planID == receipt.planID }
        let nonComplete = entries.filter { !$0.isComplete }
        if nonComplete.isEmpty {
            // Nothing to remove. A completed entry is Apple history and stays.
            try await deleteReceipt(
                scope: receipt.scope,
                eventID: receipt.eventID,
                generation: generation
            )
            return RemovalOutcome(
                confirmed: true,
                removed: false,
                completed: !entries.isEmpty
            )
        }

        try requireCurrentGeneration(generation)
        do {
            try await store.remove(
                planID: receipt.planID,
                calendar: calendar
            )
        } catch {
            try rethrowFatal(error)
            return RemovalOutcome(
                confirmed: false,
                removed: false,
                completed: false
            )
        }

        do {
            actual = try await readActual()
        } catch {
            try rethrowFatal(error)
            return RemovalOutcome(
                confirmed: false,
                removed: false,
                completed: false
            )
        }

        let remaining = actual.filter {
            $0.planID == receipt.planID && !$0.isComplete
        }
        guard remaining.isEmpty else {
            // Apple did not apply the removal. Keep the pending receipt so a
            // later pass can finish it; no schedule is attempted on top.
            return RemovalOutcome(
                confirmed: false,
                removed: false,
                completed: false
            )
        }

        try await deleteReceipt(
            scope: receipt.scope,
            eventID: receipt.eventID,
            generation: generation
        )
        return RemovalOutcome(
            confirmed: true,
            removed: true,
            completed: false
        )
    }

    private func readActual() async throws -> [ScheduledWorkoutState] {
        do {
            return try await store.scheduledWorkouts(calendar: calendar)
        } catch let error as ScheduleStoreError {
            switch error {
            case .unauthorized:
                throw ScheduleReconcileError.schedulingDenied
            case .unsupportedDevice:
                throw ScheduleReconcileError.schedulingUnsupported
            case .unreadableScheduledWorkout:
                throw ScheduleReconcileError.storeUnavailable
            }
        } catch {
            throw ScheduleReconcileError.storeUnavailable
        }
    }

    private func readAllReceipts() async throws -> [ScheduleReceipt] {
        do {
            return try await journal.allReceipts()
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func readReceipts(for scope: AccountScope) async throws -> [ScheduleReceipt] {
        do {
            return try await journal.receipts(for: scope)
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func saveReceipt(
        _ receipt: ScheduleReceipt,
        generation: UInt64
    ) async throws {
        try requireCurrentGeneration(generation)
        do {
            try await journal.save(receipt)
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func deleteReceipt(
        scope: AccountScope,
        eventID: Int,
        generation: UInt64
    ) async throws {
        try requireCurrentGeneration(generation)
        do {
            try await journal.delete(scope: scope, eventID: eventID)
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func rethrowFatal(_ error: Error) throws {
        if let storeError = error as? ScheduleStoreError {
            switch storeError {
            case .unauthorized:
                throw ScheduleReconcileError.schedulingDenied
            case .unsupportedDevice:
                throw ScheduleReconcileError.schedulingUnsupported
            case .unreadableScheduledWorkout:
                return
            }
        }
        if let reconcileError = error as? ScheduleReconcileError {
            switch reconcileError {
            case .schedulingDenied, .schedulingUnsupported:
                throw reconcileError
            default:
                return
            }
        }
    }

    private func requireCurrentGeneration(_ generation: UInt64) throws {
        guard activeGeneration == generation else {
            throw ScheduleReconcileError.staleGeneration
        }
    }

    private func requireActive(
        _ generation: UInt64,
        scope: AccountScope
    ) throws {
        guard activeGeneration == generation, activeScope == scope else {
            throw ScheduleReconcileError.staleGeneration
        }
    }

    private func sortedUnique(_ values: [Int]) -> [Int] {
        Array(Set(values)).sorted()
    }

    private static func validate(_ snapshot: ScheduleSnapshot) throws {
        guard snapshot.window.start < snapshot.window.end else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        let owned = snapshot.ownedEventIds
        let ownedSet = Set(owned)
        guard ownedSet.count == owned.count else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        let completed = snapshot.completedEventIds
        guard Set(completed).count == completed.count,
              Set(completed).isSubset(of: ownedSet)
        else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        let skipped = snapshot.skipped.map(\.eventId)
        guard Set(skipped).count == skipped.count,
              Set(skipped).isSubset(of: ownedSet)
        else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        let candidates = snapshot.candidates.map(\.eventId)
        guard Set(candidates).count == candidates.count,
              Set(candidates).isSubset(of: ownedSet)
        else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        // A session cannot be both schedulable and skipped/completed.
        guard Set(candidates).isDisjoint(with: Set(completed)),
              Set(candidates).isDisjoint(with: Set(skipped))
        else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        for candidate in snapshot.candidates where
            candidate.startDate < snapshot.window.start
                || candidate.startDate >= snapshot.window.end {
            throw ScheduleReconcileError.invalidSnapshot
        }
    }
}
