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

/// Why a removal is pending. Only an explicit cleanup may be replayed for a
/// different account; calendar reconciliation never crosses scopes by itself.
public enum ScheduleRemovalIntent: String, Codable, Equatable, Sendable {
    case calendar
    case cleanup
}

/// Durable phase of an in-flight schedule/replace. Confirmation is a separate
/// phase so a successful write whose read-back was interrupted is not removed
/// and rewritten on the next pass.
public enum SchedulePhase: String, Codable, Equatable, Sendable {
    /// Old entries must be removed before the write.
    case removing
    /// The write has been persisted as pending but is not known to have landed.
    case writing
    /// The write returned; only an Apple read-back is still required.
    case confirming
}

/// A completed Apple session that must never be scheduled again for this
/// account, even if the event disappears and later recurs in the calendar.
public struct ScheduleCompletionTombstone: Codable, Equatable, Sendable {
    public let scope: AccountScope
    public let eventID: Int
    public let planID: UUID?
    public let recordedAt: Date

    public init(
        scope: AccountScope,
        eventID: Int,
        planID: UUID?,
        recordedAt: Date
    ) {
        self.scope = scope
        self.eventID = eventID
        self.planID = planID
        self.recordedAt = recordedAt
    }
}

/// Apple's `ScheduledWorkoutPlan.date` is second-precision `DateComponents`.
/// Receipts, writes and read-backs use the same truncation to whole seconds so
/// `12:00:00.500` is not mistaken for a different workout on every pass.
public enum ScheduleDate {
    public static func normalized(_ date: Date, calendar: Calendar) -> Date {
        let components = calendar.dateComponents(
            [.year, .month, .day, .hour, .minute, .second],
            from: date
        )
        return calendar.date(from: components) ?? date
    }

    public static func areEqual(
        _ first: Date,
        _ second: Date,
        calendar: Calendar
    ) -> Bool {
        normalized(first, calendar: calendar)
            == normalized(second, calendar: calendar)
    }
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
    /// Durable step inside a schedule/replace operation.
    public var pendingPhase: SchedulePhase?
    /// Set when `pendingOperation == .remove`.
    public var removalIntent: ScheduleRemovalIntent?

    public init(
        scope: AccountScope,
        eventID: Int,
        planID: UUID,
        scheduledDate: Date,
        fingerprint: String,
        pendingOperation: ScheduleOperation? = nil,
        pendingPreviousDate: Date? = nil,
        pendingPhase: SchedulePhase? = nil,
        removalIntent: ScheduleRemovalIntent? = nil
    ) {
        self.scope = scope
        self.eventID = eventID
        self.planID = planID
        self.scheduledDate = scheduledDate
        self.fingerprint = fingerprint
        self.pendingOperation = pendingOperation
        self.pendingPreviousDate = pendingPreviousDate
        self.pendingPhase = pendingPhase
        self.removalIntent = removalIntent
    }
}

public protocol ScheduleJournal: Sendable {
    func allReceipts() async throws -> [ScheduleReceipt]
    func receipts(for scope: AccountScope) async throws -> [ScheduleReceipt]
    func receipt(scope: AccountScope, eventID: Int) async throws -> ScheduleReceipt?
    func save(_ receipt: ScheduleReceipt) async throws
    func delete(scope: AccountScope, eventID: Int) async throws
    func completionTombstones(
        for scope: AccountScope
    ) async throws -> [ScheduleCompletionTombstone]
    func completionTombstone(
        scope: AccountScope,
        eventID: Int
    ) async throws -> ScheduleCompletionTombstone?
    func saveCompletionTombstone(
        _ tombstone: ScheduleCompletionTombstone
    ) async throws
}

