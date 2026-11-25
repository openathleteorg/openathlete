import Foundation

// MARK: - Credentials

/// The token and the account/instance it was minted for. Keeping the scope on
/// the credential means a token can never be replayed against another
/// instance, even if a provider keeps one around after a switch.
///
/// There is deliberately no refresh token here: the app's auth store owns
/// rotation, and native background work may only use the current access token
/// until it expires.
public struct WatchScheduleCredential: Equatable, Sendable {
    public let scope: AccountScope
    public let accessToken: String
    public let expiresAt: Date?

    public init(scope: AccountScope, accessToken: String, expiresAt: Date?) {
        self.scope = scope
        self.accessToken = accessToken
        self.expiresAt = expiresAt
    }
}

public protocol WatchScheduleCredentialProviding: Sendable {
    /// Returns a fresh token for this exact scope, or nil when the session is
    /// no longer authenticated. Never reuse an old account's token.
    func credential(
        for scope: AccountScope
    ) async throws -> WatchScheduleCredential?
}

/// Durable storage for exactly one access credential. The app implements it
/// with a device-protected Keychain item (`ThisDeviceOnly`), so another device
/// cannot restore the token from a backup.
public protocol WatchScheduleCredentialVault: Sendable {
    func load() async throws -> WatchScheduleCredential?
    func save(_ credential: WatchScheduleCredential) async throws
    func purge() async throws
}

/// Remembers that the athlete enabled scheduling for one exact account. It is
/// not a credential: it lets a background launch know there is work to do.
public protocol WatchScheduleOptInStore: Sendable {
    func load() async throws -> AccountScope?
    func save(_ scope: AccountScope) async throws
    func clear() async throws
}

/// Apple's scheduling permission, as WorkoutKit reports it. `.restricted` is
/// folded into `.denied`: the user cannot grant it here.
public enum WatchSchedulePermission: String, Equatable, Sendable {
    case notDetermined
    case denied
    case authorized
    case unsupported
}

public protocol WatchScheduleAuthorizing: Sendable {
    func permission() async -> WatchSchedulePermission
    /// WorkoutKit shows its own permission sheet; the result is authoritative.
    func requestPermission() async -> WatchSchedulePermission
}

// MARK: - Requests and results

/// Why a pass runs. `background` may only use a stored credential and never
/// performs sign-in work on the athlete's behalf.
public enum WatchScheduleTrigger: String, Equatable, Sendable {
    case connect
    case launch
    case resume
    case calendar
    case zones
    case manual
    case background
}

public enum WatchScheduleDeferral: Equatable, Sendable {
    /// No opt-in, or a disconnect won the race.
    case inactive
    case unsupportedDevice
    case permissionNotDetermined
    case permissionDenied
    /// Foreground needs a credential from the app session.
    case credentialRequired
    /// The access token expired; only a foreground refresh can renew it.
    case credentialExpired
    case scopeMismatch
}

public enum WatchScheduleOutcome: Equatable, Sendable {
    case synced(SyncSummary)
    case deferred(WatchScheduleDeferral)
    /// A retryable failure, with a stable code for the settings UI.
    case failed(String)
}

public struct WatchScheduleCounts: Equatable, Sendable {
    public let scheduled: Int
    public let confirmed: Int
    public let unchanged: Int
    public let replaced: Int
    public let removed: Int
    public let completed: Int
    public let retained: Int
    public let overflow: Int
    public let failed: Int

    public init(
        scheduled: Int,
        confirmed: Int,
        unchanged: Int,
        replaced: Int,
        removed: Int,
        completed: Int,
        retained: Int,
        overflow: Int,
        failed: Int
    ) {
        self.scheduled = scheduled
        self.confirmed = confirmed
        self.unchanged = unchanged
        self.replaced = replaced
        self.removed = removed
        self.completed = completed
        self.retained = retained
        self.overflow = overflow
        self.failed = failed
    }

    public static let none = WatchScheduleCounts(
        scheduled: 0,
        confirmed: 0,
        unchanged: 0,
        replaced: 0,
        removed: 0,
        completed: 0,
        retained: 0,
        overflow: 0,
        failed: 0
    )

