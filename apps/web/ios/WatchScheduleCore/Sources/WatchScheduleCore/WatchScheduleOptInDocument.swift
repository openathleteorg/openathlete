import Foundation

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
    }

    public static func encode(_ scope: AccountScope) -> Data? {
        try? JSONEncoder().encode(
            Stored(
                instanceURL: scope.instanceURL.absoluteString,
                athleteId: scope.athleteId
            )
        )
    }

    /// Decodes a `UserDefaults.object(forKey:)` result. `nil` is the only
    /// absent value; a present object of any other type is corrupt.
    public static func decode(object: Any?) throws -> AccountScope? {
        guard let object else {
            return nil
        }
        guard let data = object as? Data else {
            throw WatchScheduleOptInDocumentError.corrupt
        }
        return try decode(data: data)
    }

    public static func decode(data: Data) throws -> AccountScope {
        guard !data.isEmpty,
              let stored = try? JSONDecoder().decode(Stored.self, from: data),
              stored.athleteId > 0,
              let url = URL(string: stored.instanceURL)
        else {
            throw WatchScheduleOptInDocumentError.corrupt
        }
        return AccountScope(instanceURL: url, athleteId: stored.athleteId)
    }
}
