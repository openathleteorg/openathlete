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

/// Authorization to remove an account's upcoming entries even after its opt-in
/// is gone. It is written **before** the opt-in is cleared, so a crash or a
/// failed journal read can never orphan a previous account's workouts.
public protocol WatchScheduleTeardownStore: Sendable {
    func load() async throws -> [AccountScope]
    func add(_ scope: AccountScope) async throws
    func remove(_ scope: AccountScope) async throws
}

public enum WatchScheduleTeardownError: Error, Equatable, Sendable {
    /// A persisted teardown document exists but cannot be trusted.
    case corrupt
}

/// File-backed teardown authorization with the same protection requirements as
/// the schedule journal: atomic writes and no credentials.
public actor FileWatchScheduleTeardownStore: WatchScheduleTeardownStore {
    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(fileURL: URL) {
        self.fileURL = fileURL
    }

    public func load() async throws -> [AccountScope] {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return []
        }
        let data = try Data(contentsOf: fileURL)
        // A persisted zero-byte document is corrupt, not an empty allow-list:
        // treating it as empty would let the next account schedule past an
        // authorized cleanup.
        guard !data.isEmpty else {
            throw WatchScheduleTeardownError.corrupt
        }
        do {
            return try decoder.decode([AccountScope].self, from: data)
        } catch {
            throw WatchScheduleTeardownError.corrupt
        }
    }

    public func add(_ scope: AccountScope) async throws {
        var scopes = try await load()
        if !scopes.contains(scope) {
            scopes.append(scope)
            try write(scopes)
        }
    }

    public func remove(_ scope: AccountScope) async throws {
        var scopes = try await load()
        let before = scopes.count
        scopes.removeAll { $0 == scope }
        if scopes.count != before {
            try write(scopes)
        }
    }

    private func write(_ scopes: [AccountScope]) throws {
        let data = try encoder.encode(scopes)
        try data.write(to: fileURL, options: [.atomic])
    }
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

// MARK: - Background refresh policy

/// The access token is the only credential available to a background refresh,
/// and API tokens are short lived. Schedule the next opportunity early enough
/// to use it, and submit nothing when the current token cannot outlive the
/// delay plus a margin. iOS still decides whether and when to run the task.
public enum WatchScheduleBackgroundPolicy {
    /// A short delay: background refresh is opportunistic, not a deadline.
    public static let earliestDelay: TimeInterval = 5 * 60
    /// The token must remain valid for this long after the earliest begin date.
    public static let expiryMargin: TimeInterval = 10 * 60

    public static func earliestBeginDate(
        credentialExpiresAt: Date?,
        now: Date
    ) -> Date? {
        guard let expiresAt = credentialExpiresAt,
              expiresAt > now.addingTimeInterval(
                earliestDelay + expiryMargin
              )
        else {
            return nil
        }
        return now.addingTimeInterval(earliestDelay)
    }
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
///
/// Identifiers are only for the requested scope. Another account contributes
/// one global `otherAccountPending` flag; its IDs, dates and credential details
/// are never exposed. Token expiry is intentionally absent.
public struct WatchScheduleStatus: Equatable, Sendable {
    public let enabled: Bool
    /// A previous account's opt-in or teardown still needs work.
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
    /// Submitted writes whose presence in Apple's schedule is not confirmed.
    /// These may exist on Apple's side and are never retried blindly.
    public let unresolvedEventIDs: [Int]
    /// Writes still at the local/planning stage, proven not submitted, or a
    /// calendar removal Apple has not confirmed. They are safe to retry.
    public let localPendingEventIDs: [Int]
    /// A previous account's pending write or teardown blocks scheduling. Only
    /// this boolean crosses the account boundary.
    public let otherAccountPending: Bool
    /// A teardown authorization exists, including for this same account.
    public let cleanupPending: Bool
    /// The durable teardown store could not be read; cleanup is not known to be
    /// clear.
    public let cleanupUnknown: Bool
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
/// through `WatchScheduleCredentialProviding`, so a foreground or background
/// pass always uses the exact credential chosen for that pass.
public actor WatchScheduleCredentialStore: WatchScheduleCredentialProviding {
    private let vault: any WatchScheduleCredentialVault
    private let now: () -> Date
    private var foreground: WatchScheduleCredential?
    /// Pins the credential a pass was validated with: a background pass must
    /// never silently prefer a newer foreground token of the same scope.
    private var pinned: WatchScheduleCredential?
    /// Set when a purge failed or the fence retired the session. Stored
    /// credentials are never reused until a new foreground token is adopted.
    private var reuseBlocked = false

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
        reuseBlocked = false
        guard credential.expiresAt != nil else {
            return
        }
        do {
            try await vault.save(credential)
        } catch {
            // The foreground pass can still use the app session's token, but a
            // stale stored token must not be reused later.
            reuseBlocked = true
        }
    }

