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
    /// Inspects the stored item for scoped deletion even if reuse is blocked.
    func loadForRetirement() async throws -> WatchScheduleCredential?
    func save(_ credential: WatchScheduleCredential) async throws
    func purge() async throws
}

public extension WatchScheduleCredentialVault {
    func loadForRetirement() async throws -> WatchScheduleCredential? {
        try await load()
    }
}

/// The native vault shares this durable gate between async refreshes and
/// synchronous background task registration. It stores only the presence of
/// a revocation marker, never a token or account information.
public final class WatchScheduleVaultAccess: @unchecked Sendable {
    private let defaults: UserDefaults
    private let lock = NSLock()
    private let blockedKey = "org.openathlete.watch-schedule.background-credential-blocked"

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func read(_ load: () throws -> WatchScheduleCredential?) rethrows -> WatchScheduleCredential? {
        try lock.withLock {
            guard defaults.object(forKey: blockedKey) == nil else {
                return nil
            }
            return try load()
        }
    }

    public func replace(_ save: () throws -> Void) rethrows {
        try lock.withLock {
            defaults.set(true, forKey: blockedKey)
            try save()
            defaults.removeObject(forKey: blockedKey)
        }
    }

    public func purge(_ delete: () throws -> Void) rethrows {
        try lock.withLock {
            defaults.set(true, forKey: blockedKey)
            try delete()
        }
    }
}

/// Remembers that the athlete enabled scheduling for one exact account. It is
/// not a credential: it lets a background launch know there is work to do.
public protocol WatchScheduleOptInStore: Sendable {
    func load() async throws -> AccountScope?
    func save(_ scope: AccountScope) async throws
    func clear() async throws
    func loadStatus() async throws -> (
        scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?
    )?
    /// Updates the existing opt-in only if it still belongs to `scope`.
    func saveLastRefresh(_ refresh: WatchScheduleLastRefresh, for scope: AccountScope) async throws
}

public extension WatchScheduleOptInStore {
    func loadStatus() async throws -> (
        scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?
    )? {
        try await load().map { ($0, nil) }
    }

    func saveLastRefresh(_ refresh: WatchScheduleLastRefresh, for scope: AccountScope) async throws {}
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

    public static let none = WatchScheduleCounts(overflow: 0)

    fileprivate init(overflow: Int) {
        self.init(
            scheduled: 0,
            confirmed: 0,
            unchanged: 0,
            replaced: 0,
            removed: 0,
            completed: 0,
            retained: 0,
            overflow: overflow,
            failed: 0
        )
    }

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
    /// Stored credentials are unavailable while a replacement is pending,
    /// after revocation, or when the current foreground token has no expiry.
    private var reuseBlocked = false

    public init(
        vault: any WatchScheduleCredentialVault,
        now: @escaping () -> Date = Date.init
    ) {
        self.vault = vault
        self.now = now
    }

    /// A token without an expiry replaces the foreground credential and
    /// retires the old background token without storing its replacement.
    public func adopt(_ credential: WatchScheduleCredential) async {
        foreground = credential
        reuseBlocked = true
        guard credential.expiresAt != nil else {
            try? await vault.purge()
            return
        }
        // The new token still works in the foreground after a failed vault
        // write. Only a successful save for the current session reopens reuse.
        do {
            try await vault.save(credential)
        } catch {
            return
        }
        guard foreground == credential else {
            return
        }
        reuseBlocked = false
    }

    /// The pass uses this exact credential, even if another token arrives while
    /// the pass is waiting on the network.
    public func beginPass(_ credential: WatchScheduleCredential) {
        // The adopted foreground token can be pinned while the vault is
        // blocked. A fence also clears the foreground token.
        guard !reuseBlocked || foreground == credential else {
            return
        }
        pinned = credential
    }

