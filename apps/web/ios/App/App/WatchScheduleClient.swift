import Foundation
import WatchScheduleCore

/// URLSession transport for the own-calendar snapshot.
///
/// Wire contract, from `apps/web/src/api/event/event.api.ts` and
/// `apps/web/src/api/athlete/athlete.api.ts`:
/// - `GET /athlete/me` with the pinned bearer before any calendar list. Its
///   `athleteId` must equal the requested scope: a token for another athlete
///   can otherwise return that athlete's calendar, or an empty one;
/// - `GET /event?startDate=…&endDate=…`, without `coach` or `athleteId`: the
///   bearer token already scopes it to the signed-in athlete's own calendar,
///   including sessions a coach planned for them;
/// - `GET /event/:eventId` only when a calendar row has no workout;
/// - `GET /training-zone/athlete/:athleteId` for that same athlete.
///
/// Security:
/// - the bearer token is only attached to a request whose origin (scheme,
///   host, port) is the credential's instance origin;
/// - redirects to another origin are refused instead of followed, so the
///   header is never replayed to a third party;
/// - cookies and cached responses are disabled, so an account switch cannot
///   read the previous account's response;
/// - cleartext HTTP is only accepted on loopback, where the iOS simulator
///   reaches a local API.
final class WatchScheduleClient: NSObject, ScheduleTransport, @unchecked Sendable {
    private let credentialProvider: any WatchScheduleCredentialProviding
    private let now: () -> Date
    private let session: URLSession

    /// Credentials expire slightly early so a request does not start with a
    /// token that will be rejected before it reaches the API.
    private static let credentialLeeway: TimeInterval = 30

    init(
        credentialProvider: any WatchScheduleCredentialProviding,
        configuration: URLSessionConfiguration = .ephemeral,
        now: @escaping () -> Date = Date.init
    ) {
        self.credentialProvider = credentialProvider
        self.now = now

        let configuration = configuration.copy() as! URLSessionConfiguration
        // The snapshot is account- and instance-scoped; no shared cookies or
        // cached calendar may survive an account switch.
        configuration.httpShouldSetCookies = false
        configuration.httpCookieStorage = nil
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(
            configuration: configuration,
            delegate: WatchScheduleRedirectGuard(),
            delegateQueue: nil
        )
        super.init()
    }

    deinit {
        session.finishTasksAndInvalidate()
    }

    // MARK: - ScheduleTransport

    /// Proves which athlete the pinned bearer belongs to. This is the native
    /// defense against a credential installed for another account: the
    /// lifecycle calls it before opting in, and `ScheduleSource` calls it
    /// before any authoritative (including empty) calendar list.
    func ownAthleteId(scope: AccountScope) async throws -> Int {
        let athlete: OwnAthleteInput = try await get(
            scope: scope,
            path: "/athlete/me"
        )
        return athlete.athleteId
    }

    func listEvents(
        scope: AccountScope,
        from: Date,
        to: Date
    ) async throws -> [CalendarEventInput] {
        // No `coach` and no `athleteId`: `coach=false` keeps this to the
        // signed-in athlete, and `athleteId` is ignored in that mode. Sending
        // the coach's currently viewed athlete would read a foreign calendar.
        try await get(
            scope: scope,
            path: "/event",
            queryItems: [
                URLQueryItem(name: "startDate", value: Self.isoString(from)),
                URLQueryItem(name: "endDate", value: Self.isoString(to)),
            ]
        )
    }

    func eventDetail(
        scope: AccountScope,
        eventId: Int
    ) async throws -> CalendarEventInput {
        guard eventId > 0 else {
            throw ScheduleTransportError.invalidURL
        }
        return try await get(scope: scope, path: "/event/\(eventId)")
    }

    func trainingZones(scope: AccountScope) async throws -> [ZoneInput] {
        try await get(
            scope: scope,
            path: "/training-zone/athlete/\(scope.athleteId)"
        )
    }

    // MARK: - Requests