    /// The pass uses this exact credential, even if another token arrives while
    /// the pass is waiting on the network.
    public func beginPass(_ credential: WatchScheduleCredential) {
        pinned = credential
    }

    public func endPass() {
        pinned = nil
    }

    /// Logout/disconnect stop background reuse immediately, before any Apple or
    /// Keychain work finishes.
    public func blockReuse() {
        pinned = nil
        foreground = nil
        reuseBlocked = true
    }

    public func credential(
        for scope: AccountScope
    ) async throws -> WatchScheduleCredential? {
        if let pinned {
            // A pass that pinned its credential never falls back to a newer or
            // different token, even when the pin expired or has another scope.
            guard pinned.scope == scope, !isExpired(pinned) else {
                return nil
            }
            return pinned
        }
        if let foreground,
           foreground.scope == scope,
           !isExpired(foreground) {
            return foreground
        }
        guard !reuseBlocked else {
            return nil
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
    /// expiry by a foreground pass and has not been retired by a failed purge.
    public func storedCredential() async throws -> WatchScheduleCredential? {
        guard !reuseBlocked else {
            return nil
        }
        return try await vault.load()
    }

    /// Retires the credential belonging to one account only. Another account's
    /// stored token (for example the account signed in while an old teardown is
    /// being recovered) is left untouched.
    public func retireCredential(for scope: AccountScope) async throws -> Bool {
        if pinned?.scope == scope {
            pinned = nil
        }
        if foreground?.scope == scope {
            foreground = nil
        }
        let stored: WatchScheduleCredential?
        do {
            stored = try await vault.load()
        } catch {
            reuseBlocked = true
            throw error
        }
        guard let stored else {
            return true
        }
        guard stored.scope == scope else {
            // The old account's token was already replaced; do not purge the
            // current account's credential.
            return true
        }
        do {
            try await vault.purge()
            return true
        } catch {
            reuseBlocked = true
            throw error
        }
    }

    /// Throws when the Keychain item could not be removed. The caller must not
    /// report a successful logout or retry stored background work in that case.
    public func purge() async throws {
        pinned = nil
        foreground = nil
        reuseBlocked = true
        do {
            try await vault.purge()
            reuseBlocked = false
        } catch {
            throw error
        }
    }

    private func isExpired(_ credential: WatchScheduleCredential) -> Bool {
        guard let expiresAt = credential.expiresAt else {
            return false
        }
        return expiresAt <= now()
    }
}

private struct SyncState {
    var lastSuccessAt: Date?
    var lastAttemptAt: Date?
    var lastErrorCode: String?
    var counts = WatchScheduleCounts.none
    var skipped: [SkippedScheduleEvent] = []
}

private struct TeardownOutcome {
    let report: WatchScheduleDisconnectReport
    let fullyRetired: Bool
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
    private let teardown: any WatchScheduleTeardownStore
    private let authorization: any WatchScheduleAuthorizing
    private let calendar: Calendar
    private let now: () -> Date
    private let loadSnapshot:
        @Sendable (AccountScope, Date, Calendar) async throws -> ScheduleSnapshot

    private var generation: UInt64 = 0
    private var activeScope: AccountScope?
    /// Bumped on fence/connect/disconnect before any await that can be raced by
    /// a logout. A stale continuation must never save the opt-in or credential.
    private var epoch: UInt64 = 0
    private var permissionCache: WatchSchedulePermission = .notDetermined
    /// Set before the first await of a fence/disconnect. Connect, foreground
    /// and background passes are refused while teardown authorization is being
    /// persisted, including on a cold runtime with no opt-in.
    private var fenceInProgress = false
    /// Per-account sync state. A speculative or failed pass for one scope can
    /// never rewrite another account's last success, error or skipped IDs.
    private var syncStates: [AccountScope: SyncState] = [:]

    private var gateIsHeld = false
    private var gateWaiters: [CheckedContinuation<Void, Never>] = []

    public init(
        reconciler: ScheduleReconciler,
        journal: any ScheduleJournal,
        credentials: WatchScheduleCredentialStore,
        optIn: any WatchScheduleOptInStore,
        teardown: any WatchScheduleTeardownStore,
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
        self.teardown = teardown
        self.authorization = authorization
        self.calendar = calendar
        self.now = now
        self.loadSnapshot = loadSnapshot
    }

    // MARK: Status

    /// Reads the opt-in, the durable journal and Apple's permission. It never
    /// writes, fetches or mutates Apple's schedule.
    public func status(scope: AccountScope?) async -> WatchScheduleStatus {
        let permission = await authorization.permission()
        return await makeStatus(scope: scope, permission: permission)
    }

    public func isBackgroundRefreshEnabled() async -> Bool {
        (try? await optIn.load()) != nil
    }

    /// Fences everything immediately: no new writes, no stored credential
    /// reuse, opt-in cleared only after its cleanup authorization is durable.
    /// It deliberately does not read or wait for Apple; logout can acknowledge
    /// this and let cleanup continue in the background.
    /// Returns true only when writes/credentials are revoked and the opt-in was
    /// actually retired (or there was none). The caller may report success only
    /// on true; false leaves the fence guard in place so no new pass can start.
    public func fence() async -> Bool {
        fenceInProgress = true
        epoch &+= 1
        // Revoke writes and credential use before any fallible storage await,
        // so a stalled teardown write cannot let a paused submission through.
        await reconciler.fence()
        await credentials.blockReuse()
        syncStates.removeAll()

        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            // Cannot prove there is no opt-in; keep the guard and fail closed.
            return false
        }
        let target = stored ?? activeScope
        guard let target else {
            do {
                try await optIn.clear()
            } catch {
                return false
            }
            fenceInProgress = false
            return true
        }
        do {
            try await teardown.add(target)
            try await optIn.clear()
        } catch {
            // Keep the opt-in as the only durable authorization and keep the
            // guard: teardown authorization is still pending.
            return false
        }
        let remaining: AccountScope?
        do {
            remaining = try await optIn.load()
        } catch {
            return false
        }
        guard remaining == nil else {
            return false
        }
        fenceInProgress = false
        return true
    }

    // MARK: Connect

    public func connect(
        scope: AccountScope,
        credential: WatchScheduleCredential,
        requestPermission: Bool
    ) async -> WatchScheduleRefreshReport {
        guard !fenceInProgress else {
            return await report(.deferred(.inactive), scope: scope)
        }
        let waitEpoch = epoch
        await acquireGate()
        defer { releaseGate() }
        // A connect queued before a logout must not start a new session.
        guard !fenceInProgress, waitEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        epoch &+= 1
        let entryEpoch = epoch
        let stored = try? await optIn.load()
        if let stored, stored != scope {
            // Persist explicit authorization before the old opt-in/scope can be
            // lost, then recover it before this account may schedule.
            do {
                try await teardown.add(stored)
                try? await optIn.clear()
            } catch {
                return await report(
                    .failed("pendingCleanup"),
                    scope: scope
                )
            }
        }
        guard await recoverPendingTeardown() else {
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        let current = await authorization.permission()
        let resolved: WatchSchedulePermission
        if current == .notDetermined && requestPermission {
            resolved = await authorization.requestPermission()
        } else {
            resolved = current
        }
        // The permission sheet can stay open indefinitely. A logout or account
        // switch during it must win, and must not let this continuation enable
        // a signed-out account.
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        permissionCache = resolved

        guard resolved != .unsupported else {
            return await report(
                .deferred(.unsupportedDevice),
                scope: scope,
                permission: resolved
            )
        }
        if resolved == .denied {
            // The athlete asked to enable scheduling but iOS refused. Keep the
            // opt-in so the settings screen can explain how to re-enable it;
            // writes remain blocked by the store's authorization check.
            try? await optIn.save(scope)
            guard entryEpoch == epoch else {
                try? await optIn.clear()
                return await report(.deferred(.inactive), scope: scope)
            }
        }
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

        try? await optIn.save(scope)
        guard entryEpoch == epoch else {
            // The save may have completed after a fence. Undo it so a stale
            // continuation cannot opt a signed-out account in.
            try? await optIn.clear()
            return await report(.deferred(.inactive), scope: scope)
        }
        await credentials.adopt(credential)
        guard entryEpoch == epoch else {
            try? await optIn.clear()
            try? await credentials.purge()
            return await report(.deferred(.inactive), scope: scope)
        }
        await credentials.beginPass(credential)
        let result = await pass(
            trigger: .connect,
            scope: scope,
            entryEpoch: entryEpoch
        )
        await credentials.endPass()
        return result
    }

    // MARK: Refresh

    public func refresh(
        trigger: WatchScheduleTrigger,
        scope: AccountScope,
        credential: WatchScheduleCredential?
    ) async -> WatchScheduleRefreshReport {
        guard !fenceInProgress else {
            return await report(.deferred(.inactive), scope: scope)
        }
        let entryEpoch = epoch
        await acquireGate()
        defer { releaseGate() }

        guard !fenceInProgress, entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        guard let stored = try? await optIn.load() else {
            return await report(.deferred(.inactive), scope: scope)
        }
        guard stored == scope else {
            return await report(.deferred(.inactive), scope: scope)
        }
        guard await recoverPendingTeardown() else {
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        // Recovery clears a stale opt-in for a crashed teardown; this account
        // must not be re-enabled automatically.
        guard let currentOptIn = try? await optIn.load(),
              currentOptIn == scope
        else {
            return await report(.deferred(.inactive), scope: scope)
        }

        let permission = await authorization.permission()
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
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

        let chosen: WatchScheduleCredential
        if trigger == .background {
            // Only a foreground pass may renew authentication. If the stored
            // token is gone, has no expiry or expired, the wake-up ends here.
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
            guard let storedCredential,
                  storedCredential.scope == scope
            else {
                return await report(
                    .deferred(.credentialRequired),
                    scope: scope,
                    permission: permission
                )
            }
            guard storedCredential.expiresAt != nil else {
                // An unbounded token cannot be used by a background pass; it
                // must not stay in the vault for another wake-up.
                try? await credentials.purge()
                return await report(
                    .deferred(.credentialRequired),
                    scope: scope,
                    permission: permission
                )
            }
            guard !isExpired(storedCredential) else {
                try? await credentials.purge()
                return await report(
                    .deferred(.credentialExpired),
                    scope: scope,
                    permission: permission
                )
            }
            chosen = storedCredential
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
            guard entryEpoch == epoch else {
                try? await credentials.purge()
                return await report(.deferred(.inactive), scope: scope)
            }
            chosen = credential
        }

        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        await credentials.beginPass(chosen)
        let result = await pass(
            trigger: trigger,
            scope: scope,
            entryEpoch: entryEpoch
        )
        await credentials.endPass()
        return result
    }

    // MARK: Disconnect

    /// Disconnect, logout and instance switch. Cleanup authorization is made
    /// durable before the opt-in is cleared, so it survives a crash, a journal
    /// failure or a Keychain failure and blocks the next account until done.
    public func disconnect(
        scope requested: AccountScope?
    ) async -> WatchScheduleDisconnectReport? {
        // A scoped disconnect for another account must reject before touching
        // this account's epoch, credential, opt-in or reconciler generation.
        let guardBeforeValidation = fenceInProgress
        if let requested {
            // Set the guard before the storage read. A mismatched request only
            // restores the previous guard and never touches the epoch, opt-in,
            // credential or reconciler generation.
            fenceInProgress = true
            let known: AccountScope?
            if let active = activeScope {
                known = active
            } else {
                known = try? await optIn.load()
            }
            guard known == requested else {
                fenceInProgress = guardBeforeValidation
                return nil
            }
        }

        fenceInProgress = true
        epoch &+= 1
        // Fence writes and credential use before any storage read or write.
        await reconciler.fence()
        await credentials.blockReuse()
        syncStates.removeAll()

        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            // Keep the guard; cleanup authorization is unproven.
            return nil
        }
        guard let target = stored ?? activeScope else {
            // Cold logout after a crash: share the lifecycle gate so a queued
            // connect cannot interleave with the old account's recovery.
            await acquireGate()
            defer { releaseGate() }
            let recovered = await recoverPendingTeardown()
            fenceInProgress = !recovered
            return nil
        }
        if let requested, requested != target {
            // The session changed while validating; still fenced, but do not
            // attribute cleanup to a scope the caller did not authorize.
            return nil
        }

        do {
            try await teardown.add(target)
            try await optIn.clear()
        } catch {
            // No durable authorization/clear: keep the opt-in and the guard.
            return nil
        }
        let remaining: AccountScope?
        do {
            remaining = try await optIn.load()
        } catch {
            // Cannot prove the opt-in is gone: keep it, the guard and the
            // teardown authorization.
            return nil
        }
        guard remaining == nil else {
            return nil
        }
        await reconciler.invalidate()

        await acquireGate()
        defer { releaseGate() }

        let result = await teardownScope(target)
        if result.fullyRetired {
            try? await teardown.remove(target)
        }
        // Keep connect/refresh/background out until the old scope's teardown
        // pass has drained; nothing may activate another session mid-cleanup.
        fenceInProgress = false
        return result.report
    }

    /// Dedicated recovery for an existing, durable teardown authorization. It
    /// never uses the current opt-in as authorization and never clears another
    /// session; unknown or unreadable state returns false without acting.
    public func recoverCleanup() async -> Bool {
        await acquireGate()
        defer { releaseGate() }
        let recovered = await recoverPendingTeardown()
        // Unknown/retained cleanup stays fail closed: no pass may start.
        fenceInProgress = !recovered
        return recovered
    }

    // MARK: Background entry point

    /// The iOS background task handler calls this. It is a normal lifecycle
    /// pass with `background` triggers: no foreground credential, no refresh
    /// token, no new opt-in.
    public func handleBackgroundRefresh() async -> WatchScheduleRefreshReport {
        guard !fenceInProgress else {
            return await report(.deferred(.inactive), scope: nil)
        }
        guard let stored = try? await optIn.load() else {
            // Never resurrect a torn-down session. Finish a crash's durable
            // teardown under the same lifecycle gate a connect would use.
            await acquireGate()
            let recovered = await recoverPendingTeardown()
            releaseGate()
            fenceInProgress = !recovered
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
    }

    private func pass(
        trigger: WatchScheduleTrigger,
        scope: AccountScope,
        entryEpoch: UInt64
    ) async -> WatchScheduleRefreshReport {
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

        // A fetch that started before a fence must not schedule anything, even
        // if no reconciler pass was active when the fence arrived.
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        await activateIfNeeded(scope)
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        var state = syncStates[scope] ?? SyncState()
        state.lastAttemptAt = now()
        syncStates[scope] = state

        do {
            let summary = try await reconciler.reconcile(
                snapshot,
                scope: scope,
                generation: generation
            )
            state.lastSuccessAt = now()
            state.lastErrorCode = nil
            state.counts = WatchScheduleCounts(summary)
            state.skipped = summary.skipped
            syncStates[scope] = state
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
            return await report(.failed("calendarUnavailable"), scope: scope)
        case .invalidCalendarResponse:
            return await report(.failed("invalidCalendarResponse"), scope: scope)
        case .invalidCalendar:
            return await report(.failed("invalidCalendar"), scope: scope)
        }
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
            return await report(.failed("invalidSnapshot"), scope: scope)
        case .staleSnapshot:
            return await report(.failed("staleSnapshot"), scope: scope)
        case .storeUnavailable:
            return await report(.failed("storeUnavailable"), scope: scope)
        case .journalUnavailable:
            return await report(.failed("journalUnavailable"), scope: scope)
        case .pendingCleanup:
            return await report(.failed("pendingCleanup"), scope: scope)
        case .unresolvedWrite:
            return await report(.failed("unresolvedWrite"), scope: scope)
        }
    }

    /// Removes every owned upcoming entry under the exact authorized scope and
    /// retires the credential. Receipts Apple cannot confirm are retained for
    /// the next attempt; nothing is reset or guessed.
    private func teardownScope(
        _ target: AccountScope
    ) async -> TeardownOutcome {
        generation &+= 1
        await reconciler.activate(generation: generation, for: target)

        var removed: [Int] = []
        var retained: [Int] = []
        var cleanupProven = false
        do {
            let summary = try await reconciler.cleanup(
                scope: target,
                generation: generation
            )
            removed = summary.removedEventIDs
            retained = summary.retainedEventIDs
            cleanupProven = true
        } catch {
            // Cleanup persisted its intents before the fallible scheduler
            // read. Every receipt that still needs work stays. A failed or
            // unreadable cleanup is uncertain, never an empty success.
            let receipts = (try? await journal.receipts(for: target)) ?? []
            retained = receipts.map(\.eventID)
        }
        await reconciler.invalidate()
        activeScope = nil
        syncStates[target] = nil
        let permission = await authorization.permission()
        permissionCache = permission

        let receipts = (try? await journal.receipts(for: target)) ?? []
        let unresolved = receipts.filter(isSubmitted).map(\.eventID)
        let pendingCleanup = receipts.filter(isPendingCleanup).map(\.eventID)
        let retainedAll = Array(Set(retained + pendingCleanup)).sorted()

        var purged = false
        do {
            purged = try await credentials.retireCredential(for: target)
        } catch {
            // A token that could not be removed is never reported as purged,
            // and its stored copy stays blocked from reuse.
        }
        return TeardownOutcome(
            report: WatchScheduleDisconnectReport(
                scope: target,
                removedEventIDs: removed.sorted(),
                retainedEventIDs: retainedAll,
                unresolvedEventIDs: unresolved,
                purgedCredential: purged,
                permission: permission
            ),
            fullyRetired: cleanupProven && retainedAll.isEmpty && purged
        )
    }

    /// Runs every durable teardown in the order it was recorded. Returns false
    /// when an account still has unconfirmed work or its credential could not be
    /// retired; callers must then refuse to schedule for anyone else.
    private func recoverPendingTeardown() async -> Bool {
        let scopes: [AccountScope]
        do {
            scopes = try await teardown.load()
        } catch {
            // Unreadable is not empty: refuse to schedule for anyone.
            return false
        }
        guard !scopes.isEmpty else {
            return true
        }
        // Crash window after teardown.add but before optIn.clear: prove the
        // stale opt-in is gone before deleting any teardown authorization.
        let storedOptIn: AccountScope?
        do {
            storedOptIn = try await optIn.load()
        } catch {
            return false
        }
        if let storedOptIn, scopes.contains(storedOptIn) {
            do {
                try await optIn.clear()
            } catch {
                return false
            }
            let afterClear: AccountScope?
            do {
                afterClear = try await optIn.load()
            } catch {
                return false
            }
            guard afterClear == nil else {
                return false
            }
        }
        let ordered = scopes.sorted {
            if $0.instanceURL != $1.instanceURL {
                return $0.instanceURL.absoluteString
                    < $1.instanceURL.absoluteString
            }
            return $0.athleteId < $1.athleteId
        }
        for scope in ordered {
            let result = await teardownScope(scope)
            guard result.fullyRetired else {
                return false
            }
            do {
                try await teardown.remove(scope)
            } catch {
                return false
            }
        }
        return true
    }

    // MARK: - Status snapshot

    private func report(
        _ outcome: WatchScheduleOutcome,
        scope: AccountScope?,
        permission: WatchSchedulePermission? = nil
    ) async -> WatchScheduleRefreshReport {
        if case .failed(let code) = outcome, let scope {
            var state = syncStates[scope] ?? SyncState()
            state.lastErrorCode = code
            syncStates[scope] = state
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
        let journalResult = try? await journal.allReceipts()
        let receipts = journalResult ?? []
        let teardownResult: [AccountScope]?
        do {
            teardownResult = try await teardown.load()
        } catch {
            teardownResult = nil
        }
        // An unreadable teardown or journal is not "nothing pending".
        let cleanupUnknown = teardownResult == nil || journalResult == nil
        let teardownScopes = teardownResult ?? []
        let scoped = scope.map { current in
            receipts.filter { $0.scope == current }
        } ?? []
        let unresolved = scoped.filter(isSubmitted).map(\.eventID)
        let localPending = scoped.filter(isLocalPending).map(\.eventID)
        let pendingCleanup = scoped.filter(isPendingCleanup).map(\.eventID)
        // Sync state belongs to one account only; another scope gets a blank
        // state instead of this account's last refresh, counts or skipped IDs.
        let syncState = scope.flatMap { syncStates[$0] } ?? SyncState()
        let sameScopeTeardown = scope.map(teardownScopes.contains) ?? false
        let otherTeardown = teardownScopes.contains { $0 != scope }
        let otherPending = otherTeardown
            || receipts.contains { receipt in
                guard let scope else {
                    return needsWork(receipt)
                }
                return receipt.scope != scope && needsWork(receipt)
            }
        return WatchScheduleStatus(
            enabled: storedScope != nil
                && (scope == nil || storedScope == scope)
                && !sameScopeTeardown,
            hasOtherAccountOptIn: (storedScope != nil
                && scope != nil
                && storedScope != scope) || otherTeardown,
            permission: permission,
            lastSuccessAt: syncState.lastSuccessAt,
            lastAttemptAt: syncState.lastAttemptAt,
            lastErrorCode: syncState.lastErrorCode,
            counts: syncState.counts,
            skipped: syncState.skipped,
            pendingCleanupEventIDs: Array(Set(pendingCleanup)).sorted(),
            unresolvedEventIDs: Array(Set(unresolved)).sorted(),
            localPendingEventIDs: Array(Set(localPending)).sorted(),
            otherAccountPending: otherPending,
            cleanupPending: !teardownScopes.isEmpty,
            cleanupUnknown: cleanupUnknown
        )
    }

    private func needsWork(_ receipt: ScheduleReceipt) -> Bool {
        isSubmitted(receipt) || isLocalPending(receipt) || isPendingCleanup(receipt)
    }

    /// A submission fence proved this write may exist on Apple's side.
    private func isSubmitted(_ receipt: ScheduleReceipt) -> Bool {
        guard receipt.pendingOperation == .schedule
            || receipt.pendingOperation == .replace
        else {
            return false
        }
        return receipt.pendingPhase == .confirming
    }

    /// Not yet submitted, proven no-submit, or a calendar removal. These are
    /// safe to retry and are not presented as an Apple-side unknown.
    private func isLocalPending(_ receipt: ScheduleReceipt) -> Bool {
        switch receipt.pendingOperation {
        case .schedule, .replace:
            return receipt.pendingPhase != .confirming
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
    // pass. Fence/disconnect fence the reconciler before waiting for this gate.
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
