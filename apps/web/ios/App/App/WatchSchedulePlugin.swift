import BackgroundTasks
import Capacitor
import Foundation
import Security
import WatchScheduleCore

#if canImport(HealthKit) && canImport(WorkoutKit)
import HealthKit
import WorkoutKit
#endif

// MARK: - Durable, device-protected storage

/// One Keychain item, scoped to this device. It stores only the current access
/// token and its expiry: there is no refresh token in the model, so background
/// work can never rotate or extend the session by itself.
struct KeychainWatchScheduleVault: WatchScheduleCredentialVault {
    private struct Stored: Codable {
        let instanceURL: String
        let athleteId: Int
        let accessToken: String
        let expiresAt: Date?
    }

    private let service = "org.openathlete.watch-schedule"
    private let account = "current-access-credential"

    func load() async throws -> WatchScheduleCredential? {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            return nil
        }
        guard status == errSecSuccess, let data = item as? Data else {
            throw WatchScheduleVaultError.unreadable(status)
        }
        let stored = try JSONDecoder().decode(Stored.self, from: data)
        guard let instanceURL = URL(string: stored.instanceURL) else {
            throw WatchScheduleVaultError.unreadable(errSecDecode)
        }
        return WatchScheduleCredential(
            scope: AccountScope(
                instanceURL: instanceURL,
                athleteId: stored.athleteId
            ),
            accessToken: stored.accessToken,
            expiresAt: stored.expiresAt
        )
    }

    func save(_ credential: WatchScheduleCredential) async throws {
        guard credential.expiresAt != nil else {
            // Background work may only use a token whose lifetime is known.
            return
        }
        let stored = Stored(
            instanceURL: credential.scope.instanceURL.absoluteString,
            athleteId: credential.scope.athleteId,
            accessToken: credential.accessToken,
            expiresAt: credential.expiresAt
        )
        let data = try JSONEncoder().encode(stored)
        // Replace atomically: two accounts must never leave two live tokens.
        SecItemDelete(baseQuery as CFDictionary)

        var attributes = baseQuery
        attributes[kSecValueData as String] = data
        // Device protected, not restored to another device from a backup, and
        // readable for background refresh only after the first unlock.
        attributes[kSecAttrAccessible as String] =
            kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        attributes[kSecAttrSynchronizable as String] = false
        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw WatchScheduleVaultError.unwritable(status)
        }
    }

    func purge() async throws {
        let status = SecItemDelete(baseQuery as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw WatchScheduleVaultError.unwritable(status)
        }
    }

    private var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }
}

enum WatchScheduleVaultError: Error {
    case unreadable(OSStatus)
    case unwritable(OSStatus)
}

/// The opt-in is not a credential: it only lets a background wake-up know that
/// this account asked for scheduling.
final class UserDefaultsWatchScheduleOptIn: WatchScheduleOptInStore {
    private struct Stored: Codable {
        let instanceURL: String
        let athleteId: Int
    }

    static let shared = UserDefaultsWatchScheduleOptIn()

    private let key = "org.openathlete.watch-schedule.opt-in"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func load() async throws -> AccountScope? {
        loadSync()
    }

    func save(_ scope: AccountScope) async throws {
        let stored = Stored(
            instanceURL: scope.instanceURL.absoluteString,
            athleteId: scope.athleteId
        )
        defaults.set(try JSONEncoder().encode(stored), forKey: key)
    }

    func clear() async throws {
        defaults.removeObject(forKey: key)
    }

    /// Background task scheduling is synchronous; the same value is read here.
    func loadSync() -> AccountScope? {
        guard let data = defaults.data(forKey: key),
              let stored = try? JSONDecoder().decode(Stored.self, from: data),
              let url = URL(string: stored.instanceURL)
        else {
            return nil
        }
        return AccountScope(instanceURL: url, athleteId: stored.athleteId)
    }
}

// MARK: - WorkoutKit authorization

#if canImport(HealthKit) && canImport(WorkoutKit)
@available(iOS 17.0, *)
struct WorkoutSchedulerAuthorization: WatchScheduleAuthorizing {
    func permission() async -> WatchSchedulePermission {
        guard WorkoutScheduler.isSupported else {
            return .unsupported
        }
        return Self.map(await WorkoutScheduler.shared.authorizationState)
    }

    func requestPermission() async -> WatchSchedulePermission {
        guard WorkoutScheduler.isSupported else {
            return .unsupported
        }
        return Self.map(await WorkoutScheduler.shared.requestAuthorization())
    }

