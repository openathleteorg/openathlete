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
    /// The plan could not be built, so no native submission happened. This is
    /// safe to retry after the prescription/device changes.
    case planNotSubmitted
    /// Scheduling permission is not granted. Nothing may be read or written.
    case unauthorized
}

/// Fence checked by the native store after its last preflight await and
/// immediately before a native submission. `prepareSubmission` both checks the
/// account generation and durably marks the write as submitted, so an
/// invalidation during authorization or list reads cannot submit anything.
public struct ScheduleSubmissionFence: Sendable {
    private let checkClosure: @Sendable () async throws -> Void
    private let prepareClosure: @Sendable () async throws -> Void

    public init(
        check: @escaping @Sendable () async throws -> Void,
        prepareSubmission: @escaping @Sendable () async throws -> Void
    ) {
        self.checkClosure = check
        self.prepareClosure = prepareSubmission
    }

    public func check() async throws {
        try await checkClosure()
    }

    public func prepareSubmission() async throws {
        try await prepareClosure()
    }
}

/// The narrow WorkoutKit surface. `remove(planID:)` must never remove a
/// completed workout: Apple's completed entries are history, not ours to
/// delete.
public protocol ScheduleWorkoutStore: Sendable {
    func maximumScheduledWorkoutCount() async -> Int
    func scheduledWorkouts(calendar: Calendar) async throws -> [ScheduledWorkoutState]
    func schedule(
        _ request: ScheduleWorkoutRequest,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws
    func remove(
        planID: UUID,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws
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
    /// Truncate the absolute instant, not local calendar components. A DST
    /// fall-back repeats 01:30 locally; 05:30Z and 06:30Z are distinct instants
    /// and must stay distinct. Apple receives whole-second components, but the
    /// native conversion itself remains a separate device verification gate.
    public static func normalized(_ date: Date) -> Date {
        Date(
            timeIntervalSince1970: date.timeIntervalSince1970.rounded(.down)
        )
    }

    public static func areEqual(_ first: Date, _ second: Date) -> Bool {
        normalized(first) == normalized(second)
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
    /// The normalized date captured at the submission fence. Positive
    /// confirmation must match this, not a newer desired date.
    public var submittedDate: Date?
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
        submittedDate: Date? = nil,
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
        self.submittedDate = submittedDate
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
    /// A submitted write is not visible yet. Do not retry it with the same UUID
    /// or write other candidates until a positive read-back resolves it.
    case unresolvedWrite(scope: AccountScope, eventID: Int)
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

        var actual = try await readActual()
        let allReceipts = try await readAllReceipts()
        let receipts = allReceipts.filter { $0.scope == scope }
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

        // Persist completion observed in the initial scheduler read before any
        // native mutation. A later removal failure must not lose this history.
        for receipt in receipts where actual.contains(where: {
            $0.planID == receipt.planID && $0.isComplete
        }) {
            try await recordCompletion(
                scope: scope,
                eventID: receipt.eventID,
                planID: receipt.planID,
                at: snapshot.readAt,
                generation: generation
            )
            tombstonedEvents.insert(receipt.eventID)
        }

        let unresolvedReceipts = allReceipts
            .filter(isUnresolvedSubmitted)
            .sorted {
                if $0.scope != $1.scope {
                    return $0.scope.athleteId < $1.scope.athleteId
                }
                return $0.eventID < $1.eventID
            }

        // One prepass across every account: a submitted write is resolved only
        // by a positive read-back at the durable submitted date. A same-UUID
        // entry at another date is stale, not proof. Any unresolved write that
        // cannot be proven blocks every native mutation, including another
        // account's cleanup and this account's candidates.
        var blocked: (scope: AccountScope, eventID: Int)?
        var otherScopeCleanup: [ScheduleReceipt] = []

        for receipt in unresolvedReceipts {
            let submittedDate = confirmationDate(for: receipt)
            let entries = actual.filter { $0.planID == receipt.planID }
            let hasTarget = hasConfirmationEntry(
                entries,
                planID: receipt.planID,
                date: submittedDate,
                isComplete: false
            )
            let hasCompletedTarget = hasConfirmationEntry(
                entries,
                planID: receipt.planID,
                date: submittedDate,
                isComplete: true
            )
            let isCurrent = receipt.scope == scope
            let isCandidate = isCurrent
                && candidateByEvent[receipt.eventID] != nil
            let isRetryable = isCurrent
                && retryable.contains(receipt.eventID)

            if isCurrent {
                let isCalendarRemoval = !isRetryable
                    && (receipt.removalIntent == .calendar
                        || completed.contains(receipt.eventID)
                        || (!isCandidate && !isRetryable))
                if isCalendarRemoval, receipt.removalIntent == nil {
                    var updated = receipt
                    updated.removalIntent = .calendar
                    try await saveReceipt(updated, generation: generation)
                    receiptsByEvent[receipt.eventID] = updated
                }
                if !hasTarget && !hasCompletedTarget {
                    if blocked == nil {
                        blocked = (receipt.scope, receipt.eventID)
                    }
                }
            } else if receipt.removalIntent == .cleanup,
                      hasTarget || hasCompletedTarget {
                otherScopeCleanup.append(receipt)
            } else if blocked == nil {
                blocked = (receipt.scope, receipt.eventID)
            }
        }

        if let blocked {
            throw ScheduleReconcileError.unresolvedWrite(
                scope: blocked.scope,
                eventID: blocked.eventID
            )
        }

        // A previous account's explicit cleanup is the only unresolved write
        // that may drain across scopes. It must be visible at its submitted
        // date (or completed) before anything else mutates.
        for receipt in otherScopeCleanup {
            try requireCurrentGeneration(generation)
            let outcome = try await removeOwnedEntry(
                receipt,
                intent: .cleanup,
                completedAt: Date(),
                actual: &actual,
                generation: generation,
                fence: makeGenerationFence(generation: generation)
            )
            guard outcome.confirmed else {
                throw ScheduleReconcileError.unresolvedWrite(
                    scope: receipt.scope,
                    eventID: receipt.eventID
                )
            }
        }

        // Resolve this account's visible submitted writes before removals or
        // candidates. A retryable skip leaves a deferred calendar removal in
        // place; only explicit cleanup removes through it.
        for original in unresolvedReceipts where original.scope == scope {
            let eventID = original.eventID
            guard var receipt = receiptsByEvent[eventID] else {
                continue
            }
            let submittedDate = confirmationDate(for: receipt)
            let entries = actual.filter { $0.planID == receipt.planID }
            let hasTarget = hasConfirmationEntry(
                entries,
                planID: receipt.planID,
                date: submittedDate,
                isComplete: false
            )
            let hasCompletedTarget = hasConfirmationEntry(
                entries,
                planID: receipt.planID,
                date: submittedDate,
                isComplete: true
            )
            let isCandidate = candidateByEvent[eventID] != nil
            let isRetryable = retryable.contains(eventID)
            let wantsRemoval = receipt.removalIntent == .cleanup
                || (!isRetryable
                    && (receipt.removalIntent == .calendar
                        || completed.contains(eventID)
                        || (!isCandidate && !isRetryable)))

            if hasCompletedTarget {
                let outcome = try await removeOwnedEntry(
                    receipt,
                    intent: receipt.removalIntent ?? .calendar,
                    completedAt: snapshot.readAt,
                    actual: &actual,
                    generation: generation
                )
                guard outcome.confirmed else {
                    throw ScheduleReconcileError.unresolvedWrite(
                        scope: scope,
                        eventID: eventID
                    )
                }
                receiptsByEvent[eventID] = nil
                completedEventIDs.append(eventID)
                tombstonedEvents.insert(eventID)
                continue
            }

            guard hasTarget else {
                throw ScheduleReconcileError.unresolvedWrite(
                    scope: scope,
                    eventID: eventID
                )
            }

            if wantsRemoval {
                if receipt.removalIntent == nil {
                    receipt.removalIntent = .calendar
                    try await saveReceipt(receipt, generation: generation)
                    receiptsByEvent[eventID] = receipt
                }
                let outcome = try await removeOwnedEntry(
                    receipt,
                    intent: receipt.removalIntent ?? .calendar,
                    completedAt: snapshot.readAt,
                    actual: &actual,
                    generation: generation
                )
                guard outcome.confirmed else {
                    throw ScheduleReconcileError.unresolvedWrite(
                        scope: scope,
                        eventID: eventID
                    )
                }
                receiptsByEvent[eventID] = nil
                if outcome.removed {
                    removed.append(eventID)
                } else if outcome.completed {
                    completedEventIDs.append(eventID)
                    tombstonedEvents.insert(eventID)
                }
                continue
            }

            // Candidate (possibly edited) or a transient skip: positive
            // read-back resolves the submitted write. Keep any calendar removal
            // intent for a later complete snapshot.
            receipt.pendingOperation = nil
            receipt.pendingPhase = nil
            receipt.submittedDate = nil
            receipt.pendingPreviousDate = nil
            try await saveReceipt(receipt, generation: generation)
            receiptsByEvent[eventID] = receipt
            confirmed.append(eventID)
            if isRetryable {
                retained.append(eventID)
            }
        }

        // Unresolved submitted writes have now been reconciled (or the pass
        // already failed). Only now may another account's durable cleanup run.
        try await finishPendingCleanup(except: scope, generation: generation)
        actual = try await readActual()

        // Removals first: they free capacity and clean cancelled, completed or
        // newly unsupported sessions. A retryable read failure is not one of
        // these: it keeps both the receipt and the Apple entry. A pending
        // calendar removal likewise waits for a complete read.
        for receipt in receiptsByEvent.values.sorted(by: {
            $0.eventID < $1.eventID
        }) {
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
            let normalizedStart = ScheduleDate.normalized(candidate.startDate)
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
                if entries.contains(where: { !$0.isComplete }),
                   let receipt = existingReceipt {
                    // An incomplete copy shares a completed UUID. Remove it
                    // and retain the receipt until every copy is gone.
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
                } else if var receipt = existingReceipt {
                    receipt.pendingOperation = nil
                    receipt.pendingPhase = nil
                    receipt.submittedDate = nil
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
                ScheduleDate.areEqual($0.startDate, normalizedStart)
            }
            let staleEntries = entries.filter {
                !ScheduleDate.areEqual($0.startDate, normalizedStart)
            }
            let receiptDate = existingReceipt.map {
                ScheduleDate.normalized($0.scheduledDate)
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
                    cleared.submittedDate = nil
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
                        calendar: calendar,
                        fence: makeFence(
                            scope: scope,
                            generation: generation,
                            eventID: eventID
                        )
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
                    calendar: calendar,
                    fence: makeFence(
                        scope: scope,
                        generation: generation,
                        eventID: eventID
                    )
                )
            } catch {
                try rethrowFatal(error)
                try rethrowCancellation(error)
                if let stored = try? await readReceipt(
                    scope: scope,
                    eventID: eventID
                ), stored.pendingPhase == .confirming {
                    throw ScheduleReconcileError.unresolvedWrite(
                        scope: scope,
                        eventID: eventID
                    )
                }
                throw ScheduleReconcileError.storeUnavailable
            }

            // The write returned. Re-read the receipt saved by the submission
            // fence so its durable submitted date and metadata survive this
            // update. A store that did not mark the submission falls back to
            // the date it was asked to write.
            guard var confirmingReceipt = try await readReceipt(
                scope: scope,
                eventID: eventID
            ) else {
                throw ScheduleReconcileError.journalUnavailable
            }
            confirmingReceipt.pendingPhase = .confirming
            if confirmingReceipt.submittedDate == nil {
                confirmingReceipt.submittedDate = normalizedStart
            }
            try await saveReceipt(confirmingReceipt, generation: generation)
            receiptsByEvent[eventID] = confirmingReceipt

            do {
                actual = try await readActual()
            } catch {
                try rethrowFatal(error)
                try rethrowCancellation(error)
                throw ScheduleReconcileError.storeUnavailable
            }

            let submittedDate = confirmationDate(for: confirmingReceipt)
            let planEntries = actual.filter { $0.planID == planID }
            let hasCompletedTarget = hasConfirmationEntry(
                planEntries,
                planID: planID,
                date: submittedDate,
                isComplete: true
            )
            if hasCompletedTarget {
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

            if planEntries.contains(where: \.isComplete) {
                // A completion at another date is real history, but it does not
                // prove the submitted target landed. Record it and keep the
                // receipt's ownership unresolved.
                try await recordCompletion(
                    scope: scope,
                    eventID: eventID,
                    planID: planID,
                    at: snapshot.readAt,
                    generation: generation
                )
                tombstonedEvents.insert(eventID)
            }

            let isConfirmed = hasConfirmationEntry(
                planEntries,
                planID: planID,
                date: submittedDate,
                isComplete: false
            )
            guard isConfirmed else {
                pendingConfirmation.append(eventID)
                failed.append(eventID)
                throw ScheduleReconcileError.unresolvedWrite(
                    scope: scope,
                    eventID: eventID
                )
            }

            confirmingReceipt.pendingOperation = nil
            confirmingReceipt.pendingPhase = nil
            confirmingReceipt.submittedDate = nil
            confirmingReceipt.pendingPreviousDate = nil
            confirmingReceipt.removalIntent = nil
            try await saveReceipt(confirmingReceipt, generation: generation)
            receiptsByEvent[eventID] = confirmingReceipt
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
        try Task.checkCancellation()

        var receipts = try await readReceipts(for: scope).sorted {
            $0.eventID < $1.eventID
        }

        // Persist explicit cleanup authorization before the fallible scheduler
        // read. If the read fails and the account switches, another account may
        // finish only these durable intents; it never infers permission from an
        // absent or hidden entry.
        for index in receipts.indices {
            try requireActive(generation, scope: scope)
            var receipt = receipts[index]
            if isUnresolvedSubmitted(receipt) {
                guard receipt.removalIntent != .cleanup else {
                    continue
                }
                receipt.removalIntent = .cleanup
                try await saveReceipt(receipt, generation: generation)
                receipts[index] = receipt
            } else {
                guard receipt.pendingOperation != .remove
                    || receipt.removalIntent != .cleanup
                else {
                    continue
                }
                receipt.pendingOperation = .remove
                receipt.pendingPhase = nil
                receipt.submittedDate = nil
                receipt.pendingPreviousDate = nil
                receipt.removalIntent = .cleanup
                try await saveReceipt(receipt, generation: generation)
                receipts[index] = receipt
            }
        }

        var actual = try await readActual()
        var removed: [Int] = []
        var retained: [Int] = []

        for receipt in receipts {
            try requireActive(generation, scope: scope)
            try Task.checkCancellation()

            if isUnresolvedSubmitted(receipt) {
                // A submitted write may still be hidden. Only remove what Apple
                // positively shows at the submitted date.
                let current = receipt
                let entries = actual.filter {
                    $0.planID == current.planID
                }
                let submittedDate = confirmationDate(for: current)
                let hasTarget = hasConfirmationEntry(
                    entries,
                    planID: current.planID,
                    date: submittedDate,
                    isComplete: false
                )
                let hasCompletedTarget = hasConfirmationEntry(
                    entries,
                    planID: current.planID,
                    date: submittedDate,
                    isComplete: true
                )
                guard hasTarget || hasCompletedTarget else {
                    // UUID alone is not proof. A stale same-UUID copy at an old
                    // date must not clear the cleanup receipt.
                    retained.append(current.eventID)
                    continue
                }
                let outcome = try await removeOwnedEntry(
                    current,
                    intent: .cleanup,
                    completedAt: Date(),
                    actual: &actual,
                    generation: generation
                )
                if outcome.confirmed {
                    if outcome.removed {
                        removed.append(current.eventID)
                    }
                } else {
                    retained.append(current.eventID)
                }
                continue
            }

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

    private func isUnresolvedSubmitted(_ receipt: ScheduleReceipt) -> Bool {
        guard receipt.pendingOperation == .schedule
            || receipt.pendingOperation == .replace
        else {
            return false
        }
        return receipt.pendingPhase == .confirming
    }

    /// The identity of the entry a submission fence proved was attempted.
    private func confirmationDate(for receipt: ScheduleReceipt) -> Date {
        ScheduleDate.normalized(receipt.submittedDate ?? receipt.scheduledDate)
    }

    /// Confirmation matches plan UUID and date. A same-UUID entry at another
    /// date is stale history, not proof of this submission.
    private func hasConfirmationEntry(
        _ entries: [ScheduledWorkoutState],
        planID: UUID,
        date: Date,
        isComplete: Bool
    ) -> Bool {
        entries.contains {
            $0.planID == planID
                && $0.isComplete == isComplete
                && ScheduleDate.areEqual($0.startDate, date)
        }
    }

    private struct RemovalOutcome {
        let confirmed: Bool
        let removed: Bool
        let completed: Bool
    }

    private func makeFence(
        scope: AccountScope,
        generation: UInt64,
        eventID: Int
    ) -> ScheduleSubmissionFence {
        ScheduleSubmissionFence(
            check: { [self] in
                try await requireActive(generation, scope: scope)
            },
            prepareSubmission: { [self] in
                try await prepareSubmission(
                    scope: scope,
                    generation: generation,
                    eventID: eventID
                )
            }
        )
    }

    private func makeGenerationFence(
        generation: UInt64
    ) -> ScheduleSubmissionFence {
        ScheduleSubmissionFence(
            check: { [self] in
                try await requireCurrentGeneration(generation)
            },
            prepareSubmission: { [self] in
                try await requireCurrentGeneration(generation)
            }
        )
    }

    private func prepareSubmission(
        scope: AccountScope,
        generation: UInt64,
        eventID: Int
    ) async throws {
        try requireActive(generation, scope: scope)
        guard var receipt = try await readReceipt(
            scope: scope,
            eventID: eventID
        ) else {
            throw ScheduleReconcileError.journalUnavailable
        }
        try requireActive(generation, scope: scope)
        receipt.submittedDate = ScheduleDate.normalized(receipt.scheduledDate)
        receipt.pendingPhase = .confirming
        try await saveReceipt(receipt, generation: generation)

        // Invalidation can happen while `journal.save` is awaiting. Recheck
        // after it returns and immediately before the caller is allowed to
        // submit natively. In a live process this proves no submission; a crash
        // between the save and this check remains ambiguous and stays blocked.
        do {
            try requireActive(generation, scope: scope)
        } catch {
            receipt.pendingPhase = .writing
            receipt.submittedDate = nil
            // Journal durability is not a native submission; record the proven
            // no-submit state even though the account generation is fenced.
            try? await journal.save(receipt)
            throw error
        }
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
                generation: generation,
                fence: makeGenerationFence(generation: generation)
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
        generation: UInt64,
        fence: ScheduleSubmissionFence? = nil
    ) async throws -> RemovalOutcome {
        let submissionFence = fence ?? makeFence(
            scope: original.scope,
            generation: generation,
            eventID: original.eventID
        )
        var receipt = original
        if receipt.pendingOperation != .remove {
            receipt.pendingOperation = .remove
            receipt.pendingPhase = nil
            receipt.submittedDate = nil
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

        if entries.contains(where: \.isComplete) {
            // A completed copy is Apple history. Persist it before mutating an
            // incomplete sibling; the removal read-back may lose that history.
            try await recordCompletion(
                scope: receipt.scope,
                eventID: receipt.eventID,
                planID: receipt.planID,
                at: completedAt,
                generation: generation
            )
        }

        try requireCurrentGeneration(generation)
        try Task.checkCancellation()
        do {
            try await store.remove(
                planID: receipt.planID,
                calendar: calendar,
                fence: submissionFence
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

        let hasCompletedCopy = actual.contains(where: {
            $0.planID == receipt.planID && $0.isComplete
        })
        if hasCompletedCopy {
            // Completion was observed during the removal read-back. Persist it
            // before the remaining-copy guard so a later failure cannot lose
            // this history.
            try await recordCompletion(
                scope: receipt.scope,
                eventID: receipt.eventID,
                planID: receipt.planID,
                at: completedAt,
                generation: generation
            )
        }

        let remaining = actual.filter {
            $0.planID == receipt.planID && !$0.isComplete
        }
        guard remaining.isEmpty else {
            // Apple did not apply the removal, or another incomplete copy
            // sharing this UUID survived. Keep the receipt until every
            // incomplete copy is confirmed gone, even if a completed copy is
            // also visible.
            return RemovalOutcome(
                confirmed: false,
                removed: false,
                completed: false
            )
        }

        if hasCompletedCopy {
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
            case .unreadableScheduledWorkout, .planNotSubmitted:
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

    private func readReceipt(
        scope: AccountScope,
        eventID: Int
    ) async throws -> ScheduleReceipt? {
        do {
            return try await journal.receipt(scope: scope, eventID: eventID)
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
            case .unreadableScheduledWorkout, .planNotSubmitted:
                return
            }
        }
        if let reconcileError = error as? ScheduleReconcileError {
            switch reconcileError {
            case .schedulingDenied,
                 .schedulingUnsupported,
                 .staleGeneration,
                 .staleSnapshot,
                 .journalUnavailable,
                 .pendingCleanup,
                 .unresolvedWrite:
                throw reconcileError
            case .scopeMismatch, .invalidSnapshot, .storeUnavailable:
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