    /// Pins one newly presented credential for an identity check after a fence
    /// blocked stored reuse. It neither persists the token nor unblocks
    /// background work; `endPass` removes it. A connect still has to adopt the
    /// credential and prove its athlete before any opt-in becomes durable.
    public func beginVerification(_ credential: WatchScheduleCredential) {
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
        guard let stored = try await storedCredential(),
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
        let previousForeground = foreground
        let stored = try await vault.load()
        guard !reuseBlocked, foreground == previousForeground else {
            return nil
        }
        return stored
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
            stored = try await vault.loadForRetirement()
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
        reuseBlocked = true
        try await vault.purge()
        return true
    }

    /// Throws when the Keychain item could not be removed. The caller must not
    /// report a successful logout or retry stored background work in that case.
    public func purge() async throws {
        blockReuse()
        try await vault.purge()
    }

    private func isExpired(_ credential: WatchScheduleCredential) -> Bool {
        guard let expiresAt = credential.expiresAt else {
            return false
        }
        return expiresAt <= now()
    }
}

private struct SyncState {
    var lastRefresh: WatchScheduleLastRefresh?
    var lastAttemptAt: Date?
    var lastErrorCode: String?
    var counts = WatchScheduleCounts.none
}

private struct TeardownOutcome {
    let report: WatchScheduleDisconnectReport
    let fullyRetired: Bool
}

/// Result of an opt-in mutation attempted under the opt-in lock. `stale` means
/// a fence or a newer session won; the caller must not publish anything.
private enum OptInUpdate {
    case applied
    case stale
    case failed
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
    private let calendarProvider: @Sendable () -> Calendar
    private let now: () -> Date
    private let loadSnapshot:
        @Sendable (AccountScope, Date, Calendar) async throws -> ScheduleSnapshot
    /// Proves the pinned bearer belongs to this exact athlete before the
    /// opt-in becomes durable. The iOS runtime uses `GET /athlete/me`.
    private let verifyAccount: @Sendable (AccountScope) async throws -> Int

    private var generation: UInt64 = 0
    private var activeScope: AccountScope?
    /// Bumped on fence/connect/disconnect before any await that can be raced by
    /// a logout. A stale continuation must never save the opt-in or credential.
    private var epoch: UInt64 = 0
    private var permissionCache: WatchSchedulePermission = .notDetermined
    /// Per-account sync state. A speculative or failed pass for one scope can
    /// never rewrite another account's last success, error or skipped IDs.
    private var syncStates: [AccountScope: SyncState] = [:]

    /// One token per operation that is persisting teardown authorization,
    /// repairing storage or draining cleanup. Only the owner removes its token,
    /// so a recovery can never release a fence it does not own.
    private var fenceTokens: Set<UInt64> = []
    private var nextFenceToken: UInt64 = 0
    /// A failed fence or recovery leaves scheduling paused until a later
    /// recovery proves the durable state is clear.
    private var cleanupBlocked = false
    private var isFenceActive: Bool {
        cleanupBlocked || !fenceTokens.isEmpty
    }

    private var gateIsHeld = false
    private var gateWaiters: [CheckedContinuation<Void, Never>] = []