    private static func map(
        _ state: WorkoutScheduler.AuthorizationState
    ) -> WatchSchedulePermission {
        switch state {
        case .authorized:
            return .authorized
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .denied
        }
    }
}
#endif

// MARK: - Shared runtime

#if canImport(HealthKit) && canImport(WorkoutKit)
/// One journal, one reconciler, one lifecycle for foreground and background
/// work. The actors inside serialize passes and cleanup.
@available(iOS 17.0, *)
final class WatchScheduleRuntime {
    static let shared = WatchScheduleRuntime()

    let lifecycle: WatchScheduleLifecycle

    private init() {
        let vault = KeychainWatchScheduleVault()
        let credentials = WatchScheduleCredentialStore(vault: vault)
        let client = WatchScheduleClient(credentialProvider: credentials)
        let source = ScheduleSource(transport: client)
        let journalURL = Self.journalURL()
        let journal = FileScheduleJournal(fileURL: journalURL)
        let reconciler = ScheduleReconciler(
            store: AppleWorkoutStore(),
            journal: journal,
            calendar: .current
        )
        lifecycle = WatchScheduleLifecycle(
            reconciler: reconciler,
            journal: journal,
            credentials: credentials,
            optIn: UserDefaultsWatchScheduleOptIn.shared,
            authorization: WorkoutSchedulerAuthorization(),
            calendar: .current,
            loadSnapshot: { scope, now, calendar in
                try await source.loadSnapshot(
                    scope: scope,
                    now: now,
                    calendar: calendar
                )
            }
        )
    }

    /// The journal holds event IDs and plan UUIDs, never credentials. Its
    /// directory is device protected, so a locked backup cannot read it.
    private static func journalURL() -> URL {
        let fileManager = FileManager.default
        let base = (try? fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )) ?? fileManager.temporaryDirectory
        let directory = base.appendingPathComponent(
            "WatchSchedule",
            isDirectory: true
        )
        try? fileManager.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        try? fileManager.setAttributes(
            [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
            ofItemAtPath: directory.path
        )
        let journal = directory.appendingPathComponent("schedule.json")
        try? fileManager.setAttributes(
            [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
            ofItemAtPath: journal.path
        )
        return journal
    }

    func handleBackgroundRefresh() async -> Bool {
        let report = await lifecycle.handleBackgroundRefresh()
        switch report.outcome {
        case .synced:
            return true
        case .deferred:
            // Missing or expired authentication is not a failed task: the next
            // foreground pass will renew it.
            return true
        case .failed:
            return false
        }
    }
}
#endif

// MARK: - Opportunistic background refresh

/// WorkoutKit cannot be updated from an extension, but the phone may ask for a
/// normal background app refresh with an authenticated calendar read.
enum WatchScheduleBackgroundRefresh {
    static let identifier = "org.openathlete.watch-schedule.refresh"

    /// Must run in `didFinishLaunching`, before the app finishes launching.
    static func register() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: identifier,
            using: nil
        ) { task in
            guard let refresh = task as? BGAppRefreshTask else {
                task.setTaskCompleted(success: false)
                return
            }
            handle(refresh)
        }
    }

    /// Submit the next opportunity while an account is opted in. iOS decides
    /// when, or whether, the opportunity runs.
    static func scheduleIfEnabled() {
        guard UserDefaultsWatchScheduleOptIn.shared.loadSync() != nil else {
            return
        }
        let request = BGAppRefreshTaskRequest(identifier: identifier)
        // No deadline is promised to the athlete; this is an earliest date.
        request.earliestBeginDate = Date(timeIntervalSinceNow: 4 * 60 * 60)
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            // The OS may refuse (budget, simulator). Foreground refresh and the
            // next launch still run.
            print("Watch schedule background refresh not scheduled: \(error)")
        }
    }

    static func cancel() {
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
    }

    private static func handle(_ task: BGAppRefreshTask) {
        // Resubmit while enabled so a single expiry cannot end the chain.
        scheduleIfEnabled()

        #if canImport(HealthKit) && canImport(WorkoutKit)
        if #available(iOS 17.0, *) {
            let work = Task {
                let success = await WatchScheduleRuntime.shared
                    .handleBackgroundRefresh()
                scheduleIfEnabled()
                task.setTaskCompleted(success: success)
            }
            task.expirationHandler = {
                // Cancel the pass and keep the next opportunity while the
                // athlete remains opted in.
                work.cancel()
                scheduleNextAfterExpiration()
            }
            return
        }
        #endif
        task.setTaskCompleted(success: false)
    }

    private static func scheduleNextAfterExpiration() {
        if UserDefaultsWatchScheduleOptIn.shared.loadSync() != nil {
            scheduleIfEnabled()
        }
    }
}

