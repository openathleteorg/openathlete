import Foundation

/// The part of the last successful refresh shown in settings after a relaunch.
/// It is stored with the opt-in for exactly one athlete and API instance.
public struct WatchScheduleLastRefresh: Codable, Sendable {
    public let date: Date
    public let skipped: [SkippedScheduleEvent]
    public let overflow: Int
}

/// The on-device opt-in document. `UserDefaults` can hold a value of any type
/// under one key; only `nil` means "not set". A present value that is not the
/// expected data, or data that does not decode to a positive athlete on a real
/// URL, is corrupt. Collapsing that into "absent" would let a fence or recovery
/// acknowledge a retirement that never happened.
public enum WatchScheduleOptInDocumentError: Error, Equatable, Sendable {
    case corrupt
}

public enum WatchScheduleOptInDocument {
    private struct Stored: Codable {
        let instanceURL: String
        let athleteId: Int
        let lastRefresh: WatchScheduleLastRefresh?

        init(scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?) {
            instanceURL = scope.instanceURL.absoluteString
            athleteId = scope.athleteId
            self.lastRefresh = lastRefresh
        }

        init(from decoder: Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            instanceURL = try container.decode(String.self, forKey: .instanceURL)
            athleteId = try container.decode(Int.self, forKey: .athleteId)
            // This history is optional and grants no scheduling or cleanup
            // authority. Missing or damaged history must not disable the opt-in.
            if let refresh = try? container.decode(WatchScheduleLastRefresh.self, forKey: .lastRefresh),
               refresh.overflow >= 0 {
                lastRefresh = refresh
            } else {
                lastRefresh = nil
            }
        }
    }

    public static func encode(_ scope: AccountScope) -> Data? {
        try? encode(scope, lastRefresh: nil)
    }

    fileprivate static func encode(
        _ scope: AccountScope,
        lastRefresh: WatchScheduleLastRefresh?
    ) throws -> Data {
        try JSONEncoder().encode(Stored(scope: scope, lastRefresh: lastRefresh))
    }

    /// Decodes a `UserDefaults.object(forKey:)` result. `nil` is the only
    /// absent value; a present object of any other type is corrupt.
    public static func decode(object: Any?) throws -> AccountScope? {
        try decodeStatus(object: object)?.scope
    }

    fileprivate static func decodeStatus(object: Any?) throws -> (
        scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?
    )? {
        guard let object else {
            return nil
        }
        guard let data = object as? Data else {
            throw WatchScheduleOptInDocumentError.corrupt
        }
        return try decodeStatus(data: data)
    }

    public static func decode(data: Data) throws -> AccountScope {
        try decodeStatus(data: data).scope
    }

    private static func decodeStatus(data: Data) throws -> (
        scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?
    ) {
        guard !data.isEmpty,
              let stored = try? JSONDecoder().decode(Stored.self, from: data),
              stored.athleteId > 0,
              let url = URL(string: stored.instanceURL)
        else {
            throw WatchScheduleOptInDocumentError.corrupt
        }
        return (
            AccountScope(instanceURL: url, athleteId: stored.athleteId),
            stored.lastRefresh
        )
    }
}

/// Stores ownership and refresh history together so retiring the opt-in also
/// retires the history. UserDefaults is thread safe; the lock orders each
/// ownership check and mutation as one operation.
public final class UserDefaultsWatchScheduleOptIn: WatchScheduleOptInStore, @unchecked Sendable {
    public static let shared = UserDefaultsWatchScheduleOptIn()

    private let key = "org.openathlete.watch-schedule.opt-in"
    private let defaults: UserDefaults
    private let lock = NSLock()

    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    public func load() async throws -> AccountScope? {
        try await loadStatus()?.scope
    }

    public func loadStatus() async throws -> (
        scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?
    )? {
        try read()
    }

    public func save(_ scope: AccountScope) async throws {
        try lock.withLock {
            if try read()?.scope != scope {
                let data = try WatchScheduleOptInDocument.encode(scope, lastRefresh: nil)
                defaults.set(data, forKey: key)
            }
        }
    }

    public func saveLastRefresh(_ refresh: WatchScheduleLastRefresh, for scope: AccountScope) async throws {
        try lock.withLock {
            guard try read()?.scope == scope else {
                return
            }
            let data = try WatchScheduleOptInDocument.encode(scope, lastRefresh: refresh)
            defaults.set(data, forKey: key)
        }
    }

    public func clear() async throws {
        lock.withLock { defaults.removeObject(forKey: key) }
    }

    /// A synchronous read for background task registration.
    public func loadSync() -> AccountScope? {
        try? read()?.scope
    }

    private func read() throws -> (scope: AccountScope, lastRefresh: WatchScheduleLastRefresh?)? {
        // object(forKey:) preserves the difference between missing and corrupt.
        try WatchScheduleOptInDocument.decodeStatus(object: defaults.object(forKey: key))
    }
}