    private func get<Response: Decodable>(
        scope: AccountScope,
        path: String,
        queryItems: [URLQueryItem] = []
    ) async throws -> Response {
        let credential = try await credential(for: scope)
        let url = try makeURL(scope: scope, path: path, queryItems: queryItems)

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(
            "Bearer \(credential.accessToken)",
            forHTTPHeaderField: "Authorization"
        )
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        // Revalidate every authenticated read and never store the response.
        // A cached or partial list must not become an authoritative calendar.
        request.setValue(
            "no-cache, no-store",
            forHTTPHeaderField: "Cache-Control"
        )
        request.setValue("no-cache", forHTTPHeaderField: "Pragma")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError where error.code == .cancelled {
            if Task.isCancelled {
                throw CancellationError()
            }
            throw ScheduleTransportError.transportFailure(status: nil)
        } catch {
            throw ScheduleTransportError.transportFailure(status: nil)
        }

        guard let http = response as? HTTPURLResponse else {
            throw ScheduleTransportError.invalidResponse
        }
        // Redirects are refused. A final URL that still differs from the
        // canonical instance endpoint means a proxy or cache changed the
        // request; its representation cannot be authoritative.
        guard let finalURL = http.url,
              finalURL.absoluteString == url.absoluteString
        else {
            throw ScheduleTransportError.invalidResponse
        }
        // 206 and a Content-Range marker both describe part of a resource,
        // never the complete own calendar. Only a full 200 is accepted.
        switch http.statusCode {
        case 200:
            guard http.value(forHTTPHeaderField: "Content-Range") == nil else {
                throw ScheduleTransportError.invalidResponse
            }
        case 401:
            throw ScheduleTransportError.unauthorized
        case 403, 404:
            throw ScheduleTransportError.eventNotFound
        case 200..<300:
            throw ScheduleTransportError.invalidResponse
        default:
            throw ScheduleTransportError.transportFailure(
                status: http.statusCode
            )
        }

        do {
            return try ScheduleWireCoding.decoder().decode(
                Response.self,
                from: data
            )
        } catch {
            throw ScheduleTransportError.invalidResponse
        }
    }

    private func credential(
        for scope: AccountScope
    ) async throws -> WatchScheduleCredential {
        let credential: WatchScheduleCredential?
        do {
            credential = try await credentialProvider.credential(for: scope)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as ScheduleTransportError {
            throw error
        } catch {
            throw ScheduleTransportError.transportFailure(status: nil)
        }

        // Missing means the app session ended; never fall back to a cached
        // token or the previously selected instance.
        guard let credential else {
            throw ScheduleTransportError.unauthorized
        }
        guard credential.scope == scope else {
            throw ScheduleTransportError.scopeMismatch
        }
        guard !credential.accessToken
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .isEmpty
        else {
            throw ScheduleTransportError.unauthorized
        }
        if let expiresAt = credential.expiresAt,
           expiresAt <= now().addingTimeInterval(Self.credentialLeeway) {
            throw ScheduleTransportError.credentialExpired
        }
        return credential
    }

    private func makeURL(
        scope: AccountScope,
        path: String,
        queryItems: [URLQueryItem]
    ) throws -> URL {
        guard var components = URLComponents(
            url: scope.instanceURL,
            resolvingAgainstBaseURL: false
        ),
            let scheme = components.scheme?.lowercased(),
            components.host != nil
        else {
            throw ScheduleTransportError.invalidURL
        }
        // The transport only accepts a canonical instance base: no userinfo,
        // query, fragment or trailing slash, and a lowercase scheme/host.
        // AccountScope already normalises these; this is the fail-closed check.
        guard components.user == nil,
              components.password == nil,
              components.query == nil,
              components.fragment == nil,
              components.scheme == scheme,
              components.host == components.host?.lowercased(),
              components.path.isEmpty
                || (components.path != "/"
                    && !components.path.hasSuffix("/"))
        else {
            throw ScheduleTransportError.invalidURL
        }
        guard scheme == "https"
            || (scheme == "http" && Self.isLoopback(components.host))
        else {
            throw ScheduleTransportError.insecureOrigin
        }

        // The instance may live under a path (for example `/api`), so append
        // rather than replacing the base path.
        var basePath = components.path
        if basePath.hasSuffix("/") {
            basePath.removeLast()
        }
        components.path = basePath + path
        components.queryItems = queryItems.isEmpty ? nil : queryItems
        components.fragment = nil

        guard let url = components.url else {
            throw ScheduleTransportError.invalidURL
        }
        return url
    }

    private static func isoString(_ date: Date) -> String {
        Date.ISO8601FormatStyle(includingFractionalSeconds: true)
            .format(date)
    }

    private static func isLoopback(_ host: String?) -> Bool {
        guard let host = host?.lowercased() else {
            return false
        }
        return host == "localhost"
            || host == "127.0.0.1"
            || host == "::1"
    }
}

// MARK: - Redirects

/// Authenticated native reads deny every redirect. Even a same-origin
/// redirect can change the API base path, endpoint or query and carry the
/// bearer token to a representation from another instance. Returning nil
/// leaves the 30x response for the caller, which rejects the non-200 status;
/// the Authorization header is never replayed.
private final class WatchScheduleRedirectGuard: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}