    init(_ summary: SyncSummary) {
        scheduled = summary.scheduledEventIDs.count
        confirmed = summary.confirmedEventIDs.count
        unchanged = summary.unchangedEventIDs.count
        replaced = summary.replacedEventIDs.count
        removed = summary.removedEventIDs.count
        completed = summary.completedEventIDs.count
        retained = summary.retainedEventIDs.count
        overflow = summary.overflowEventIDs.count
        failed = summary.failedEventIDs.count
    }
}

/// What the iPhone settings section renders. It never claims watch delivery:
/// `counts.confirmed` is a phone-side read-back of Apple's schedule.
public struct WatchScheduleStatus: Equatable, Sendable {
    public let enabled: Bool
    /// A previous account's opt-in is still stored and must be cleaned up.
    public let hasOtherAccountOptIn: Bool
    public let permission: WatchSchedulePermission
    public let lastSuccessAt: Date?
    public let lastAttemptAt: Date?
    /// Stable code; localized by the app.
    public let lastErrorCode: String?
    public let counts: WatchScheduleCounts
    public let skipped: [SkippedScheduleEvent]
    /// Cleanup intents that Apple has not confirmed removing yet.
    public let pendingCleanupEventIDs: [Int]
    /// Submitted writes waiting for Apple's schedule to show them.
    public let unresolvedEventIDs: [Int]
    /// A pending write or cleanup belongs to another account and blocks work.
    public let otherAccountPending: Bool
    public let credentialExpiresAt: Date?
}

public struct WatchScheduleRefreshReport: Equatable, Sendable {
    public let outcome: WatchScheduleOutcome
    public let status: WatchScheduleStatus
}

public struct WatchScheduleDisconnectReport: Equatable, Sendable {
    public let scope: AccountScope
    public let removedEventIDs: [Int]
    /// Removals Apple has not confirmed (including an unresolved submit).
    public let retainedEventIDs: [Int]
    public let unresolvedEventIDs: [Int]
    public let purgedCredential: Bool
    public let permission: WatchSchedulePermission

    /// The walkthrough for the app: `retained` is not removed and will be
    /// retried by the next account's reconciliation.
    public var hasPendingCleanup: Bool { !retainedEventIDs.isEmpty }
}

// MARK: - Credential store

/// In-memory foreground token plus the durable vault. The transport reads it
/// through `WatchScheduleCredentialProviding`, so a foreground refresh and the
/// request it starts always use the same exact-scope token.
public actor WatchScheduleCredentialStore: WatchScheduleCredentialProviding {
    private let vault: any WatchScheduleCredentialVault
    private let now: () -> Date
    private var foreground: WatchScheduleCredential?

    public init(
        vault: any WatchScheduleCredentialVault,
        now: @escaping () -> Date = Date.init
    ) {
        self.vault = vault
        self.now = now
    }

    /// Adopt the app session's token. Only a token with an expiry is persisted:
    /// background work must never use a credential whose lifetime is unknown.
    public func adopt(_ credential: WatchScheduleCredential) async {
        foreground = credential
        guard credential.expiresAt != nil else {
            return
        }
        try? await vault.save(credential)
    }

    public func credential(
        for scope: AccountScope
    ) async throws -> WatchScheduleCredential? {
        if let foreground,
           foreground.scope == scope,
           !isExpired(foreground) {
            return foreground
        }
        guard let stored = try await vault.load(),
              stored.scope == scope,
              !isExpired(stored)
        else {
            return nil
        }
        return stored
    }

    /// The background pass may only use a token that was persisted with an
    /// expiry by a foreground pass.
    public func storedCredential() async throws -> WatchScheduleCredential? {
        try await vault.load()
    }

    public func storedExpiry() async -> Date? {
        (try? await vault.load())?.expiresAt
    }

    public func purge() async {
        foreground = nil
        try? await vault.purge()
    }

    private func isExpired(_ credential: WatchScheduleCredential) -> Bool {
        guard let expiresAt = credential.expiresAt else {
            return false
        }
        return expiresAt <= now()
    }
}