/// Foundation-only journal for the app. Writes are atomic, so a crash leaves
/// either the previous document or the next one, never a half-written receipt.
public actor FileScheduleJournal: ScheduleJournal {
    private struct Document: Codable {
        var receipts: [ScheduleReceipt] = []
        var tombstones: [ScheduleCompletionTombstone] = []

        private enum CodingKeys: String, CodingKey {
            case receipts
            case tombstones
        }

        init() {}

        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            receipts = try container.decodeIfPresent(
                [ScheduleReceipt].self,
                forKey: .receipts
            ) ?? []
            tombstones = try container.decodeIfPresent(
                [ScheduleCompletionTombstone].self,
                forKey: .tombstones
            ) ?? []
        }
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

    public func completionTombstones(
        for scope: AccountScope
    ) async throws -> [ScheduleCompletionTombstone] {
        try load().tombstones
            .filter { $0.scope == scope }
            .sorted { $0.eventID < $1.eventID }
    }

    public func completionTombstone(
        scope: AccountScope,
        eventID: Int
    ) async throws -> ScheduleCompletionTombstone? {
        try load().tombstones.first {
            $0.scope == scope && $0.eventID == eventID
        }
    }

    public func saveCompletionTombstone(
        _ tombstone: ScheduleCompletionTombstone
    ) async throws {
        var document = try load()
        if let index = document.tombstones.firstIndex(where: {
            $0.scope == tombstone.scope && $0.eventID == tombstone.eventID
        }) {
            document.tombstones[index] = tombstone
        } else {
            document.tombstones.append(tombstone)
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
    /// Reserved for a partial pass: today an unobserved write fails the pass
    /// closed and leaves the journal pending, so this stays empty.
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
    /// A same-generation snapshot is older than the last one applied.
    case staleSnapshot
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
    private struct PassKey: Hashable {
        let scope: AccountScope
        let generation: UInt64
    }

    private let store: any ScheduleWorkoutStore
    private let journal: any ScheduleJournal
    private let calendar: Calendar
    private var activeGeneration: UInt64?
    private var activeScope: AccountScope?
    private var lastAppliedReadAt: [PassKey: Date] = [:]
    private var passIsRunning = false
    private var passWaiters: [CheckedContinuation<Void, Never>] = []

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
    /// Waits for an in-flight pass, including a mutation already started.
    public func activate(generation: UInt64, for scope: AccountScope) async {
        await acquirePass()
        activeGeneration = generation
        activeScope = scope
        releasePass()
    }

    /// Called on logout, disconnect or instance switch before credentials are
    /// discarded. The generation fence is removed immediately so a running
    /// pass cannot start another write; the call then waits for the pass to
    /// drain before returning.
    public func invalidate() async {
        activeGeneration = nil
        await acquirePass()
        activeScope = nil
        lastAppliedReadAt.removeAll()
        releasePass()
    }

    public func isActive(generation: UInt64, for scope: AccountScope) -> Bool {
        activeGeneration == generation && activeScope == scope
    }

    public func reconcile(
        _ snapshot: ScheduleSnapshot,
        scope: AccountScope,
        generation: UInt64
    ) async throws -> SyncSummary {
        // One pass at a time, including cleanup. Actor reentrancy must never let
        // two passes allocate different UUIDs for the same event or let a late
        // logout response write after the account changed.
        await acquirePass()
        defer { releasePass() }

        guard snapshot.scope == scope else {
            throw ScheduleReconcileError.scopeMismatch
        }
        try Self.validate(snapshot)
        try requireActive(generation, scope: scope)
        try Task.checkCancellation()
        // Reject a same-generation snapshot older than the last applied one
        // before pending cleanup or any Apple mutation.
        try validateFreshness(snapshot, scope: scope, generation: generation)

        // A previous account's explicit cleanup must finish before this
        // account is scheduled. Only durable `.cleanup` intent crosses scopes.
        try await finishPendingCleanup(except: scope, generation: generation)

        var actual = try await readActual()
        let receipts = try await readReceipts(for: scope)
        var receiptsByEvent = Dictionary(
            uniqueKeysWithValues: receipts.map { ($0.eventID, $0) }
        )
        let tombstones = try await readTombstones(for: scope)
        var tombstonedEvents = Set(tombstones.map(\.eventID))

        // An OpenAthlete completion is durable before any Apple mutation. It
        // also covers a session that disappears and later recurs.
        for eventID in snapshot.completedEventIds {
            let planID = receiptsByEvent[eventID]?.planID
            try await recordCompletion(
                scope: scope,
                eventID: eventID,
                planID: planID,
                at: snapshot.readAt,
                generation: generation
            )
            tombstonedEvents.insert(eventID)
        }
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
        // these: it keeps both the receipt and the Apple entry. A pending
        // calendar removal likewise waits for a complete read.
        for receipt in receipts.sorted(by: { $0.eventID < $1.eventID }) {
            let eventID = receipt.eventID
            let isCandidate = candidateByEvent[eventID] != nil

            if receipt.pendingOperation == .remove {
                let hasCompletedEntry = actual.contains(where: {
                    $0.planID == receipt.planID && $0.isComplete
                })
                // A completed Apple entry is history. If the event came back
                // in the calendar, keep the receipt and its plan ID so the
                // scheduling pass sees completion and writes no duplicate.
                if isCandidate && hasCompletedEntry {
                    continue
                }
                if !isCandidate && hasCompletedEntry {
                    let outcome = try await removeOwnedEntry(
                        receipt,
                        intent: receipt.removalIntent ?? .calendar,
                        completedAt: snapshot.readAt,
                        actual: &actual,
                        generation: generation
                    )
                    guard outcome.confirmed else {
                        throw ScheduleReconcileError.storeUnavailable
                    }
                    receiptsByEvent[eventID] = nil
                    completedEventIDs.append(eventID)
                    tombstonedEvents.insert(eventID)
                    continue
                }
                if retryable.contains(eventID) {
                    retained.append(eventID)
                    continue
                }
                let outcome = try await removeOwnedEntry(
                    receipt,
                    intent: receipt.removalIntent ?? .calendar,
                    completedAt: snapshot.readAt,
                    actual: &actual,
                    generation: generation
                )
                if outcome.confirmed {
                    receiptsByEvent[eventID] = nil
                    if outcome.removed {
                        removed.append(eventID)
                    } else if outcome.completed {
                        completedEventIDs.append(eventID)
                        tombstonedEvents.insert(eventID)
                    }
                } else {
                    // Fail closed: an unconfirmed removal must not be followed
                    // by another write at a capacity we cannot verify.
                    throw ScheduleReconcileError.storeUnavailable
                }
                continue
            }

            if isCandidate {
                continue
            }
            if actual.contains(where: {
                $0.planID == receipt.planID && $0.isComplete
            }) {
                // Completion is known even while a detail/zone read is
                // transient: persist it and never reschedule the event.
                let outcome = try await removeOwnedEntry(
                    receipt,
                    intent: .calendar,
                    completedAt: snapshot.readAt,
                    actual: &actual,
                    generation: generation
                )
                guard outcome.confirmed else {
                    throw ScheduleReconcileError.storeUnavailable
                }
                receiptsByEvent[eventID] = nil
                completedEventIDs.append(eventID)
                tombstonedEvents.insert(eventID)
                continue
            }
            if retryable.contains(eventID) {
                retained.append(eventID)
                continue
            }

            // Cancelled, out of window, already completed, or a confirmed
            // unsupported prescription. Any of those supersedes the entry this
            // integration scheduled before.
            let outcome = try await removeOwnedEntry(
                receipt,
                intent: .calendar,
                completedAt: snapshot.readAt,
                actual: &actual,
                generation: generation
            )
            if outcome.confirmed {
                receiptsByEvent[eventID] = nil
                if outcome.removed {
                    removed.append(eventID)
                } else if outcome.completed {
                    completedEventIDs.append(eventID)
                    tombstonedEvents.insert(eventID)
                }
            } else {
                throw ScheduleReconcileError.storeUnavailable
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
            try Task.checkCancellation()
            let eventID = candidate.eventId
            let normalizedStart = ScheduleDate.normalized(
                candidate.startDate,
                calendar: calendar
            )
            let fingerprint = PrescriptionFingerprint.make(candidate.plan)

            if tombstonedEvents.contains(eventID) {
                if let receipt = receiptsByEvent[eventID] {
                    let outcome = try await removeOwnedEntry(
                        receipt,
                        intent: .calendar,
                        completedAt: snapshot.readAt,
                        actual: &actual,
                        generation: generation
                    )
                    if !outcome.confirmed {
                        throw ScheduleReconcileError.storeUnavailable
                    }
                    receiptsByEvent[eventID] = nil
                }
                completedEventIDs.append(eventID)
                continue
            }

            var existingReceipt = receiptsByEvent[eventID]
            let planID = existingReceipt?.planID ?? UUID()
            let entries = actual.filter { $0.planID == planID }

            if entries.contains(where: \.isComplete) {
                // Apple already reports this session done. Never remove or
                // reschedule it, even if the calendar has not caught up.
                try await recordCompletion(
                    scope: scope,
                    eventID: eventID,
                    planID: planID,
                    at: snapshot.readAt,
                    generation: generation
                )
                if var receipt = existingReceipt {
                    receipt.pendingOperation = nil
                    receipt.pendingPhase = nil
                    receipt.pendingPreviousDate = nil
                    receipt.removalIntent = nil
                    try await saveReceipt(receipt, generation: generation)
                    receiptsByEvent[eventID] = receipt
                    existingReceipt = receipt
                }
                completedEventIDs.append(eventID)
                tombstonedEvents.insert(eventID)
                continue
            }

            let targetEntries = entries.filter {
                ScheduleDate.areEqual(
                    $0.startDate,
                    normalizedStart,
                    calendar: calendar
                )
            }
            let staleEntries = entries.filter {
                !ScheduleDate.areEqual(
                    $0.startDate,
                    normalizedStart,
                    calendar: calendar
                )
            }
            let receiptDate = existingReceipt.map {
                ScheduleDate.normalized($0.scheduledDate, calendar: calendar)
            }
            let needsReplacement = existingReceipt.map {
                $0.fingerprint != fingerprint
                    || receiptDate != normalizedStart
            } ?? false

            if let receipt = existingReceipt,
               let operation = receipt.pendingOperation,
               operation != .remove {
                // A visible target after an interrupted write is proof enough:
                // confirm it without another remove or schedule — but only if
                // the calendar still wants the same prescription and date.
                if !needsReplacement,
                   targetEntries.count == 1,
                   staleEntries.isEmpty,
                   receipt.pendingPhase == .writing
                    || receipt.pendingPhase == .confirming {
                    var cleared = receipt
                    cleared.pendingOperation = nil
                    cleared.pendingPhase = nil
                    cleared.pendingPreviousDate = nil
                    cleared.removalIntent = nil
                    cleared.scheduledDate = normalizedStart
                    try await saveReceipt(cleared, generation: generation)
                    receiptsByEvent[eventID] = cleared
                    confirmed.append(eventID)
                    unchanged.append(eventID)
                    continue
                }
                if !needsReplacement,
                   receipt.pendingPhase == .confirming {
                    // The write returned but Apple does not show the target.
                    // Do not reschedule blindly; keep the intent and fail the
                    // pass so no later candidate writes at stale capacity.
                    pendingConfirmation.append(eventID)
                    failed.append(eventID)
                    throw ScheduleReconcileError.storeUnavailable
                }
            }

            if let receipt = existingReceipt,
               receipt.pendingOperation == nil,
               !needsReplacement,
               targetEntries.count == 1,
               staleEntries.isEmpty {
                if receipt.scheduledDate != normalizedStart {
                    // Migrate a receipt written before second precision was
                    // applied; this is journal-only, not an Apple write.
                    var normalizedReceipt = receipt
                    normalizedReceipt.scheduledDate = normalizedStart
                    try await saveReceipt(
                        normalizedReceipt,
                        generation: generation
                    )
                    receiptsByEvent[eventID] = normalizedReceipt
                }
                unchanged.append(eventID)
                continue
            }

            let operation: ScheduleOperation
            var phase: SchedulePhase
            if let receipt = existingReceipt {
                if needsReplacement {
                    operation = .replace
                    phase = (targetEntries.isEmpty && staleEntries.isEmpty)
                        ? .writing
                        : .removing
                } else if receipt.pendingOperation == .replace {
                    operation = .replace
                    phase = receipt.pendingPhase ?? .removing
                    if phase == .writing
                        && (!staleEntries.isEmpty || targetEntries.count > 1) {
                        phase = .removing
                    }
                    if phase == .confirming {
                        phase = .removing
                    }
                } else if receipt.pendingOperation == .schedule {
                    operation = .schedule
                    phase = staleEntries.isEmpty && targetEntries.count <= 1
                        ? .writing
                        : .removing
                } else if !staleEntries.isEmpty
                            || targetEntries.count > 1
                            || targetEntries.isEmpty {
                    operation = .replace
                    phase = (targetEntries.isEmpty && staleEntries.isEmpty)
                        ? .writing
                        : .removing
                } else {
                    operation = .schedule
                    phase = .writing
                }
            } else {
                operation = .schedule
                phase = .writing
            }

            let hadUsableEntry = entries.contains { !$0.isComplete }
            if phase == .writing
                && !hadUsableEntry
                && actual.count >= capacity {
                overflow.append(eventID)
                continue
            }
            if phase == .removing
                && !hadUsableEntry
                && actual.count >= capacity {
                overflow.append(eventID)
                continue
            }

            var receipt = existingReceipt ?? ScheduleReceipt(
                scope: scope,
                eventID: eventID,
                planID: planID,
                scheduledDate: normalizedStart,
                fingerprint: fingerprint
            )
            receipt.scheduledDate = normalizedStart
            receipt.fingerprint = fingerprint
            receipt.pendingOperation = operation
            receipt.pendingPhase = phase
            receipt.pendingPreviousDate = operation == .replace
                ? (existingReceipt?.pendingPreviousDate
                    ?? existingReceipt?.scheduledDate)
                : nil
            receipt.removalIntent = nil
            // Persist the stable plan ID and pending operation before the
            // first Apple write. A crash after this point replays the record.
            try await saveReceipt(receipt, generation: generation)
            receiptsByEvent[eventID] = receipt

            if phase == .removing {
                try requireActive(generation, scope: scope)
                try Task.checkCancellation()
                do {
                    try await store.remove(
                        planID: planID,
                        calendar: calendar
                    )
                } catch {
                    try rethrowFatal(error)
                    try rethrowCancellation(error)
                    throw ScheduleReconcileError.storeUnavailable
                }
                do {
                    actual = try await readActual()
                } catch {
                    try rethrowFatal(error)
                    try rethrowCancellation(error)
                    throw ScheduleReconcileError.storeUnavailable
                }
                if actual.contains(where: {
                    $0.planID == planID && $0.isComplete
                }) {
                    try await recordCompletion(
                        scope: scope,
                        eventID: eventID,
                        planID: planID,
                        at: snapshot.readAt,
                        generation: generation
                    )
                    try await deleteReceipt(
                        scope: scope,
                        eventID: eventID,
                        generation: generation
                    )
                    receiptsByEvent[eventID] = nil
                    completedEventIDs.append(eventID)
                    tombstonedEvents.insert(eventID)
                    continue
                }
                let remaining = actual.filter {
                    $0.planID == planID && !$0.isComplete
                }
                guard remaining.isEmpty else {
                    // The old entry is still visible. Fail closed rather than
                    // scheduling a second entry.
                    throw ScheduleReconcileError.storeUnavailable
                }
                receipt.pendingPhase = .writing
                try await saveReceipt(receipt, generation: generation)
                receiptsByEvent[eventID] = receipt
            }

            try requireActive(generation, scope: scope)
            try Task.checkCancellation()
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
                        startDate: normalizedStart
                    ),
                    calendar: calendar
                )
            } catch {
                try rethrowFatal(error)
                try rethrowCancellation(error)
                throw ScheduleReconcileError.storeUnavailable
            }

            // The write returned. Record the confirm phase before reading so a
            // retry after an interrupted confirmation performs no mutation.
            receipt.pendingPhase = .confirming
            try await saveReceipt(receipt, generation: generation)
            receiptsByEvent[eventID] = receipt

            do {
                actual = try await readActual()
            } catch {
                try rethrowFatal(error)
                try rethrowCancellation(error)
                throw ScheduleReconcileError.storeUnavailable
            }

            if actual.contains(where: {
                $0.planID == planID && $0.isComplete
            }) {
                try await recordCompletion(
                    scope: scope,
                    eventID: eventID,
                    planID: planID,
                    at: snapshot.readAt,
                    generation: generation
                )
                try await deleteReceipt(
                    scope: scope,
                    eventID: eventID,
                    generation: generation
                )
                receiptsByEvent[eventID] = nil
                completedEventIDs.append(eventID)
                tombstonedEvents.insert(eventID)
                continue
            }

            let isConfirmed = actual.contains {
                $0.planID == planID
                    && !$0.isComplete
                    && ScheduleDate.areEqual(
                        $0.startDate,
                        normalizedStart,
                        calendar: calendar
                    )
            }
            guard isConfirmed else {
                pendingConfirmation.append(eventID)
                failed.append(eventID)
                throw ScheduleReconcileError.storeUnavailable
            }

            receipt.pendingOperation = nil
            receipt.pendingPhase = nil
            receipt.pendingPreviousDate = nil
            receipt.removalIntent = nil
            try await saveReceipt(receipt, generation: generation)
            receiptsByEvent[eventID] = receipt
            if operation == .replace && hadUsableEntry {
                replaced.append(eventID)
            } else {
                scheduled.append(eventID)
            }
            confirmed.append(eventID)
        }

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
    /// entries and other accounts stay intact. It waits for any running pass
    /// and rejects a generation/scope other than the active one.
    public func cleanup(
        scope: AccountScope,
        generation: UInt64
    ) async throws -> CleanupSummary {
        await acquirePass()
        defer { releasePass() }

        guard activeScope == scope else {
            throw ScheduleReconcileError.scopeMismatch
        }
        try requireActive(generation, scope: scope)
        var actual = try await readActual()
        let receipts = try await readReceipts(for: scope)
        var removed: [Int] = []
        var retained: [Int] = []

        for receipt in receipts.sorted(by: { $0.eventID < $1.eventID }) {
            try requireActive(generation, scope: scope)
            try Task.checkCancellation()
            let outcome = try await removeOwnedEntry(
                receipt,
                intent: .cleanup,
                completedAt: Date(),
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

    private func acquirePass() async {
        if !passIsRunning {
            passIsRunning = true
            return
        }
        await withCheckedContinuation { continuation in
            passWaiters.append(continuation)
        }
    }

    private func releasePass() {
        if passWaiters.isEmpty {
            passIsRunning = false
        } else {
            passWaiters.removeFirst().resume()
        }
    }

    private func validateFreshness(
        _ snapshot: ScheduleSnapshot,
        scope: AccountScope,
        generation: UInt64
    ) throws {
        let key = PassKey(scope: scope, generation: generation)
        if let last = lastAppliedReadAt[key], snapshot.readAt < last {
            throw ScheduleReconcileError.staleSnapshot
        }
        if let last = lastAppliedReadAt[key] {
            lastAppliedReadAt[key] = max(last, snapshot.readAt)
        } else {
            lastAppliedReadAt[key] = snapshot.readAt
        }
    }

    private func finishPendingCleanup(
        except scope: AccountScope,
        generation: UInt64
    ) async throws {
        let all = try await readAllReceipts()
        let pending = all.filter {
            $0.scope != scope
                && $0.pendingOperation == .remove
                && $0.removalIntent == .cleanup
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
            try Task.checkCancellation()
            let outcome = try await removeOwnedEntry(
                receipt,
                intent: .cleanup,
                completedAt: Date(),
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
        intent: ScheduleRemovalIntent,
        completedAt: Date,
        actual: inout [ScheduledWorkoutState],
        generation: UInt64
    ) async throws -> RemovalOutcome {
        var receipt = original
        if receipt.pendingOperation != .remove {
            receipt.pendingOperation = .remove
            receipt.pendingPhase = nil
            receipt.pendingPreviousDate = nil
            receipt.removalIntent = intent
            try await saveReceipt(receipt, generation: generation)
        } else if intent == .cleanup && receipt.removalIntent != .cleanup {
            // Explicit cleanup upgrades a calendar intent before crossing an
            // account boundary.
            receipt.removalIntent = .cleanup
            try await saveReceipt(receipt, generation: generation)
        }

        let entries = actual.filter { $0.planID == receipt.planID }
        let nonComplete = entries.filter { !$0.isComplete }
        if nonComplete.isEmpty {
            if !entries.isEmpty {
                // A completed entry is Apple history and stays. The durable
                // tombstone prevents a later recurring event from rescheduling.
                try await recordCompletion(
                    scope: receipt.scope,
                    eventID: receipt.eventID,
                    planID: receipt.planID,
                    at: completedAt,
                    generation: generation
                )
            }
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
        try Task.checkCancellation()
        do {
            try await store.remove(
                planID: receipt.planID,
                calendar: calendar
            )
        } catch {
            try rethrowFatal(error)
            try rethrowCancellation(error)
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
            try rethrowCancellation(error)
            return RemovalOutcome(
                confirmed: false,
                removed: false,
                completed: false
            )
        }

        if !entries.isEmpty,
           actual.contains(where: {
               $0.planID == receipt.planID && $0.isComplete
           }) {
            // Completion raced the removal. Persist the tombstone before
            // deleting the receipt so the event can never be rescheduled.
            try await recordCompletion(
                scope: receipt.scope,
                eventID: receipt.eventID,
                planID: receipt.planID,
                at: completedAt,
                generation: generation
            )
            try await deleteReceipt(
                scope: receipt.scope,
                eventID: receipt.eventID,
                generation: generation
            )
            return RemovalOutcome(
                confirmed: true,
                removed: false,
                completed: true
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
        } catch is CancellationError {
            throw CancellationError()
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
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func readReceipts(for scope: AccountScope) async throws -> [ScheduleReceipt] {
        do {
            return try await journal.receipts(for: scope)
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func readTombstones(
        for scope: AccountScope
    ) async throws -> [ScheduleCompletionTombstone] {
        do {
            return try await journal.completionTombstones(for: scope)
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func recordCompletion(
        scope: AccountScope,
        eventID: Int,
        planID: UUID?,
        at date: Date,
        generation: UInt64
    ) async throws {
        try requireCurrentGeneration(generation)
        do {
            try await journal.saveCompletionTombstone(
                ScheduleCompletionTombstone(
                    scope: scope,
                    eventID: eventID,
                    planID: planID,
                    recordedAt: date
                )
            )
        } catch is CancellationError {
            throw CancellationError()
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
        } catch is CancellationError {
            throw CancellationError()
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
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            throw ScheduleReconcileError.journalUnavailable
        }
    }

    private func rethrowCancellation(_ error: Error) throws {
        if error is CancellationError {
            throw CancellationError()
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
              Set(candidates).isDisjoint(with: Set(skipped)),
              Set(completed).isDisjoint(with: Set(skipped))
        else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        // Every owned ID must have exactly one disposition: candidate,
        // completed, or skipped. A malformed/truncated snapshot must not become
        // an authoritative keep/remove set.
        let dispositions = Set(candidates)
            .union(Set(completed))
            .union(Set(skipped))
        guard dispositions == ownedSet else {
            throw ScheduleReconcileError.invalidSnapshot
        }

        for candidate in snapshot.candidates where
            candidate.startDate < snapshot.window.start
                || candidate.startDate >= snapshot.window.end {
            throw ScheduleReconcileError.invalidSnapshot
        }
    }
}