    /// Serializes only opt-in reads/mutations. A fence acknowledgement must not
    /// wait for a network pass or the permission sheet, but it must still be
    /// ordered against a connect that is saving or clearing the opt-in.
    private var optInLockIsHeld = false
    private var optInLockWaiters: [CheckedContinuation<Void, Never>] = []

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
        ) async throws -> ScheduleSnapshot,
        calendarProvider: (@Sendable () -> Calendar)? = nil,
        verifyAccount: (@Sendable (AccountScope) async throws -> Int)? = nil
    ) {
        self.reconciler = reconciler
        self.journal = journal
        self.credentials = credentials
        self.optIn = optIn
        self.teardown = teardown
        self.authorization = authorization
        self.calendar = calendar
        self.calendarProvider = calendarProvider ?? { calendar }
        self.now = now
        self.loadSnapshot = loadSnapshot
        self.verifyAccount = verifyAccount ?? { scope in
            // Portable tests and non-iOS targets do not model the own-athlete
            // call; the iOS runtime always supplies the real transport.
            scope.athleteId
        }
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
    /// actually retired (or there was none) and its absence was read back. The
    /// caller may report success only on true; false leaves scheduling paused
    /// so no new pass can start.
    public func fence() async -> Bool {
        let token = beginFence()
        // Revoke writes and credential use before any fallible storage await,
        // so a stalled teardown write cannot let a paused submission through.
        // This path never waits for the lifecycle gate, a network pass, Apple
        // or the permission sheet.
        await reconciler.fence()
        await credentials.blockReuse()
        syncStates.removeAll()

        // Only opt-in mutation is serialized from here on. A connect that is
        // still in its permission sheet cannot save after this fence: it checks
        // the same guard inside the lock.
        await acquireOptInLock()
        defer {
            releaseOptInLock()
            endFence(token)
        }

        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            // Cannot prove there is no opt-in, or it is malformed.
            cleanupBlocked = true
            return false
        }
        let target = stored ?? activeScope
        if let target {
            do {
                try await teardown.add(target)
            } catch {
                // Keep the opt-in as the only durable authorization.
                cleanupBlocked = true
                return false
            }
        }
        do {
            try await optIn.clear()
        } catch {
            cleanupBlocked = true
            return false
        }
        // Even a no-target fence proves the clear. Without this read-back a
        // failed or malformed write could survive the acknowledgement.
        do {
            guard try await optIn.load() == nil else {
                cleanupBlocked = true
                return false
            }
        } catch {
            cleanupBlocked = true
            return false
        }
        // A successful fence proves this operation's revocation. Any remaining
        // teardown is checked by connect/refresh/recovery before scheduling.
        cleanupBlocked = false
        return true
    }

    // MARK: Connect

    public func connect(
        scope: AccountScope,
        credential: WatchScheduleCredential,
        requestPermission: Bool
    ) async -> WatchScheduleRefreshReport {
        guard !isFenceActive else {
            return await report(.deferred(.inactive), scope: scope)
        }
        let waitEpoch = epoch
        await acquireGate()
        defer { releaseGate() }
        // A connect queued before a logout must not start a new session.
        guard !isFenceActive, waitEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        epoch &+= 1
        let entryEpoch = epoch

        // Reject a credential that cannot belong to this scope before it can
        // cause any durable change. Only this exact bearer may prove identity.
        guard credential.scope == scope else {
            return await report(.deferred(.scopeMismatch), scope: scope)
        }
        guard !isExpired(credential) else {
            return await report(.deferred(.credentialExpired), scope: scope)
        }

        // Prove the pinned bearer's athlete before a permission-driven opt-in
        // save or any teardown/opt-in mutation. Pin only: the token is not
        // persisted for background work until the identity matches. A previous
        // fence has blocked stored reuse, so this explicit verification pin is
        // what lets the newly signed-in account prove itself.
        await credentials.beginVerification(credential)
        do {
            let verifiedAthleteId = try await verifyAccount(scope)
            guard verifiedAthleteId == scope.athleteId else {
                throw ScheduleSourceError.scopeMismatch
            }
        } catch {
            await credentials.endPass()
            guard entryEpoch == epoch else {
                return await report(.deferred(.inactive), scope: scope)
            }
            return await verificationFailure(error, scope: scope)
        }
        await credentials.endPass()
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            // Unknown opt-in or cleanup state is not an absent opt-in.
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        if stored != nil && stored != scope {
            // Persist explicit authorization before the old opt-in/scope can be
            // lost, then recover it before this account may schedule. The
            // mutation re-reads the opt-in under the lock, because a disconnect
            // or another connect may have won while this connect was reading.
            switch await retireForeignOptIn(
                keeping: scope,
                epoch: entryEpoch
            ) {
            case .applied:
                break
            case .stale:
                return await report(.deferred(.inactive), scope: scope)
            case .failed:
                return await report(.failed("pendingCleanup"), scope: scope)
            }
        }
        guard await recoverPendingTeardown(from: entryEpoch) else {
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        let current = await authorization.permission()
        // The permission read itself can suspend. Do not open the system sheet
        // if a fence or account switch won while it was pending.
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
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
            // The athlete asked to enable scheduling but iOS refused. The
            // identity above is proven, so this opt-in is safe to keep for the
            // settings explanation. Writes remain blocked by the store.
            switch await saveOptInIfCurrent(scope, epoch: entryEpoch) {
            case .applied:
                break
            case .stale:
                return await report(.deferred(.inactive), scope: scope)
            case .failed:
                return await report(.failed("pendingCleanup"), scope: scope)
            }
            return await report(
                .deferred(.permissionDenied),
                scope: scope,
                permission: resolved
            )
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
        guard !isExpired(credential) else {
            return await report(
                .deferred(.credentialExpired),
                scope: scope,
                permission: resolved
            )
        }

        // Identity and permission are proven: now persist the scoped access
        // credential, pin it for the pass and make the opt-in durable.
        await credentials.adopt(credential)
        guard entryEpoch == epoch else {
            try? await credentials.purge()
            return await report(.deferred(.inactive), scope: scope)
        }
        await credentials.beginPass(credential)
        guard entryEpoch == epoch else {
            await credentials.endPass()
            try? await credentials.purge()
            return await report(.deferred(.inactive), scope: scope)
        }

        switch await saveOptInIfCurrent(scope, epoch: entryEpoch) {
        case .applied:
            break
        case .stale:
            await credentials.endPass()
            try? await credentials.purge()
            return await report(.deferred(.inactive), scope: scope)
        case .failed:
            await credentials.endPass()
            try? await credentials.purge()
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard entryEpoch == epoch else {
            // The fence already retired the opt-in; only undo our own save if
            // the session is still the one that started this connect.
            await credentials.endPass()
            _ = await clearOptInIfCurrent(scope, epoch: entryEpoch)
            try? await credentials.purge()
            return await report(.deferred(.inactive), scope: scope)
        }
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
        guard !isFenceActive else {
            return await report(.deferred(.inactive), scope: scope)
        }
        let entryEpoch = epoch
        await acquireGate()
        defer { releaseGate() }

        guard !isFenceActive, entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }

        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard stored == scope else {
            return await report(.deferred(.inactive), scope: scope)
        }
        guard await recoverPendingTeardown(from: entryEpoch) else {
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard entryEpoch == epoch else {
            return await report(.deferred(.inactive), scope: scope)
        }
        // Recovery clears a stale opt-in for a crashed teardown; this account
        // must not be re-enabled automatically.
        let currentOptIn: AccountScope?
        do {
            currentOptIn = try await optIn.load()
        } catch {
            return await report(.failed("pendingCleanup"), scope: scope)
        }
        guard currentOptIn == scope else {
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
        guard entryEpoch == epoch else {
            await credentials.endPass()
            return await report(.deferred(.inactive), scope: scope)
        }
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
        if let requested {
            // A scoped disconnect is not an exit. Wait for the pass or connect
            // that owns the gate, then validate the account that actually
            // exists at revocation. A stale caller must never fence the
            // account that won the session.
            await acquireGate()
            defer { releaseGate() }
            await acquireOptInLock()
            guard await knownScopeMatchesLocked(requested) else {
                releaseOptInLock()
                return nil
            }

            let target = requested
            let token = beginFence()
            defer { endFence(token) }
            // Revocation and the durable opt-in retirement are serialized with
            // the validation above, not with another pass or the network. The
            // validated scope cannot change while the lock is held, so no
            // post-revocation refusal can leave the winner fenced.
            await reconciler.fence()
            await credentials.blockReuse()
            syncStates.removeAll()

            do {
                try await teardown.add(target)
                try await optIn.clear()
            } catch {
                cleanupBlocked = true
                releaseOptInLock()
                return nil
            }
            let remaining: AccountScope?
            do {
                remaining = try await optIn.load()
            } catch {
                cleanupBlocked = true
                releaseOptInLock()
                return nil
            }
            releaseOptInLock()
            guard remaining == nil else {
                cleanupBlocked = true
                return nil
            }
            await reconciler.invalidate()

            let result = await teardownScope(target)
            if result.fullyRetired {
                do {
                    try await teardown.remove(target)
                } catch {
                    cleanupBlocked = true
                    return result.report
                }
                cleanupBlocked = false
            } else {
                cleanupBlocked = true
            }
            return result.report
        }

        // Unscoped logout/exit: revoke immediately, before any storage wait.
        let token = beginFence()
        defer { endFence(token) }
        await reconciler.fence()
        await credentials.blockReuse()
        syncStates.removeAll()

        await acquireOptInLock()
        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            cleanupBlocked = true
            releaseOptInLock()
            return nil
        }
        guard let target = stored ?? activeScope else {
            releaseOptInLock()
            // Cold logout after a crash: recover only the existing durable
            // teardown authorization under the same gate a pass would use.
            await acquireGate()
            let recovered = await recoverPendingTeardown(from: epoch)
            releaseGate()
            cleanupBlocked = !recovered
            return nil
        }
        do {
            try await teardown.add(target)
            try await optIn.clear()
        } catch {
            cleanupBlocked = true
            releaseOptInLock()
            return nil
        }
        let remaining: AccountScope?
        do {
            remaining = try await optIn.load()
        } catch {
            cleanupBlocked = true
            releaseOptInLock()
            return nil
        }
        releaseOptInLock()
        guard remaining == nil else {
            cleanupBlocked = true
            return nil
        }

        await acquireGate()
        defer { releaseGate() }
        await reconciler.invalidate()

        let result = await teardownScope(target)
        if result.fullyRetired {
            do {
                try await teardown.remove(target)
            } catch {
                cleanupBlocked = true
                return result.report
            }
            cleanupBlocked = false
        } else {
            cleanupBlocked = true
        }
        return result.report
    }

    /// Dedicated recovery for existing, durable teardown authorizations only.
    /// It never reads the opt-in as cleanup permission, never retires a foreign
    /// opt-in, and an absent teardown is a no-op: no epoch bump, no reconciler
    /// fence, no credential change. Other scopes' cleanup waits behind the
    /// lifecycle gate so the signed-in account's pass completes first.
    public func recoverCleanup() async -> Bool {
        // Capture before the first awaited teardown/opt-in read. A fence that
        // lands while one is pending owns the binding and must not be undone
        // by a restore later in this recovery.
        let entryEpoch = epoch
        let scopes: [AccountScope]
        do {
            scopes = try await teardown.load()
        } catch {
            // Unreadable is not empty: keep scheduling paused.
            cleanupBlocked = true
            return false
        }
        guard !scopes.isEmpty else {
            // Nothing durable to recover. A later successful check clears a
            // previous pause without disturbing the active account, but never
            // while another fence still owns the durable state.
            if fenceTokens.isEmpty {
                cleanupBlocked = false
            }
            return true
        }
        await acquireGate()
        let recovered = await recoverPendingTeardown(from: entryEpoch)
        releaseGate()
        if recovered {
            if fenceTokens.isEmpty {
                cleanupBlocked = false
            }
        } else {
            cleanupBlocked = true
        }
        return recovered
    }

    // MARK: Background entry point

    /// The iOS background task handler calls this. It is a normal lifecycle
    /// pass with `background` triggers: no foreground credential, no refresh
    /// token, no new opt-in.
    public func handleBackgroundRefresh() async -> WatchScheduleRefreshReport {
        guard !isFenceActive else {
            return await report(.deferred(.inactive), scope: nil)
        }
        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            // Unknown opt-in state: pause, never recover on an inferred scope.
            return await report(.deferred(.inactive), scope: nil)
        }
        guard let stored else {
            // Never resurrect a torn-down session. Only existing durable
            // teardown is recovered; absent teardown leaves the runtime alone.
            _ = await recoverCleanup()
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
        // Read the device calendar once per pass. A time-zone change must not
        // keep the snapshot and native date components on different calendars.
        let passCalendar = calendarProvider()
        let snapshot: ScheduleSnapshot
        do {
            snapshot = try await loadSnapshot(scope, now(), passCalendar)
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
                generation: generation,
                calendar: passCalendar
            )
            let refresh = WatchScheduleLastRefresh(
                date: now(),
                skipped: summary.skipped,
                overflow: summary.overflowEventIDs.count
            )
            guard await saveLastRefreshIfCurrent(refresh, scope: scope, epoch: entryEpoch) else {
                return await report(.deferred(.inactive), scope: scope)
            }
            state.lastRefresh = refresh
            state.lastErrorCode = nil
            state.counts = WatchScheduleCounts(summary)
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

    /// A failure before the opt-in never becomes an enabled session. It maps
    /// to the same stable outcomes as a snapshot read.
    private func verificationFailure(
        _ error: Error,
        scope: AccountScope
    ) async -> WatchScheduleRefreshReport {
        if let source = error as? ScheduleSourceError {
            return await sourceFailure(source, scope: scope)
        }
        if let transport = error as? ScheduleTransportError {
            switch transport {
            case .unauthorized, .credentialExpired:
                return await report(.deferred(.credentialRequired), scope: scope)
            case .scopeMismatch:
                return await report(.deferred(.scopeMismatch), scope: scope)
            default:
                return await report(.failed("calendarUnavailable"), scope: scope)
            }
        }
        if error is CancellationError {
            return await report(.deferred(.inactive), scope: scope)
        }
        return await report(.failed("calendarUnavailable"), scope: scope)
    }

    private func sourceFailure(
        _ error: ScheduleSourceError,
        scope: AccountScope
    ) async -> WatchScheduleRefreshReport {        switch error {
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
    ///
    /// A readable, empty journal is already a complete teardown: there is
    /// nothing to read from Apple and no permission is needed, but the stored
    /// credential is still purged. This is what lets a denied iPhone finish an
    /// authorized cleanup without touching WorkoutKit.
    private func teardownScope(_ target: AccountScope) async -> TeardownOutcome {
        let receiptsBefore: [ScheduleReceipt]
        let journalKnown: Bool
        do {
            receiptsBefore = try await journal.receipts(for: target)
            journalKnown = true
        } catch {
            receiptsBefore = []
            journalKnown = false
        }

        var removed: [Int] = []
        var retained: [Int] = []
        var cleanupProven = journalKnown && receiptsBefore.isEmpty

        if cleanupProven {
            // No Apple scheduler, permission or read is involved. Drop only
            // this scope's active binding; a different signed-in account stays
            // untouched.
            guard activeScope == target else {
                syncStates[target] = nil
                return await finishTeardownReport(
                    target,
                    removed: removed,
                    retained: retained,
                    cleanupProven: true
                )
            }
            generation &+= 1
            await reconciler.invalidate()
            activeScope = nil
        } else {
            generation &+= 1
            await reconciler.activate(generation: generation, for: target)
            do {
                let summary = try await reconciler.cleanup(
                    scope: target,
                    generation: generation,
                    calendar: calendarProvider()
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
                cleanupProven = false
            }
            await reconciler.invalidate()
            if activeScope == target {
                activeScope = nil
            }
        }
        syncStates[target] = nil
        return await finishTeardownReport(
            target,
            removed: removed,
            retained: retained,
            cleanupProven: cleanupProven
        )
    }

    private func finishTeardownReport(
        _ target: AccountScope,
        removed: [Int],
        retained: [Int],
        cleanupProven: Bool
    ) async -> TeardownOutcome {
        // No permission query here: an empty scope must tear down even when
        // WorkoutKit reports denied. The last known permission is reported.
        let permission = permissionCache
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
    private func recoverPendingTeardown(from entryEpoch: UInt64) async -> Bool {
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
        guard await clearStaleOptInIfAuthorized(by: scopes) else {
            return false
        }
        let ordered = scopes.sorted {
            if $0.instanceURL != $1.instanceURL {
                return $0.instanceURL.absoluteString
                    < $1.instanceURL.absoluteString
            }
            return $0.athleteId < $1.athleteId
        }
        let originalActive = activeScope
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

            // Recompute after every step: the surviving account must be the
            // one that was active before recovery, must not itself be in the
            // teardown list, must still hold the durable opt-in, and no fence
            // may have superseded this recovery. A scope that was drained is
            // never restored just because it was active at entry.
            if let originalActive,
               originalActive != scope,
               !ordered.contains(originalActive) {
                let stillOptedIn =
                    (try? await optIn.load()) == originalActive
                // Recheck after the awaited read, immediately before the
                // restore. A fence or newer session that landed while the read
                // was pending owns the binding now: never restore across it.
                if stillOptedIn, epoch == entryEpoch {
                    // teardownScope invalidates the reconciler even when it
                    // cleaned another scope; re-establish the surviving
                    // binding after every step.
                    generation &+= 1
                    await reconciler.activate(
                        generation: generation,
                        for: originalActive
                    )
                    activeScope = originalActive
                }
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
        let statusEpoch = epoch
        let stored: (scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?)?
        var optInKnown = true
        do {
            stored = try await optIn.loadStatus()
        } catch {
            // A malformed or unreadable opt-in is unknown, not absent.
            stored = nil
            optInKnown = false
        }
        let storedScope = stored?.scope
        let journalResult = try? await journal.allReceipts()
        let receipts = journalResult ?? []
        let teardownResult: [AccountScope]?
        do {
            teardownResult = try await teardown.load()
        } catch {
            teardownResult = nil
        }
        // An unreadable teardown, journal or opt-in is not "nothing pending".
        let cleanupUnknown =
            teardownResult == nil || journalResult == nil || !optInKnown
        let teardownScopes = teardownResult ?? []
        let scoped = scope.map { current in
            receipts.filter { $0.scope == current }
        } ?? []
        let unresolved = scoped.filter(isSubmitted).map(\.eventID)
        let localPending = scoped.filter(isLocalPending).map(\.eventID)
        let pendingCleanup = scoped.filter(isPendingCleanup).map(\.eventID)
        let syncState = scope.flatMap { syncStates[$0] } ?? SyncState()
        let sameScopeTeardown = scope.map(teardownScopes.contains) ?? false
        // Status reads can suspend across a fence. Persisted history can only
        // be shown for the current opt-in. In-memory history is already scoped
        // to the requested account and is discarded when that account retires.
        let canShowRefresh = !sameScopeTeardown && statusEpoch == epoch && fenceTokens.isEmpty
        let localRefresh = canShowRefresh ? syncState.lastRefresh : nil
        let storedRefresh = canShowRefresh && scope != nil && storedScope == scope
            ? stored?.lastRefresh
            : nil
        let lastRefresh = localRefresh ?? storedRefresh
        let counts = localRefresh != nil
            ? syncState.counts
            : WatchScheduleCounts(overflow: lastRefresh?.overflow ?? 0)
        let otherTeardown = teardownScopes.contains { $0 != scope }
        let otherPending = otherTeardown
            || receipts.contains { receipt in
                guard let scope else {
                    return needsWork(receipt)
                }
                return receipt.scope != scope && needsWork(receipt)
            }
        return WatchScheduleStatus(
            enabled: optInKnown
                && storedScope != nil
                && (scope == nil || storedScope == scope)
                && !sameScopeTeardown,
            // "Other account opt-in" means exactly that: a readable opt-in for
            // another account. A teardown is cleanup authority, not permission
            // to disconnect whoever is signed in now.
            hasOtherAccountOptIn: optInKnown
                && storedScope != nil
                && scope != nil
                && storedScope != scope,
            permission: permission,
            lastSuccessAt: lastRefresh?.date,
            lastAttemptAt: syncState.lastAttemptAt,
            lastErrorCode: syncState.lastErrorCode,
            counts: counts,
            skipped: lastRefresh?.skipped ?? [],
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

    /// Claims one fence before the first await. Only this operation may release
    /// it; another recovery cannot clear it even if its own work succeeds.
    private func beginFence() -> UInt64 {
        nextFenceToken &+= 1
        let token = nextFenceToken
        fenceTokens.insert(token)
        epoch &+= 1
        return token
    }

    private func endFence(_ token: UInt64) {
        fenceTokens.remove(token)
    }

    /// A scoped disconnect may only address what this instance can prove is the
    /// request's account. The caller holds the opt-in lock, so the validation
    /// and the following revocation cannot be split by a connect's save.
    /// Unknown storage is a mismatch, never a wildcard.
    private func knownScopeMatchesLocked(
        _ requested: AccountScope
    ) async -> Bool {
        var sawScope = false
        if let active = activeScope {
            guard active == requested else {
                return false
            }
            sawScope = true
        }
        let stored: AccountScope?
        do {
            stored = try await optIn.load()
        } catch {
            return false
        }
        if let stored {
            guard stored == requested else {
                return false
            }
            sawScope = true
        }
        return sawScope
    }

    /// Saves the opt-in only when the caller's session is still current and no
    /// fence has started. The check and the save are one critical section, so a
    /// fence cannot clear between them.
    private func saveOptInIfCurrent(
        _ scope: AccountScope,
        epoch expected: UInt64
    ) async -> OptInUpdate {
        await acquireOptInLock()
        defer { releaseOptInLock() }
        guard !isFenceActive, epoch == expected else {
            return .stale
        }
        do {
            try await optIn.save(scope)
            return .applied
        } catch {
            return .failed
        }
    }

    private func saveLastRefreshIfCurrent(
        _ refresh: WatchScheduleLastRefresh,
        scope: AccountScope,
        epoch expected: UInt64
    ) async -> Bool {
        await acquireOptInLock()
        defer { releaseOptInLock() }
        guard !isFenceActive, epoch == expected else {
            return false
        }
        // The scheduler already completed the pass. Preserve the in-memory
        // result if writing the optional history fails.
        try? await optIn.saveLastRefresh(refresh, for: scope)
        return !isFenceActive && epoch == expected
    }

    /// Undoes only this session's save. A fence or a newer session already owns
    /// the value; this must not erase it.
    private func clearOptInIfCurrent(
        _ scope: AccountScope,
        epoch expected: UInt64
    ) async -> OptInUpdate {
        await acquireOptInLock()
        defer { releaseOptInLock() }
        guard !isFenceActive, epoch == expected else {
            return .stale
        }
        do {
            guard try await optIn.load() == scope else {
                return .applied
            }
            try await optIn.clear()
            return .applied
        } catch {
            return .failed
        }
    }

    /// A connect for B may only replace A after persisting A's teardown
    /// authorization. Re-read under the lock: B must see the opt-in that is
    /// actually there at the mutation, not the value it read minutes ago.
    private func retireForeignOptIn(
        keeping scope: AccountScope,
        epoch expected: UInt64
    ) async -> OptInUpdate {
        await acquireOptInLock()
        defer { releaseOptInLock() }
        guard !isFenceActive, epoch == expected else {
            return .stale
        }
        do {
            guard let stored = try await optIn.load() else {
                return .applied
            }
            guard stored != scope else {
                return .applied
            }
            try await teardown.add(stored)
            try await optIn.clear()
            guard try await optIn.load() == nil else {
                return .failed
            }
            return .applied
        } catch {
            return .failed
        }
    }

    /// The crash window after teardown.add but before optIn.clear. Only a scope
    /// already named by durable teardown authorizes the clear.
    private func clearStaleOptInIfAuthorized(
        by scopes: [AccountScope]
    ) async -> Bool {
        await acquireOptInLock()
        defer { releaseOptInLock() }
        do {
            guard let stored = try await optIn.load() else {
                return true
            }
            guard scopes.contains(stored) else {
                return true
            }
            try await optIn.clear()
            guard try await optIn.load() == nil else {
                return false
            }
            return true
        } catch {
            return false
        }
    }

    // MARK: Mutexes

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

    private func acquireOptInLock() async {
        if !optInLockIsHeld {
            optInLockIsHeld = true
            return
        }
        await withCheckedContinuation { continuation in
            optInLockWaiters.append(continuation)
        }
    }

    private func releaseOptInLock() {
        if optInLockWaiters.isEmpty {
            optInLockIsHeld = false
        } else {
            optInLockWaiters.removeFirst().resume()
        }
    }
}