// MARK: - Lifecycle

/// Serialized owner of the opt-in, the account generation and the refresh
/// triggers. The WorkoutKit adapter, Capacitor plugin and settings UI stay
/// thin: every ordering rule that protects another account's schedule lives
/// here and is portable.
public actor WatchScheduleLifecycle {
    private let reconciler: ScheduleReconciler
    private let journal: any ScheduleJournal
    private let credentials: WatchScheduleCredentialStore
    private let optIn: any WatchScheduleOptInStore
    private let authorization: any WatchScheduleAuthorizing
    private let calendar: Calendar
    private let now: () -> Date
    private let loadSnapshot:
        @Sendable (AccountScope, Date, Calendar) async throws -> ScheduleSnapshot

    private var generation: UInt64 = 0
    private var activeScope: AccountScope?
    /// Bumped on connect/disconnect before any await that can be raced by a
    /// logout. A refresh that captured an older epoch must not write.
    private var epoch: UInt64 = 0
    private var permissionCache: WatchSchedulePermission = .notDetermined
    private var lastSuccessAt: Date?
    private var lastAttemptAt: Date?
    private var lastErrorCode: String?
    private var counts = WatchScheduleCounts.none
    private var skipped: [SkippedScheduleEvent] = []

    private var gateIsHeld = false
    private var gateWaiters: [CheckedContinuation<Void, Never>] = []

    public init(
        reconciler: ScheduleReconciler,
        journal: any ScheduleJournal,
        credentials: WatchScheduleCredentialStore,
        optIn: any WatchScheduleOptInStore,
        authorization: any WatchScheduleAuthorizing,
        calendar: Calendar,
        now: @escaping () -> Date = Date.init,
        loadSnapshot: @escaping @Sendable (
            AccountScope,
            Date,
            Calendar
        ) async throws -> ScheduleSnapshot
    ) {
        self.reconciler = reconciler
        self.journal = journal
        self.credentials = credentials
        self.optIn = optIn
        self.authorization = authorization
        self.calendar = calendar
        self.now = now
        self.loadSnapshot = loadSnapshot
    }

    // MARK: Status

    /// Reads the opt-in, the durable journal and Apple's permission. It never
    /// writes, fetches or mutates Apple's schedule.
    public func status(scope: AccountScope?) async -> WatchScheduleStatus {
        await makeStatus(scope: scope, permission: authorization.permission())
    }

    public func isBackgroundRefreshEnabled() async -> Bool {
        (try? await optIn.load()) != nil
    }

    // MARK: Connect

    public func connect(
        scope: AccountScope,
        credential: WatchScheduleCredential,
        requestPermission: Bool
    ) async -> WatchScheduleRefreshReport {
        await acquireGate()
        defer { releaseGate() }

        epoch &+= 1
        let stored = try? await optIn.load()
        if let stored, stored != scope {
            // A different account's entries are removed under its own exact
            // scope before this one is allowed to schedule anything.
            _ = await teardown(stored)
            try? await optIn.clear()
        }

        let current = await authorization.permission()
        let resolved: WatchSchedulePermission
        if current == .notDetermined && requestPermission {
            resolved = await authorization.requestPermission()
        } else {
            resolved = current
        }
        permissionCache = resolved

        guard resolved != .unsupported else {
            return await report(
                .deferred(.unsupportedDevice),
                scope: scope,
                permission: resolved
            )
        }
        try? await optIn.save(scope)

        guard resolved == .authorized else {
            return await report(
                resolved == .notDetermined
                    ? .deferred(.permissionNotDetermined)
                    : .deferred(.permissionDenied),
                scope: scope,
                permission: resolved
            )
        }
        guard credential.scope == scope else {
            return await report(
                .deferred(.scopeMismatch),
                scope: scope,
                permission: resolved
            )
        }
        guard !isExpired(credential) else {
            return await report(
                .deferred(.credentialExpired),
                scope: scope,
                permission: resolved
            )
        }

        await credentials.adopt(credential)
        await activateIfNeeded(scope)
        return await pass(trigger: .connect, scope: scope)
    }

    // MARK: Refresh

    public func refresh(
        trigger: WatchScheduleTrigger,
        scope: AccountScope,
        credential: WatchScheduleCredential?
    ) async -> WatchScheduleRefreshReport {
        let entryEpoch = epoch
        await acquireGate()
        defer { releaseGate() }

        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        guard let stored = try? await optIn.load() else {
            return await report(.deferred(.inactive), scope: scope)
        }
        guard stored == scope else {
            return await report(.deferred(.inactive), scope: scope)
        }

        let permission = await authorization.permission()
        permissionCache = permission
        switch permission {
        case .authorized:
            break
        case .unsupported:
            return await report(
                .deferred(.unsupportedDevice),
                scope: scope,
                permission: permission
            )
        case .denied:
            lastErrorCode = "permissionDenied"
            return await report(
                .deferred(.permissionDenied),
                scope: scope,
                permission: permission
            )
        case .notDetermined:
            return await report(
                .deferred(.permissionNotDetermined),
                scope: scope,
                permission: permission
            )
        }

        if trigger == .background {
            // Only a foreground pass may renew authentication. If the stored
            // token is gone or expired, the OS wake-up ends here.
            let storedCredential: WatchScheduleCredential?
            do {
                storedCredential = try await credentials.storedCredential()
            } catch {
                return await report(
                    .deferred(.credentialRequired),
                    scope: scope,
                    permission: permission
                )
            }
            guard let storedCredential, storedCredential.scope == scope else {
                return await report(
                    .deferred(.credentialRequired),
                    scope: scope,
                    permission: permission
                )
            }
            guard !isExpired(storedCredential) else {
                await credentials.purge()
                return await report(
                    .deferred(.credentialExpired),
                    scope: scope,
                    permission: permission
                )
            }
        } else {
            guard let credential,
                  !credential.accessToken
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                    .isEmpty
            else {
                return await report(
                    .deferred(.credentialRequired),
                    scope: scope,
                    permission: permission
                )
            }
            guard credential.scope == scope else {
                return await report(
                    .deferred(.scopeMismatch),
                    scope: scope,
                    permission: permission
                )
            }
            guard !isExpired(credential) else {
                return await report(
                    .deferred(.credentialExpired),
                    scope: scope,
                    permission: permission
                )
            }
            await credentials.adopt(credential)
        }

        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        await activateIfNeeded(scope)
        return await pass(trigger: trigger, scope: scope)
    }

    // MARK: Disconnect

    /// Disconnect, logout and instance switch. The epoch and the reconciler
    /// fence are cleared before anything waits, so a pass that is still
    /// fetching or writing cannot start another write. Cleanup then runs under
    /// the exact stored scope and generation; the journal is never reset.
    public func disconnect(
        scope requested: AccountScope?
    ) async -> WatchScheduleDisconnectReport? {
        let stored = try? await optIn.load()
        let target = stored ?? activeScope
        guard let target else {
            return nil
        }
        // Never clean a scope other than the authorized one.
        if let requested, requested != target {
            return nil
        }

        epoch &+= 1
        try? await optIn.clear()
        await reconciler.invalidate()

        await acquireGate()
        defer { releaseGate() }

        return await teardown(target)
    }

    // MARK: Background entry point

    /// The iOS background task handler calls this. It is a normal lifecycle
    /// pass with `background` triggers: no foreground credential, no refresh
    /// token, no new opt-in.
    public func handleBackgroundRefresh() async -> WatchScheduleRefreshReport {
        guard let stored = try? await optIn.load() else {
            return await report(.deferred(.inactive), scope: nil)
        }
        return await refresh(
            trigger: .background,
            scope: stored,
            credential: nil
        )
    }

    // MARK: - Pipeline

    private func activateIfNeeded(_ scope: AccountScope) async {
        guard activeScope != scope else {
            return
        }
        generation &+= 1
        await reconciler.activate(generation: generation, for: scope)
        activeScope = scope
        lastSuccessAt = nil
        lastAttemptAt = nil
        lastErrorCode = nil
        counts = .none
        skipped = []
    }

    private func pass(
        trigger: WatchScheduleTrigger,
        scope: AccountScope
    ) async -> WatchScheduleRefreshReport {
        lastAttemptAt = now()
        let snapshot: ScheduleSnapshot
        do {
            snapshot = try await loadSnapshot(scope, now(), calendar)
        } catch is CancellationError {
            return await report(.deferred(.inactive), scope: scope)
        } catch let error as ScheduleSourceError {
            return await sourceFailure(error, scope: scope)
        } catch {
            return await report(.failed("calendarUnavailable"), scope: scope)
        }

        do {
            let summary = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: generation
            )
            lastSuccessAt = now()
            lastErrorCode = nil
            counts = WatchScheduleCounts(summary)
            skipped = summary.skipped
            return await report(.synced(summary), scope: scope)
        } catch is CancellationError {
            return await report(.deferred(.inactive), scope: scope)
        } catch let error as ScheduleReconcileError {
            return await reconcileFailure(error, scope: scope)
        } catch {
            return await report(.failed("storeUnavailable"), scope: scope)
        }
    }

    private func sourceFailure(
        _ error: ScheduleSourceError,
        scope: AccountScope
    ) async -> WatchScheduleRefreshReport {
        switch error {
        case .credentialExpired, .unauthorized:
            // The app session must sign in again in the foreground.
            return await report(.deferred(.credentialRequired), scope: scope)
        case .scopeMismatch:
            return await report(.deferred(.scopeMismatch), scope: scope)
        case .calendarUnavailable:
            lastErrorCode = "calendarUnavailable"
        case .invalidCalendarResponse:
            lastErrorCode = "invalidCalendarResponse"
        case .invalidCalendar:
            lastErrorCode = "invalidCalendar"
        }
        return await report(
            .failed(lastErrorCode ?? "calendarUnavailable"),
            scope: scope
        )
    }

    private func reconcileFailure(
        _ error: ScheduleReconcileError,
        scope: AccountScope
    ) async -> WatchScheduleRefreshReport {
        switch error {
        case .staleGeneration:
            return await report(.deferred(.inactive), scope: scope)
        case .scopeMismatch:
            return await report(.deferred(.scopeMismatch), scope: scope)
        case .schedulingDenied:
            lastErrorCode = "permissionDenied"
            permissionCache = .denied
            return await report(
                .deferred(.permissionDenied),
                scope: scope,
                permission: .denied
            )
        case .schedulingUnsupported:
            return await report(
                .deferred(.unsupportedDevice),
                scope: scope,
                permission: .unsupported
            )
        case .invalidSnapshot:
            lastErrorCode = "invalidSnapshot"
        case .staleSnapshot:
            lastErrorCode = "staleSnapshot"
        case .storeUnavailable:
            lastErrorCode = "storeUnavailable"
        case .journalUnavailable:
            lastErrorCode = "journalUnavailable"
        case .pendingCleanup:
            lastErrorCode = "pendingCleanup"
        case .unresolvedWrite:
            lastErrorCode = "unresolvedWrite"
        }
        return await report(
            .failed(lastErrorCode ?? "storeUnavailable"),
            scope: scope
        )
    }

    /// Clears every owned upcoming entry under the exact authorized scope.
    /// Receipts Apple cannot confirm are retained in the journal for the next
    /// account's reconciliation; nothing is reset or guessed.
    private func teardown(
        _ target: AccountScope
    ) async -> WatchScheduleDisconnectReport {
        generation &+= 1
        await reconciler.activate(generation: generation, for: target)

        var removed: [Int] = []
        var retained: [Int] = []
        do {
            let summary = try await reconciler.cleanup(
                scope: target,
                generation: generation
            )
            removed = summary.removedEventIDs
            retained = summary.retainedEventIDs
        } catch {
            // Cleanup persisted its intents before the fallible scheduler
            // read. Every receipt that still needs work stays.
            let receipts = (try? await journal.receipts(for: target)) ?? []
            retained = receipts.map(\.eventID)
        }
        await reconciler.invalidate()
        activeScope = nil
        permissionCache = await authorization.permission()

        let receipts = (try? await journal.receipts(for: target)) ?? []
        let unresolved = receipts.filter(isUnresolved).map(\.eventID)
        let pendingCleanup = receipts.filter(isPendingCleanup).map(\.eventID)
        let retainedAll = Array(Set(retained + pendingCleanup)).sorted()

        await credentials.purge()
        lastSuccessAt = nil
        lastAttemptAt = nil
        lastErrorCode = nil
        counts = .none
        skipped = []

        return WatchScheduleDisconnectReport(
            scope: target,
            removedEventIDs: removed.sorted(),
            retainedEventIDs: retainedAll,
            unresolvedEventIDs: unresolved,
            purgedCredential: true,
            permission: permissionCache
        )
    }

    // MARK: - Status snapshot

    private func report(
        _ outcome: WatchScheduleOutcome,
        scope: AccountScope?,
        permission: WatchSchedulePermission? = nil
    ) async -> WatchScheduleRefreshReport {
        if case .failed(let code) = outcome {
            lastErrorCode = code
        }
        let resolvedPermission = permission ?? permissionCache
        if let permission {
            permissionCache = permission
        }
        let status = await makeStatus(
            scope: scope,
            permission: resolvedPermission
        )
        return WatchScheduleRefreshReport(outcome: outcome, status: status)
    }

    private func makeStatus(
        scope: AccountScope?,
        permission: WatchSchedulePermission
    ) async -> WatchScheduleStatus {
        let storedScope = try? await optIn.load()
        let receipts = (try? await journal.allReceipts()) ?? []
        let unresolved = receipts.filter(isUnresolved).map(\.eventID)
        let pendingCleanup = receipts.filter(isPendingCleanup).map(\.eventID)
        let otherPending = receipts.contains { receipt in
            guard let scope else {
                return true
            }
            return receipt.scope != scope
                && (isUnresolved(receipt) || isPendingCleanup(receipt))
        }
        let expiresAt = await credentials.storedExpiry()
        return WatchScheduleStatus(
            enabled: storedScope != nil && (scope == nil || storedScope == scope),
            hasOtherAccountOptIn: storedScope != nil
                && scope != nil
                && storedScope != scope,
            permission: permission,
            lastSuccessAt: lastSuccessAt,
            lastAttemptAt: lastAttemptAt,
            lastErrorCode: lastErrorCode,
            counts: counts,
            skipped: skipped,
            pendingCleanupEventIDs: Array(Set(pendingCleanup)).sorted(),
            unresolvedEventIDs: Array(Set(unresolved)).sorted(),
            otherAccountPending: otherPending,
            credentialExpiresAt: expiresAt
        )
    }

    private func isUnresolved(_ receipt: ScheduleReceipt) -> Bool {
        switch receipt.pendingOperation {
        case .schedule, .replace:
            return true
        case .remove:
            return receipt.removalIntent != .cleanup
        case nil:
            return false
        }
    }

    private func isPendingCleanup(_ receipt: ScheduleReceipt) -> Bool {
        receipt.pendingOperation == .remove && receipt.removalIntent == .cleanup
    }

    private func isExpired(_ credential: WatchScheduleCredential) -> Bool {
        guard let expiresAt = credential.expiresAt else {
            return false
        }
        return expiresAt <= now()
    }

    // One lifecycle pass at a time. Actor reentrancy must not let two snapshot
    // reads allocate different generations, nor a disconnect interleave with a
    // pass. Disconnect fences the reconciler before waiting for this gate.
    private func acquireGate() async {
        if !gateIsHeld {
            gateIsHeld = true
            return
        }
        await withCheckedContinuation { continuation in
            gateWaiters.append(continuation)
        }
    }

    private func releaseGate() {
        if gateWaiters.isEmpty {
            gateIsHeld = false
        } else {
            gateWaiters.removeFirst().resume()
        }
    }
}