// MARK: - Capacitor plugin

/// The bridge behind `@/utils/watch-schedule`. It only translates; the
/// lifecycle owns opt-in, generation fencing, credential expiry and cleanup.
@objc(WatchSchedulePlugin)
public class WatchSchedulePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WatchSchedulePlugin"
    public let jsName = "WatchSchedule"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refresh", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disconnect", returnType: CAPPluginReturnPromise),
    ]

    @objc func status(_ call: CAPPluginCall) {
        guard let scope = Self.scope(from: call) else {
            call.reject("invalid scope", "INVALID_SCOPE")
            return
        }
        #if canImport(HealthKit) && canImport(WorkoutKit)
        if #available(iOS 17.0, *) {
            Task {
                let status = await WatchScheduleRuntime.shared.lifecycle
                    .status(scope: scope)
                call.resolve(Self.statusDictionary(status))
            }
            return
        }
        #endif
        call.resolve(Self.unsupportedStatus())
    }

    @objc func connect(_ call: CAPPluginCall) {
        guard let scope = Self.scope(from: call),
              let credential = Self.credential(from: call, scope: scope)
        else {
            call.reject("invalid scope or credential", "INVALID_CREDENTIAL")
            return
        }
        let requestPermission = call.getBool("requestPermission") ?? true
        #if canImport(HealthKit) && canImport(WorkoutKit)
        if #available(iOS 17.0, *) {
            Task {
                let report = await WatchScheduleRuntime.shared.lifecycle.connect(
                    scope: scope,
                    credential: credential,
                    requestPermission: requestPermission
                )
                if report.status.enabled && report.status.permission == .authorized {
                    WatchScheduleBackgroundRefresh.scheduleIfEnabled()
                }
                call.resolve(Self.resultDictionary(report))
            }
            return
        }
        #endif
        WatchScheduleBackgroundRefresh.cancel()
        call.resolve(Self.unsupportedResult())
    }

    @objc func refresh(_ call: CAPPluginCall) {
        guard let scope = Self.scope(from: call),
              let trigger = Self.trigger(from: call)
        else {
            call.reject("invalid scope or trigger", "INVALID_REQUEST")
            return
        }
        let credential = Self.credential(from: call, scope: scope)
        #if canImport(HealthKit) && canImport(WorkoutKit)
        if #available(iOS 17.0, *) {
            Task {
                let report = await WatchScheduleRuntime.shared.lifecycle.refresh(
                    trigger: trigger,
                    scope: scope,
                    credential: credential
                )
                if report.status.enabled && report.status.permission == .authorized {
                    WatchScheduleBackgroundRefresh.scheduleIfEnabled()
                }
                call.resolve(Self.resultDictionary(report))
            }
            return
        }
        #endif
        WatchScheduleBackgroundRefresh.cancel()
        call.resolve(Self.unsupportedResult())
    }

    @objc func disconnect(_ call: CAPPluginCall) {
        let requested = Self.scope(from: call)
        #if canImport(HealthKit) && canImport(WorkoutKit)
        if #available(iOS 17.0, *) {
            Task {
                let report = await WatchScheduleRuntime.shared.lifecycle
                    .disconnect(scope: requested)
                WatchScheduleBackgroundRefresh.cancel()
                if let report {
                    call.resolve([
                        "athleteId": report.scope.athleteId,
                        "instanceURL": report.scope.instanceURL.absoluteString,
                        "removedEventIDs": report.removedEventIDs,
                        "retainedEventIDs": report.retainedEventIDs,
                        "unresolvedEventIDs": report.unresolvedEventIDs,
                        "purgedCredential": report.purgedCredential,
                        "permission": report.permission.rawValue,
                    ])
                } else {
                    call.resolve()
                }
            }
            return
        }
        #endif
        WatchScheduleBackgroundRefresh.cancel()
        call.resolve()
    }

    // MARK: Argument decoding

    private static func scope(from call: CAPPluginCall) -> AccountScope? {
        guard let data = call.getObject("scope"),
              let urlString = data["instanceURL"] as? String,
              let url = URL(string: urlString),
              let rawAthleteId = data["athleteId"] as? NSNumber,
              rawAthleteId.intValue > 0
        else {
            return nil
        }
        return AccountScope(
            instanceURL: url,
            athleteId: rawAthleteId.intValue
        )
    }

    private static func credential(
        from call: CAPPluginCall,
        scope: AccountScope
    ) -> WatchScheduleCredential? {
        guard let accessToken = call.getString("accessToken"),
              !accessToken
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .isEmpty
        else {
            return nil
        }
        let expiresAt = call.getString("expiresAt").flatMap(Self.date(from:))
        return WatchScheduleCredential(
            scope: scope,
            accessToken: accessToken,
            expiresAt: expiresAt
        )
    }

    private static func trigger(from call: CAPPluginCall) -> WatchScheduleTrigger? {
        guard let raw = call.getString("trigger") else {
            return nil
        }
        return WatchScheduleTrigger(rawValue: raw)
    }

    private static func date(from value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: value) {
            return date
        }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: value)
    }

    private static func isoString(_ date: Date?) -> Any {
        guard let date else {
            return NSNull()
        }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }

    // MARK: Result encoding

    private static func statusDictionary(
        _ status: WatchScheduleStatus
    ) -> PluginCallResultData {
        [
            "enabled": status.enabled,
            "hasOtherAccountOptIn": status.hasOtherAccountOptIn,
            "permission": status.permission.rawValue,
            "lastSuccessAt": isoString(status.lastSuccessAt),
            "lastAttemptAt": isoString(status.lastAttemptAt),
            "lastErrorCode": status.lastErrorCode ?? NSNull(),
            "counts": [
                "scheduled": status.counts.scheduled,
                "confirmed": status.counts.confirmed,
                "unchanged": status.counts.unchanged,
                "replaced": status.counts.replaced,
                "removed": status.counts.removed,
                "completed": status.counts.completed,
                "retained": status.counts.retained,
                "overflow": status.counts.overflow,
                "failed": status.counts.failed,
            ],
            "skipped": status.skipped.map { event in
                [
                    "eventId": event.eventId,
                    "startDate": isoString(event.startDate),
                    "reasonCode": event.reason.code,
                    "retryable": event.reason.isRetryable,
                ] as PluginCallResultData
            },
            "pendingCleanupEventIDs": status.pendingCleanupEventIDs,
            "unresolvedEventIDs": status.unresolvedEventIDs,
            "otherAccountPending": status.otherAccountPending,
            "credentialExpiresAt": isoString(status.credentialExpiresAt),
        ]
    }

    private static func resultDictionary(
        _ report: WatchScheduleRefreshReport
    ) -> PluginCallResultData {
        var data: PluginCallResultData = [
            "status": statusDictionary(report.status),
            "deferral": NSNull(),
            "code": NSNull(),
        ]
        switch report.outcome {
        case .synced:
            data["outcome"] = "synced"
        case .deferred(let deferral):
            data["outcome"] = "deferred"
            data["deferral"] = deferralCode(deferral)
        case .failed(let code):
            data["outcome"] = "failed"
            data["code"] = code
        }
        return data
    }

    private static func deferralCode(_ deferral: WatchScheduleDeferral) -> String {
        switch deferral {
        case .inactive: return "inactive"
        case .unsupportedDevice: return "unsupportedDevice"
        case .permissionNotDetermined: return "permissionNotDetermined"
        case .permissionDenied: return "permissionDenied"
        case .credentialRequired: return "credentialRequired"
        case .credentialExpired: return "credentialExpired"
        case .scopeMismatch: return "scopeMismatch"
        }
    }

    private static func emptyCounts() -> PluginCallResultData {
        [
            "scheduled": 0,
            "confirmed": 0,
            "unchanged": 0,
            "replaced": 0,
            "removed": 0,
            "completed": 0,
            "retained": 0,
            "overflow": 0,
            "failed": 0,
        ]
    }

    private static func unsupportedStatus() -> PluginCallResultData {
        [
            "enabled": false,
            "hasOtherAccountOptIn": false,
            "permission": WatchSchedulePermission.unsupported.rawValue,
            "lastSuccessAt": NSNull(),
            "lastAttemptAt": NSNull(),
            "lastErrorCode": NSNull(),
            "counts": emptyCounts(),
            "skipped": [PluginCallResultData](),
            "pendingCleanupEventIDs": [Int](),
            "unresolvedEventIDs": [Int](),
            "otherAccountPending": false,
            "credentialExpiresAt": NSNull(),
        ]
    }

    private static func unsupportedResult() -> PluginCallResultData {
        [
            "outcome": "deferred",
            "deferral": "unsupportedDevice",
            "code": NSNull(),
            "status": unsupportedStatus(),
        ]
    }
}
